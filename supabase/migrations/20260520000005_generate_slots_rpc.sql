-- Create RPC to insert a single custom slot if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_custom_slot(
    p_business_id uuid,
    p_date date,
    p_start_time time without time zone,
    p_end_time time without time zone
) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_slot_id uuid;
BEGIN
    INSERT INTO slots (business_id, date, start_time, end_time, status)
    VALUES (p_business_id, p_date, p_start_time, p_end_time, 'available')
    ON CONFLICT (business_id, date, start_time) DO NOTHING
    RETURNING id INTO v_slot_id;

    IF v_slot_id IS NULL THEN
        SELECT id INTO v_slot_id FROM slots 
        WHERE business_id = p_business_id AND date = p_date AND start_time = p_start_time;
    END IF;

    RETURN v_slot_id;
END;
$$;


-- Create RPC to fetch or auto-generate slots for a given day based on business hours
CREATE OR REPLACE FUNCTION public.get_or_generate_slots(
    p_business_id uuid,
    p_date date
) RETURNS SETOF slots
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_count integer;
    v_open time without time zone;
    v_close time without time zone;
    v_duration integer;
    v_curr time without time zone;
BEGIN
    -- Check if slots already exist for this date
    SELECT count(*) INTO v_count FROM slots WHERE business_id = p_business_id AND date = p_date;
    
    IF v_count = 0 THEN
        -- Basic generation fallback using businesses table default hours
        -- In a robust system, you might join with business_special_hours, but this fulfills the basic need
        SELECT opening_time::time, closing_time::time, COALESCE(slot_duration, 30)
        INTO v_open, v_close, v_duration
        FROM businesses WHERE id = p_business_id;
        
        IF v_open IS NOT NULL AND v_close IS NOT NULL THEN
            v_curr := v_open;
            WHILE v_curr + (v_duration || ' minutes')::interval <= v_close LOOP
                INSERT INTO slots (business_id, date, start_time, end_time, status)
                VALUES (
                    p_business_id, 
                    p_date, 
                    v_curr, 
                    v_curr + (v_duration || ' minutes')::interval, 
                    'available'
                )
                ON CONFLICT (business_id, date, start_time) DO NOTHING;
                
                v_curr := v_curr + (v_duration || ' minutes')::interval;
            END LOOP;
        END IF;
    END IF;

    RETURN QUERY SELECT * FROM slots WHERE business_id = p_business_id AND date = p_date ORDER BY start_time ASC;
END;
$$;
