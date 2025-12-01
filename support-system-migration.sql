-- Migration script to add customer support system
-- Run this on your Supabase database

-- 1. Create support_tickets table
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('booking_issue', 'payment_issue', 'vehicle_issue', 'driver_issue', 'general_inquiry', 'complaint', 'compliment')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL, -- admin/support staff
  customer_name VARCHAR(200), -- for guest users
  customer_email VARCHAR(255), -- for guest users
  customer_phone VARCHAR(20), -- for guest users
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create support_messages table for ticket communication
CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'support', 'admin')),
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb, -- array of file URLs/paths
  is_internal BOOLEAN DEFAULT FALSE, -- internal notes not visible to customer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_category ON support_tickets(category);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX idx_support_messages_created_at ON support_messages(created_at);

-- 4. Create function to generate unique ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  ticket_number TEXT;
  counter INTEGER := 1;
BEGIN
  LOOP
    -- Generate ticket number: ST + YYYYMMDD + sequential number
    ticket_number := 'ST' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(counter::TEXT, 4, '0');

    -- Check if ticket number already exists
    IF NOT EXISTS (SELECT 1 FROM support_tickets WHERE ticket_number = ticket_number) THEN
      RETURN ticket_number;
    END IF;

    counter := counter + 1;

    -- Safety check to prevent infinite loop
    IF counter > 9999 THEN
      RAISE EXCEPTION 'Cannot generate unique ticket number for today';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- 6. Create function to update timestamp
CREATE OR REPLACE FUNCTION update_support_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_support_ticket_timestamp
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_ticket_timestamp();

-- 7. Create RLS policies for support system
-- Allow users to view and create their own tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Users can see their own tickets
CREATE POLICY "Users can view own tickets" ON support_tickets
  FOR SELECT USING (user_id = auth.uid() OR (user_id IS NULL AND customer_email = (SELECT email FROM users WHERE id = auth.uid())));

-- Users can create tickets
CREATE POLICY "Users can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Users can update their own tickets (limited fields)
CREATE POLICY "Users can update own tickets" ON support_tickets
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Support staff and admins can see all tickets
CREATE POLICY "Support staff can view all tickets" ON support_tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'support')
    )
  );

-- Messages policies
CREATE POLICY "Users can view messages for their tickets" ON support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = support_messages.ticket_id
      AND (user_id = auth.uid() OR (user_id IS NULL AND customer_email = (SELECT email FROM users WHERE id = auth.uid())))
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'support')
    )
  );

CREATE POLICY "Users can create messages for their tickets" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = support_messages.ticket_id
      AND (user_id = auth.uid() OR (user_id IS NULL AND customer_email = (SELECT email FROM users WHERE id = auth.uid())))
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'support')
    )
  );

-- 8. Add support role to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'users_role_check'
    AND check_clause LIKE '%support%'
  ) THEN
    -- Drop the existing constraint
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

    -- Add the new constraint with support role
    ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('customer', 'admin', 'driver', 'support'));
  END IF;
END$$;