-- Saharam Express Ticketing System Database Schema
-- PostgreSQL/Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  is_verified BOOLEAN DEFAULT FALSE,
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'driver')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Routes table
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_city VARCHAR(100) NOT NULL,
  to_city VARCHAR(100) NOT NULL,
  distance INTEGER NOT NULL, -- in kilometers
  base_fare DECIMAL(10,2) NOT NULL,
  estimated_duration INTEGER NOT NULL, -- in minutes
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique route combinations
  UNIQUE(from_city, to_city)
);

-- Vehicles table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate_number VARCHAR(20) UNIQUE NOT NULL,
  model VARCHAR(100) NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  year INTEGER NOT NULL,
  color VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  last_maintenance DATE,
  next_maintenance DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  arrival_time TIMESTAMP WITH TIME ZONE NOT NULL,
  available_seats INTEGER NOT NULL,
  total_seats INTEGER NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'boarding', 'in_transit', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure available seats never exceed total seats
  CHECK (available_seats <= total_seats AND available_seats >= 0)
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
  passenger_name VARCHAR(200) NOT NULL,
  passenger_phone VARCHAR(20) NOT NULL,
  seat_numbers TEXT[] NOT NULL, -- Array of seat numbers
  total_amount DECIMAL(10,2) NOT NULL,
  booking_reference VARCHAR(20) UNIQUE NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method VARCHAR(20) CHECK (payment_method IN ('paystack', 'opay', 'flutterwave', 'bank_transfer')),
  payment_reference VARCHAR(100),
  qr_code TEXT,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  gateway VARCHAR(20) NOT NULL CHECK (gateway IN ('paystack', 'opay', 'flutterwave')),
  gateway_reference VARCHAR(100) UNIQUE NOT NULL,
  gateway_response JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('sms', 'email', 'push')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_routes_cities ON routes(from_city, to_city);
CREATE INDEX idx_routes_active ON routes(is_active);

CREATE INDEX idx_vehicles_plate ON vehicles(plate_number);
CREATE INDEX idx_vehicles_active ON vehicles(is_active);

CREATE INDEX idx_trips_route ON trips(route_id);
CREATE INDEX idx_trips_departure ON trips(departure_time);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_driver ON trips(driver_id);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_trip ON bookings(trip_id);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_gateway_ref ON payments(gateway_reference);
CREATE INDEX idx_payments_status ON payments(status);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data
-- Routes
INSERT INTO routes (from_city, to_city, distance, base_fare, estimated_duration) VALUES
('Kano', 'Kaduna', 210, 5000.00, 240), -- 4 hours
('Kaduna', 'Kano', 210, 5000.00, 240);

-- Sample admin user (password should be hashed in real implementation)
INSERT INTO users (email, phone, first_name, last_name, role, is_verified) VALUES
('admin@saharamexpress.com.ng', '+2347012345678', 'Admin', 'User', 'admin', TRUE);

-- Sample vehicles
INSERT INTO vehicles (plate_number, model, capacity, year, color) VALUES
('KAN-001-SE', 'Toyota Hiace', 18, 2022, 'White'),
('KAN-002-SE', 'Toyota Hiace', 18, 2022, 'White'),
('KAD-001-SE', 'Toyota Hiace', 18, 2021, 'Blue'),
('KAD-002-SE', 'Toyota Hiace', 18, 2021, 'Blue');

-- Row Level Security (RLS) policies for Supabase
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Public can view active trips
CREATE POLICY "Anyone can view active trips" ON trips
  FOR SELECT USING (status IN ('scheduled', 'boarding'));

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own bookings
CREATE POLICY "Users can create own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = payments.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policies (full access for admin users)
CREATE POLICY "Admins have full access" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create a function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'SEL' || TO_CHAR(NOW(), 'YYMMDD') || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to auto-generate booking reference
CREATE OR REPLACE FUNCTION set_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_reference IS NULL OR NEW.booking_reference = '' THEN
    NEW.booking_reference = generate_booking_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_booking_reference_trigger
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_reference();