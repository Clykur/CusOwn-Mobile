-- 1. Create push_tokens table
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT, -- 'ios', 'android', 'web'
    provider TEXT DEFAULT 'expo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS push_tokens_user_id_idx ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS push_tokens_token_idx ON public.push_tokens(token);

-- Trigger to update 'updated_at' on push_tokens
CREATE OR REPLACE FUNCTION update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_push_tokens_updated_at_trigger
BEFORE UPDATE ON public.push_tokens
FOR EACH ROW
EXECUTE FUNCTION update_push_tokens_updated_at();


-- 2. Row Level Security (RLS)
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push tokens"
    ON public.push_tokens FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens"
    ON public.push_tokens FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens"
    ON public.push_tokens FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens"
    ON public.push_tokens FOR DELETE
    USING (auth.uid() = user_id);

-- Service Role Bypass (for Edge Functions)
CREATE POLICY "Service role can manage all push tokens"
    ON public.push_tokens
    USING (true)
    WITH CHECK (true);


-- 3. Webhook Trigger for Bookings Table
-- Assuming 'bookings' table exists and has 'status', 'customer_id', 'owner_id'

CREATE OR REPLACE FUNCTION notify_booking_changes()
RETURNS TRIGGER AS $$
DECLARE
    webhook_url TEXT := current_setting('app.settings.edge_function_url', true) || '/send-notification';
    service_role_key TEXT := current_setting('app.settings.service_role_key', true);
    payload JSON;
BEGIN
    -- Only proceed if we have the URL and Key (they should be set in Supabase Vault or custom settings)
    IF webhook_url IS NULL OR service_role_key IS NULL THEN
        -- Fallback: Use standard localhost for local development if not configured
        webhook_url := 'http://host.docker.internal:54321/functions/v1/send-notification';
        -- For production, these MUST be set via Supabase dashboard custom settings or vault.
    END IF;

    -- Build payload based on event
    IF TG_OP = 'INSERT' THEN
        -- New booking request
        payload := json_build_object(
            'event', 'NEW_BOOKING_REQUEST',
            'record', row_to_json(NEW)
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        IF NEW.status = 'confirmed' THEN
             payload := json_build_object(
                'event', 'BOOKING_CONFIRMED',
                'record', row_to_json(NEW)
            );
        ELSIF NEW.status = 'cancelled' THEN
             payload := json_build_object(
                'event', 'BOOKING_CANCELLED',
                'record', row_to_json(NEW),
                'old_record', row_to_json(OLD)
            );
        ELSIF NEW.status = 'rejected' THEN
             payload := json_build_object(
                'event', 'BOOKING_REJECTED',
                'record', row_to_json(NEW)
            );
        END IF;
    END IF;

    -- Send HTTP request to Edge Function
    IF payload IS NOT NULL THEN
        PERFORM net.http_post(
            url := webhook_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || service_role_key
            ),
            body := payload::jsonb
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Triggers on Bookings
DROP TRIGGER IF EXISTS on_booking_created ON public.bookings;
CREATE TRIGGER on_booking_created
    AFTER INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_booking_changes();

DROP TRIGGER IF EXISTS on_booking_updated ON public.bookings;
CREATE TRIGGER on_booking_updated
    AFTER UPDATE OF status ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_booking_changes();


-- 4. Reminder System (Requires pg_cron extension)
-- Enable the pg_cron extension if not already enabled.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to check for upcoming bookings and send reminders
CREATE OR REPLACE FUNCTION check_and_send_reminders()
RETURNS void AS $$
DECLARE
    webhook_url TEXT := current_setting('app.settings.edge_function_url', true) || '/send-notification';
    service_role_key TEXT := current_setting('app.settings.service_role_key', true);
    booking RECORD;
    payload JSON;
BEGIN
    IF webhook_url IS NULL OR service_role_key IS NULL THEN
        webhook_url := 'http://host.docker.internal:54321/functions/v1/send-notification';
    END IF;

    -- Find bookings starting in exactly 24 hours or 1 hour
    FOR booking IN 
        SELECT * FROM public.bookings
        WHERE status = 'confirmed'
        AND (
            date_trunc('hour', start_time) = date_trunc('hour', NOW() + INTERVAL '24 hours')
            OR
            date_trunc('hour', start_time) = date_trunc('hour', NOW() + INTERVAL '1 hour')
        )
    LOOP
        payload := json_build_object(
            'event', 'BOOKING_REMINDER',
            'record', row_to_json(booking)
        );

        PERFORM net.http_post(
            url := webhook_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || service_role_key
            ),
            body := payload::jsonb
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the cron job to run every hour
-- SELECT cron.schedule('booking_reminders_hourly', '0 * * * *', $$SELECT check_and_send_reminders()$$);
