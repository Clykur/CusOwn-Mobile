-- 1. Enable Supabase Realtime for notification_logs
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_logs;

-- 2. Add category and deep_link columns if they don't exist
ALTER TABLE public.notification_logs ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.notification_logs ADD COLUMN IF NOT EXISTS deep_link TEXT;

ALTER TABLE public.notification_queue ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.notification_queue ADD COLUMN IF NOT EXISTS deep_link TEXT;

-- 3. Enhance queue_notification to accept category and deep_link
DROP FUNCTION IF EXISTS queue_notification(UUID, TEXT, JSONB);

CREATE OR REPLACE FUNCTION queue_notification(
    target_id UUID, 
    evt TEXT, 
    rcd JSONB, 
    cat TEXT DEFAULT NULL, 
    dl TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.notification_queue (target_user_id, event_type, payload, category, deep_link)
    VALUES (target_id, evt, rcd, cat, dl);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Update Bookings Trigger to use the queue properly
CREATE OR REPLACE FUNCTION notify_booking_changes()
RETURNS TRIGGER AS $$
DECLARE
    target_customer_id UUID;
    target_business_owner_id UUID;
BEGIN
    -- Determine target users
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        target_customer_id := NEW.customer_user_id;
        
        -- Get the business owner ID
        SELECT owner_user_id INTO target_business_owner_id 
        FROM public.businesses 
        WHERE id = NEW.business_id;
    END IF;

    -- Handle INSERT (New Booking)
    IF TG_OP = 'INSERT' THEN
        -- Notify Business
        PERFORM queue_notification(
            target_business_owner_id, 
            'NEW_BOOKING_REQUEST', 
            row_to_json(NEW)::jsonb,
            'booking',
            '/booking-detail/' || NEW.id
        );
        
    -- Handle UPDATE (Status changes)
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        IF NEW.status = 'confirmed' THEN
            -- Notify Customer
            PERFORM queue_notification(
                target_customer_id, 
                'BOOKING_CONFIRMED', 
                row_to_json(NEW)::jsonb,
                'booking',
                '/booking-detail/' || NEW.id
            );
        ELSIF NEW.status = 'cancelled' THEN
            -- Notify Customer
            PERFORM queue_notification(
                target_customer_id, 
                'BOOKING_CANCELLED', 
                row_to_json(NEW)::jsonb,
                'booking',
                '/booking-detail/' || NEW.id
            );
            -- Notify Business
            PERFORM queue_notification(
                target_business_owner_id, 
                'BOOKING_CANCELLED', 
                row_to_json(NEW)::jsonb,
                'booking',
                '/booking-detail/' || NEW.id
            );
        ELSIF NEW.status = 'rejected' THEN
            -- Notify Customer
            PERFORM queue_notification(
                target_customer_id, 
                'BOOKING_REJECTED', 
                row_to_json(NEW)::jsonb,
                'booking',
                '/booking-detail/' || NEW.id
            );
        ELSIF NEW.status = 'completed' THEN
            -- Notify Customer
            PERFORM queue_notification(
                target_customer_id, 
                'BOOKING_COMPLETED', 
                row_to_json(NEW)::jsonb,
                'booking',
                '/booking-detail/' || NEW.id
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Add Reviews Trigger
CREATE OR REPLACE FUNCTION notify_review_changes()
RETURNS TRIGGER AS $$
DECLARE
    target_business_owner_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Get the business owner ID
        SELECT owner_user_id INTO target_business_owner_id 
        FROM public.businesses 
        WHERE id = NEW.business_id;

        -- Notify Business
        PERFORM queue_notification(
            target_business_owner_id, 
            'NEW_REVIEW_RECEIVED', 
            row_to_json(NEW)::jsonb,
            'review',
            '/(owner)/reviews'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to reviews table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'reviews') THEN
        DROP TRIGGER IF EXISTS on_review_created ON public.reviews;
        CREATE TRIGGER on_review_created
            AFTER INSERT ON public.reviews
            FOR EACH ROW
            EXECUTE FUNCTION notify_review_changes();
    END IF;
END $$;
