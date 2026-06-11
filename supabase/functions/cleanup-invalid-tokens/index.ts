// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    // 1. Find all tokens that recently received 'DeviceNotRegistered' errors
    // Expo returns "DeviceNotRegistered" as details.error when the token is invalid
    const { data: logs, error: logsError } = await supabase
      .from('notification_logs')
      .select('push_token')
      .eq('status', 'provider_error')
      .filter('provider_response->details->>error', 'eq', 'DeviceNotRegistered')
      // Look at the last 24 hours to avoid re-processing old logs unnecessarily
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (logsError) throw logsError;

    if (!logs || logs.length === 0) {
      return new Response(JSON.stringify({ message: 'No invalid tokens found' }), { status: 200 });
    }

    // Deduplicate tokens
    const invalidTokens = [...new Set(logs.map((l) => l.push_token))];

    // 2. Delete them from push_tokens
    const { error: deleteError } = await supabase
      .from('push_tokens')
      .delete()
      .in('token', invalidTokens);

    if (deleteError) throw deleteError;

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount: invalidTokens.length,
        tokens: invalidTokens,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
