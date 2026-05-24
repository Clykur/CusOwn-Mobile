-- 1. Create Flash Deals Table (if not exists)
CREATE TABLE IF NOT EXISTS public.flash_deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    discount_text TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for flash deals
ALTER TABLE public.flash_deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Flash deals are viewable by everyone" ON public.flash_deals;
CREATE POLICY "Flash deals are viewable by everyone" ON public.flash_deals FOR SELECT USING (true);

-- 2. RPC: Get Nearby Available Salons
-- Note: Uses simple geometric distance based on lat/lng (approx 111km per degree)
-- In a production environment, use PostGIS for more accurate geographic calculations.
CREATE OR REPLACE FUNCTION get_nearby_available_salons(user_lat FLOAT, user_lng FLOAT)
RETURNS TABLE (
    id UUID,
    owner_user_id UUID,
    salon_name TEXT,
    address TEXT,
    rating_avg NUMERIC,
    distance_km FLOAT,
    next_available_time TEXT,
    starting_price NUMERIC,
    opening_time TEXT,
    closing_time TEXT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.owner_user_id,
        b.salon_name,
        b.address,
        b.rating_avg,
        -- Simple Euclidean distance approximation (1 degree approx 111.32 km)
        -- Will fallback to 0 if location is 0,0 or missing
        COALESCE(
            SQRT(POWER(b.latitude - user_lat, 2) + POWER(b.longitude - user_lng, 2)) * 111.32,
            0
        ) AS distance_km,
        'Available Now'::TEXT AS next_available_time, -- Placeholder for actual availability logic
        COALESCE((SELECT MIN(price_cents) FROM services s WHERE s.business_id = b.id), 0) / 100.0 AS starting_price,
        b.opening_time,
        b.closing_time
    FROM businesses b
    WHERE b.suspended = false 
      AND b.deleted_at IS NULL
      -- If we had a strict "open now" requirement we could check time:
      -- AND CURRENT_TIME::time BETWEEN b.opening_time::time AND b.closing_time::time
    ORDER BY distance_km ASC, b.rating_avg DESC
    LIMIT 10;
END;
$$;

-- 3. RPC: Get Trending Services
CREATE OR REPLACE FUNCTION get_trending_services()
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    booking_count BIGINT,
    starting_price NUMERIC,
    business_id UUID
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        'Trending'::TEXT AS category, -- Should be linked to categories if available in schema
        COUNT(b.id) AS booking_count,
        s.price_cents / 100.0 AS starting_price,
        s.business_id
    FROM services s
    LEFT JOIN bookings b ON b.service_id = s.id
    -- WHERE b.created_at >= NOW() - INTERVAL '7 days' (optional)
    GROUP BY s.id
    ORDER BY booking_count DESC
    LIMIT 5;
END;
$$;

-- 4. RPC: Get Active Deals
CREATE OR REPLACE FUNCTION get_active_deals()
RETURNS TABLE (
    id UUID,
    business_id UUID,
    salon_name TEXT,
    title TEXT,
    discount_text TEXT,
    expires_at TIMESTAMPTZ
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fd.id,
        fd.business_id,
        b.salon_name,
        fd.title,
        fd.discount_text,
        fd.expires_at
    FROM flash_deals fd
    JOIN businesses b ON b.id = fd.business_id
    WHERE fd.expires_at > NOW()
    ORDER BY fd.expires_at ASC
    LIMIT 5;
END;
$$;
