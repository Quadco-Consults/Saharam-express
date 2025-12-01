-- Saharam Express Ticketing System
-- Migration 003: Sample Data for Testing

-- Insert sample routes
INSERT INTO routes (from_city, to_city, distance, estimated_duration, base_price) VALUES
('Lagos', 'Abuja', 750, 480, 4500.00),
('Lagos', 'Ibadan', 130, 120, 2500.00),
('Lagos', 'Kano', 1050, 660, 6500.00),
('Abuja', 'Kano', 350, 240, 3500.00),
('Abuja', 'Jos', 200, 180, 3000.00),
('Ibadan', 'Abuja', 620, 360, 4000.00),
('Kano', 'Kaduna', 160, 120, 2000.00),
('Lagos', 'Benin', 320, 240, 3500.00),
('Benin', 'Asaba', 140, 90, 2000.00),
('Port Harcourt', 'Lagos', 450, 300, 4000.00),
('Lagos', 'Ilorin', 310, 210, 3000.00),
('Ilorin', 'Abuja', 320, 210, 3200.00);

-- Insert sample vehicles
INSERT INTO vehicles (plate_number, model, capacity, year, status) VALUES
('SAH-001-AA', 'Toyota Hiace', 18, 2022, 'active'),
('SAH-002-AB', 'Mercedes Sprinter', 22, 2021, 'active'),
('SAH-003-AC', 'Toyota Coaster', 30, 2023, 'active'),
('SAH-004-AD', 'Iveco Daily', 25, 2022, 'active'),
('SAH-005-AE', 'Ford Transit', 20, 2021, 'active'),
('SAH-006-AF', 'Toyota Hiace', 18, 2020, 'maintenance'),
('SAH-007-AG', 'Mercedes Sprinter', 22, 2023, 'active'),
('SAH-008-AH', 'Toyota Coaster', 30, 2022, 'active'),
('SAH-009-AI', 'Iveco Daily', 25, 2021, 'active'),
('SAH-010-AJ', 'Ford Transit', 20, 2023, 'active');

-- Insert sample drivers
INSERT INTO drivers (first_name, last_name, phone, email, license_number, license_expiry, status, rating) VALUES
('Ibrahim', 'Mohammed', '+2348012345678', 'ibrahim.mohammed@saharam.com', 'KN123456789', '2025-12-31', 'active', 4.8),
('Fatima', 'Abubakar', '+2348023456789', 'fatima.abubakar@saharam.com', 'LG234567890', '2026-06-30', 'active', 4.9),
('Yusuf', 'Aliyu', '+2348034567890', 'yusuf.aliyu@saharam.com', 'AB345678901', '2025-09-15', 'active', 4.7),
('Khadija', 'Usman', '+2348045678901', 'khadija.usman@saharam.com', 'KD456789012', '2026-03-20', 'active', 4.8),
('Ahmed', 'Bello', '+2348056789012', 'ahmed.bello@saharam.com', 'JO567890123', '2025-11-10', 'active', 4.6),
('Aisha', 'Garba', '+2348067890123', 'aisha.garba@saharam.com', 'LG678901234', '2026-08-25', 'active', 4.9),
('Musa', 'Ibrahim', '+2348078901234', 'musa.ibrahim@saharam.com', 'KN789012345', '2025-07-30', 'active', 4.7),
('Zainab', 'Abdullahi', '+2348089012345', 'zainab.abdullahi@saharam.com', 'AB890123456', '2026-01-15', 'active', 4.8),
('Umar', 'Sani', '+2348090123456', 'umar.sani@saharam.com', 'KD901234567', '2025-10-05', 'active', 4.5),
('Hauwa', 'Yakubu', '+2348001234567', 'hauwa.yakubu@saharam.com', 'JO012345678', '2026-04-18', 'active', 4.9);

-- Insert sample admin settings
INSERT INTO admin_settings (key, value, description) VALUES
('company_name', 'Saharam Express Limited', 'Company name displayed on tickets and emails'),
('support_email', 'support@saharam-express.com', 'Customer support email address'),
('support_phone', '+234-800-SAHARAM', 'Customer support phone number'),
('loyalty_points_rate', '100', 'Points earned per 1000 NGN spent'),
('loyalty_redemption_rate', '10', 'NGN value per loyalty point'),
('booking_cancellation_hours', '24', 'Hours before departure when cancellation is allowed'),
('max_seats_per_booking', '8', 'Maximum number of seats per single booking'),
('sms_sender_name', 'SAHARAM', 'SMS sender name'),
('email_from_name', 'Saharam Express', 'Email sender name'),
('website_url', 'https://saharam-express.vercel.app', 'Company website URL');

