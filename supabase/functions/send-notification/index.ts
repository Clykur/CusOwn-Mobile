// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface WebhookPayload {
  event: string;
  record: any;
  old_record?: any;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function determineTargetUserId(event: string, record: any): string | null {
  switch (event) {
    case 'NEW_BOOKING_REQUEST':
      return record.owner_id;
    case 'BOOKING_CONFIRMED':
    case 'BOOKING_REJECTED':
    case 'BOOKING_REMINDER':
      return record.customer_id;
    case 'BOOKING_CANCELLED':
      return record.owner_id;
    default:
      return null;
  }
}

// Check user preferences before queueing
async function userWantsNotification(userId: string, event: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return true; // Default to true if no preference record exists

  switch (event) {
    case 'NEW_BOOKING_REQUEST':
      return data.booking_requests !== false;
    case 'BOOKING_CONFIRMED':
    case 'BOOKING_REJECTED':
      return data.booking_updates !== false;
    case 'BOOKING_CANCELLED':
      return data.cancellations !== false;
    case 'BOOKING_REMINDER':
      return data.booking_reminders !== false;
    default:
      return true;
  }
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const payload: WebhookPayload = await req.json();
    console.log('Received payload for queueing:', payload);

    if (!payload.event || !payload.record) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const targetUserId = determineTargetUserId(payload.event, payload.record);

    if (!targetUserId) {
      console.log(`No target user for event: ${payload.event}`);
      return new Response(JSON.stringify({ message: 'Event ignored' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Respect preferences
    const wantsNotification = await userWantsNotification(targetUserId, payload.event);
    if (!wantsNotification) {
      console.log(`User ${targetUserId} opted out of ${payload.event}. Skipping queue.`);
      return new Response(JSON.stringify({ message: 'Opted out' }), { status: 200 });
    }

    // Insert into queue
    const { error } = await supabase.from('notification_queue').insert({
      target_user_id: targetUserId,
      event_type: payload.event,
      payload: payload.record,
      status: 'pending',
    });

    if (error) {
      throw error;
    }

    // Optional: Immediately awake the worker by calling its URL
    // fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/worker-notification`, { method: 'POST' }).catch(console.error);

    return new Response(JSON.stringify({ success: true, message: 'Queued' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
