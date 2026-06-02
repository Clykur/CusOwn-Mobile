-- 1. Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Customer Preferences
    booking_updates BOOLEAN DEFAULT TRUE,
    booking_reminders BOOLEAN DEFAULT TRUE,
    payment_updates BOOLEAN DEFAULT TRUE,
    marketing_notifications BOOLEAN DEFAULT FALSE,
    -- Owner Preferences
    booking_requests BOOLEAN DEFAULT TRUE,
    cancellations BOOLEAN DEFAULT TRUE,
    payout_notifications BOOLEAN DEFAULT TRUE,
    business_updates BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to update 'updated_at' on notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at_trigger
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_push_tokens_updated_at();

-- RLS for notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own preferences" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);


-- 2. Notification Queue Table
CREATE TYPE notification_queue_status AS ENUM ('pending', 'processing', 'sent', 'failed', 'dead_letter');

CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status notification_queue_status NOT NULL DEFAULT 'pending',
    retry_count INTEGER NOT NULL DEFAULT 0,
    next_retry_at TIMESTAMPTZ DEFAULT NOW(),
    last_error TEXT,
    locked_at TIMESTAMPTZ,
    locked_by TEXT, -- e.g., worker ID
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON public.notification_queue(status, next_retry_at) WHERE status IN ('pending', 'failed');
CREATE INDEX IF NOT EXISTS idx_notification_queue_user ON public.notification_queue(target_user_id);

-- RLS: Only Service Role should manage queue directly
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages queue" ON public.notification_queue USING (true) WITH CHECK (true);


-- 3. Notification Logs Table
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID REFERENCES public.notification_queue(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    push_token TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    title TEXT,
    body TEXT,
    status TEXT NOT NULL, -- 'success', 'error', 'provider_error'
    error_message TEXT,
    provider_response JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_token ON public.notification_logs(push_token);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON public.notification_logs(created_at);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own logs" ON public.notification_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages logs" ON public.notification_logs USING (true) WITH CHECK (true);


-- 4. Notification Analytics (Materialized View for Performance)
-- Create a view to track delivery rates, error rates, and opens
-- Assuming we add 'opened_at' to notification_logs when user clicks a notification. Let's alter table first.
ALTER TABLE public.notification_logs ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;

CREATE OR REPLACE VIEW public.notification_analytics_summary AS
SELECT 
    DATE_TRUNC('day', created_at) AS date,
    notification_type,
    COUNT(*) AS total_sent,
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS successful_deliveries,
    SUM(CASE WHEN status = 'error' OR status = 'provider_error' THEN 1 ELSE 0 END) AS failures,
    SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) AS total_opened,
    ROUND(SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)::numeric / GREATEST(COUNT(*), 1) * 100, 2) AS delivery_rate_pct,
    ROUND(SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END)::numeric / GREATEST(SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END), 1) * 100, 2) AS open_rate_pct
FROM public.notification_logs
GROUP BY DATE_TRUNC('day', created_at), notification_type;


-- 5. Helper Function to Queue Notifications from DB Triggers (Refactoring previous direct-send logic)
-- We will replace the previous direct POST logic with a queue insertion logic
CREATE OR REPLACE FUNCTION queue_notification(target_id UUID, evt TEXT, rcd JSONB)
RETURNS void AS $$
BEGIN
    INSERT INTO public.notification_queue (target_user_id, event_type, payload)
    VALUES (target_id, evt, rcd);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Cron Jobs for Queue Processing and Token Cleanup
-- Every 1 minute, process the queue (sweeper for retries, primary worker should be awakened by trigger ideally, but cron works as fallback)
-- SELECT cron.schedule('process_notification_queue', '* * * * *', $$
--     SELECT net.http_post(
--         url := current_setting('app.settings.edge_function_url', true) || '/worker-notification',
--         headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)),
--         body := '{}'::jsonb
--     );
-- $$);

-- Every day at 2 AM, clean up invalid tokens
-- SELECT cron.schedule('cleanup_invalid_tokens_daily', '0 2 * * *', $$
--     SELECT net.http_post(
--         url := current_setting('app.settings.edge_function_url', true) || '/cleanup-invalid-tokens',
--         headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)),
--         body := '{}'::jsonb
--     );
-- $$);