-- Create function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT := 'SAH';
    random_part TEXT;
    reference TEXT;
    exists_check INTEGER;
BEGIN
    LOOP
        -- Generate 6-digit random number
        random_part := LPAD((RANDOM() * 999999)::INT::TEXT, 6, '0');
        reference := prefix || random_part;

        -- Check if reference already exists
        SELECT COUNT(*) INTO exists_check FROM bookings WHERE booking_reference = reference;

        -- Exit loop if reference is unique
        EXIT WHEN exists_check = 0;
    END LOOP;

    RETURN reference;
END;
$$ LANGUAGE plpgsql;

-- Insert sample trips for the next 30 days
DO $$
DECLARE
    route_record RECORD;
    vehicle_record RECORD;
    driver_record RECORD;
    trip_date DATE;
    departure_time TIME;
    arrival_time TIME;
    trip_count INTEGER := 0;
BEGIN
    -- Loop through next 30 days
    FOR i IN 0..29 LOOP
        trip_date := CURRENT_DATE + INTERVAL '1 day' * i;

        -- Skip if it's a Sunday (no trips on Sundays)
        CONTINUE WHEN EXTRACT(DOW FROM trip_date) = 0;

        -- Morning trips (6 AM, 8 AM, 10 AM)
        FOR hour_offset IN 0..2 LOOP
            FOR route_record IN (
                SELECT * FROM routes
                WHERE is_active = true
                ORDER BY RANDOM()
                LIMIT CASE WHEN EXTRACT(DOW FROM trip_date) = 6 THEN 6 ELSE 8 END
            ) LOOP
                -- Get random vehicle and driver
                SELECT * INTO vehicle_record
                FROM vehicles
                WHERE status = 'active'
                ORDER BY RANDOM()
                LIMIT 1;

                SELECT * INTO driver_record
                FROM drivers
                WHERE status = 'active'
                ORDER BY RANDOM()
                LIMIT 1;

                -- Calculate departure and arrival times
                departure_time := ('06:00:00'::TIME + INTERVAL '2 hours' * hour_offset);
                arrival_time := departure_time + INTERVAL '1 minute' * route_record.estimated_duration;

                INSERT INTO trips (
                    route_id,
                    vehicle_id,
                    driver_id,
                    departure_time,
                    arrival_time,
                    base_price,
                    available_seats,
                    total_seats
                ) VALUES (
                    route_record.id,
                    vehicle_record.id,
                    driver_record.id,
                    trip_date + departure_time,
                    trip_date + arrival_time,
                    route_record.base_price,
                    vehicle_record.capacity,
                    vehicle_record.capacity
                );

                trip_count := trip_count + 1;
                EXIT WHEN trip_count >= 200; -- Limit total trips
            END LOOP;
            EXIT WHEN trip_count >= 200;
        END LOOP;
        EXIT WHEN trip_count >= 200;

        -- Evening trips (2 PM, 4 PM, 6 PM) - only on weekdays
        IF EXTRACT(DOW FROM trip_date) NOT IN (0, 6) THEN
            FOR hour_offset IN 0..2 LOOP
                FOR route_record IN (
                    SELECT * FROM routes
                    WHERE is_active = true
                    ORDER BY RANDOM()
                    LIMIT 4
                ) LOOP
                    -- Get random vehicle and driver
                    SELECT * INTO vehicle_record
                    FROM vehicles
                    WHERE status = 'active'
                    ORDER BY RANDOM()
                    LIMIT 1;

                    SELECT * INTO driver_record
                    FROM drivers
                    WHERE status = 'active'
                    ORDER BY RANDOM()
                    LIMIT 1;

                    -- Calculate departure and arrival times
                    departure_time := ('14:00:00'::TIME + INTERVAL '2 hours' * hour_offset);
                    arrival_time := departure_time + INTERVAL '1 minute' * route_record.estimated_duration;

                    INSERT INTO trips (
                        route_id,
                        vehicle_id,
                        driver_id,
                        departure_time,
                        arrival_time,
                        base_price,
                        available_seats,
                        total_seats
                    ) VALUES (
                        route_record.id,
                        vehicle_record.id,
                        driver_record.id,
                        trip_date + departure_time,
                        trip_date + arrival_time,
                        route_record.base_price,
                        vehicle_record.capacity,
                        vehicle_record.capacity
                    );

                    trip_count := trip_count + 1;
                    EXIT WHEN trip_count >= 200;
                END LOOP;
                EXIT WHEN trip_count >= 200;
            END LOOP;
        END IF;
        EXIT WHEN trip_count >= 200;
    END LOOP;
END $$;