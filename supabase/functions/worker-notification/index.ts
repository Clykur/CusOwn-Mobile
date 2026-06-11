// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';
const MAX_RETRIES = 3;
const BATCH_SIZE = 100; // Expo allows up to 100 per request

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface QueueItem {
  id: string;
  target_user_id: string;
  event_type: string;
  payload: any;
  retry_count: number;
  category?: string;
  deep_link?: string;
}

function buildNotificationContent(
  event: string,
  record: any,
): { title: string; body: string; url: string } | null {
  switch (event) {
    case 'NEW_BOOKING_REQUEST':
      return {
        title: 'New Booking Request',
        body: `You have a new booking request from a customer.`,
        url: `/owner/bookings/${record.id}`,
      };
    case 'BOOKING_CONFIRMED':
      return {
        title: 'Booking Confirmed!',
        body: `Your booking has been confirmed.`,
        url: `/booking-detail/${record.id}`,
      };
    case 'BOOKING_REJECTED':
      return {
        title: 'Booking Update',
        body: `Unfortunately, your booking request was rejected.`,
        url: `/booking-detail/${record.id}`,
      };
    case 'BOOKING_CANCELLED':
      return {
        title: 'Booking Cancelled',
        body: `A booking has been cancelled.`,
        url: `/booking-detail/${record.id}`, // Routing logic could be more complex
      };
    case 'BOOKING_REMINDER':
      return {
        title: 'Upcoming Booking Reminder',
        body: `You have a booking coming up soon!`,
        url: `/booking-detail/${record.id}`,
      };
    default:
      return null;
  }
}

async function processBatch(jobs: QueueItem[]) {
  const workerId = `worker-${crypto.randomUUID()}`;

  // 1. Lock rows
  const jobIds = jobs.map((j) => j.id);
  const { error: lockError } = await supabase
    .from('notification_queue')
    .update({ status: 'processing', locked_at: new Date().toISOString(), locked_by: workerId })
    .in('id', jobIds);

  if (lockError) {
    console.error('Failed to lock jobs:', lockError);
    return;
  }

  // 2. Fetch push tokens for all target users
  const userIds = [...new Set(jobs.map((j) => j.target_user_id))];
  const { data: tokensData, error: tokensError } = await supabase
    .from('push_tokens')
    .select('user_id, token')
    .in('user_id', userIds);

  if (tokensError) {
    console.error('Failed to fetch tokens:', tokensError);
    // Mark all as failed to retry later
    await supabase
      .from('notification_queue')
      .update({ status: 'failed', last_error: 'Token fetch failed' })
      .in('id', jobIds);
    return;
  }

  // Map tokens to users
  const userTokens: Record<string, string[]> = {};
  tokensData?.forEach((t) => {
    if (!userTokens[t.user_id]) userTokens[t.user_id] = [];
    userTokens[t.user_id].push(t.token);
  });

  // 3. Prepare Expo Payloads & Log Entries
  const expoMessages = [];
  const logEntries = [];
  const processedJobIds = [];
  const noTokenJobIds = [];

  for (const job of jobs) {
    const content = buildNotificationContent(job.event_type, job.payload);
    if (!content) {
      // Unsupported event, clear it from queue
      noTokenJobIds.push(job.id);
      continue;
    }

    const tokens = userTokens[job.target_user_id] || [];
    processedJobIds.push(job.id);

    // 1. Always create an in-app notification log, even if no push tokens exist
    const baseLogEntry = {
      queue_id: job.id,
      user_id: job.target_user_id,
      notification_type: job.event_type,
      title: content.title,
      body: content.body,
      category: job.category,
      deep_link: job.deep_link || content.url,
      status: 'success', // Default to success for in-app
    };

    if (tokens.length === 0) {
      // User has no push tokens, just log it for in-app viewing
      baseLogEntry.push_token = 'none';
      logEntries.push(baseLogEntry);
    } else {
      // User has push tokens, prepare push notifications
      for (const token of tokens) {
        expoMessages.push({
          to: token,
          sound: 'default',
          title: content.title,
          body: content.body,
          data: { event: job.event_type, url: content.url },
        });

        logEntries.push({
          ...baseLogEntry,
          push_token: token,
          status: 'pending', // Will update after Expo response
        });
      }
    }
  }

  // Handle unsupported events
  if (noTokenJobIds.length > 0) {
    await supabase.from('notification_queue').update({ status: 'sent' }).in('id', noTokenJobIds);
  }

  // If there are logs to insert, but no expo messages, just insert logs and we are done
  if (expoMessages.length === 0 && logEntries.length > 0) {
    await supabase.from('notification_logs').insert(logEntries);
    await supabase.from('notification_queue').update({ status: 'sent' }).in('id', processedJobIds);
    return;
  }

  if (expoMessages.length === 0) return;

  // 4. Send to Expo
  let expoResponse = [];
  try {
    const res = await fetch(EXPO_PUSH_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expoMessages),
    });
    const result = await res.json();
    expoResponse = result.data || [];
  } catch (error) {
    console.error('Expo API network error:', error);
    // Exponential backoff logic
    for (const job of jobs.filter((j) => processedJobIds.includes(j.id))) {
      const isDeadLetter = job.retry_count >= MAX_RETRIES;
      const nextRetry = new Date(Date.now() + Math.pow(2, job.retry_count) * 60000); // 1, 2, 4 min

      await supabase
        .from('notification_queue')
        .update({
          status: isDeadLetter ? 'dead_letter' : 'failed',
          retry_count: job.retry_count + 1,
          next_retry_at: isDeadLetter ? null : nextRetry.toISOString(),
          last_error: error.message,
        })
        .eq('id', job.id);
    }
    return;
  }

  // 5. Update Logs based on Expo Response
  // Expo returns an array matching the order of sent messages
  for (let i = 0; i < expoMessages.length; i++) {
    const receipt = expoResponse[i] || {};
    const logEntry = logEntries[i];

    logEntry.status =
      receipt.status === 'ok' ? 'success' : receipt.status === 'error' ? 'provider_error' : 'error';
    logEntry.error_message = receipt.message || null;
    logEntry.provider_response = receipt;

    if (receipt.status === 'ok') {
      logEntry.delivered_at = new Date().toISOString();
    }
  }

  await supabase.from('notification_logs').insert(logEntries);

  // 6. Finalize Queue Jobs
  // If ANY token for a job failed, we could requeue, but usually partial success is considered sent.
  // For simplicity, we mark jobs as sent if they reached Expo without a network crash.
  await supabase.from('notification_queue').update({ status: 'sent' }).in('id', processedJobIds);
}

serve(async (req) => {
  try {
    // Poll queue for pending or due-for-retry jobs
    const { data: jobs, error } = await supabase
      .from('notification_queue')
      .select('*')
      .in('status', ['pending', 'failed'])
      .lte('next_retry_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (error) throw error;

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ message: 'Queue empty' }), { status: 200 });
    }

    await processBatch(jobs);

    return new Response(JSON.stringify({ processed: jobs.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Worker error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
