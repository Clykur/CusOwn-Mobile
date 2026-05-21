-- Create the idempotent_requests table which is required by the booking RPCs
-- to prevent duplicate bookings if the user taps the button multiple times or network drops.

CREATE TABLE IF NOT EXISTS public.idempotent_requests (
    idempotency_key text PRIMARY KEY,
    booking_id text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure security
ALTER TABLE public.idempotent_requests ENABLE ROW LEVEL SECURITY;

-- Allow the postgres role / service roles (which our SECURITY DEFINER RPCs use) to insert/select
-- Customers don't need direct access since the RPC handles it internally.
CREATE POLICY "Allow all operations for service roles" 
    ON public.idempotent_requests
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
