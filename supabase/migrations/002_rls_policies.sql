-- Saharam Express Ticketing System
-- Migration 002: Row Level Security Policies

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update users" ON users
    FOR UPDATE USING (is_admin(auth.uid()));

-- Routes policies (public read, admin write)
CREATE POLICY "Anyone can view active routes" ON routes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage routes" ON routes
    FOR ALL USING (is_admin(auth.uid()));

-- Vehicles policies (admin only)
CREATE POLICY "Admins can manage vehicles" ON vehicles
    FOR ALL USING (is_admin(auth.uid()));

-- Drivers policies (admin only)
CREATE POLICY "Admins can manage drivers" ON drivers
    FOR ALL USING (is_admin(auth.uid()));

-- Trips policies (public read active trips, admin write)
CREATE POLICY "Anyone can view active trips" ON trips
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage trips" ON trips
    FOR ALL USING (is_admin(auth.uid()));

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (
        auth.uid() = user_id OR
        is_admin(auth.uid())
    );

CREATE POLICY "Users can create bookings" ON bookings
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR
        user_id IS NULL OR  -- Guest bookings
        is_admin(auth.uid())
    );

CREATE POLICY "Admins can manage all bookings" ON bookings
    FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can update own bookings" ON bookings
    FOR UPDATE USING (
        auth.uid() = user_id OR
        is_admin(auth.uid())
    );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can mark own notifications as read" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications" ON notifications
    FOR ALL USING (is_admin(auth.uid()));

-- Seat bookings policies
CREATE POLICY "Anyone can view seat availability" ON seat_bookings
    FOR SELECT USING (true);

CREATE POLICY "System can manage seat bookings" ON seat_bookings
    FOR ALL USING (true);

-- Loyalty transactions policies
CREATE POLICY "Users can view own loyalty transactions" ON loyalty_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create loyalty transactions" ON loyalty_transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage loyalty transactions" ON loyalty_transactions
    FOR ALL USING (is_admin(auth.uid()));

-- Admin settings policies (admin only)
CREATE POLICY "Admins can manage settings" ON admin_settings
    FOR ALL USING (is_admin(auth.uid()));

-- Support tickets policies
CREATE POLICY "Users can view own support tickets" ON support_tickets
    FOR SELECT USING (
        auth.uid() = user_id OR
        is_admin(auth.uid())
    );

CREATE POLICY "Users can create support tickets" ON support_tickets
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR
        user_id IS NULL OR  -- Guest support tickets
        is_admin(auth.uid())
    );

CREATE POLICY "Admins can manage support tickets" ON support_tickets
    FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can update own tickets" ON support_tickets
    FOR UPDATE USING (
        auth.uid() = user_id OR
        is_admin(auth.uid())
    );

-- Support messages policies
CREATE POLICY "Users can view messages for own tickets" ON support_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE id = ticket_id AND (
                user_id = auth.uid() OR
                is_admin(auth.uid())
            )
        )
    );

CREATE POLICY "Users can create messages for own tickets" ON support_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE id = ticket_id AND (
                user_id = auth.uid() OR
                is_admin(auth.uid())
            )
        )
    );

CREATE POLICY "Admins can manage all support messages" ON support_messages
    FOR ALL USING (is_admin(auth.uid()));