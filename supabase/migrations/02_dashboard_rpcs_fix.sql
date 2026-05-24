-- 1. Fix RPC: Get Nearby Available Salons
-- Issue: Returned type time without time zone does not match expected type text in column 9 (opening_time)
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
        'Available Now'::TEXT AS next_available_time,
        COALESCE((SELECT MIN(price_cents) FROM services s WHERE s.business_id = b.id), 0) / 100.0 AS starting_price,
        b.opening_time::TEXT,
        b.closing_time::TEXT
    FROM businesses b
    WHERE b.suspended = false 
      AND b.deleted_at IS NULL
    ORDER BY distance_km ASC, b.rating_avg DESC
    LIMIT 10;
END;
$$;


-- 2. Fix RPC: Get Trending Services
-- Issue: column b.service_id does not exist (bookings -> booking_services)
DROP FUNCTION IF EXISTS get_trending_services();

CREATE OR REPLACE FUNCTION get_trending_services()
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    booking_count BIGINT,
    starting_price NUMERIC,
    business_id UUID,
    salon_name TEXT,
    rating_avg NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        'Trending'::TEXT AS category,
        COUNT(bs.booking_id) AS booking_count,
        s.price_cents / 100.0 AS starting_price,
        s.business_id,
        b.salon_name,
        b.rating_avg
    FROM services s
    LEFT JOIN booking_services bs ON bs.service_id = s.id
    LEFT JOIN businesses b ON b.id = s.business_id
    WHERE b.suspended = false AND b.deleted_at IS NULL
    GROUP BY s.id, b.salon_name, b.rating_avg
    ORDER BY b.rating_avg DESC NULLS LAST, booking_count DESC
    LIMIT 5;
END;
$$;
