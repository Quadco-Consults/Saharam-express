-- Migration script to add loyalty points system
-- Run this on your Supabase database

-- 1. Add loyalty points field to users table
ALTER TABLE users
ADD COLUMN loyalty_points INTEGER DEFAULT 0,
ADD COLUMN loyalty_tier VARCHAR(20) DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum'));

-- 2. Create loyalty_transactions table to track points history
CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'bonus')),
  points INTEGER NOT NULL, -- positive for earned/bonus, negative for redeemed/expired
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create index for performance
CREATE INDEX idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX idx_loyalty_transactions_created_at ON loyalty_transactions(created_at);

-- 4. Create function to update user loyalty points and tier
CREATE OR REPLACE FUNCTION update_user_loyalty_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Update loyalty tier based on total points
  UPDATE users
  SET loyalty_tier = CASE
    WHEN loyalty_points >= 10000 THEN 'platinum'
    WHEN loyalty_points >= 5000 THEN 'gold'
    WHEN loyalty_points >= 2000 THEN 'silver'
    ELSE 'bronze'
  END
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to automatically update tier when points change
CREATE TRIGGER trigger_update_loyalty_tier
  AFTER INSERT OR UPDATE ON loyalty_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_loyalty_tier();

-- 6. Create function to calculate and award points for completed bookings
CREATE OR REPLACE FUNCTION award_loyalty_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Only award points for registered users (not guests) and when payment is completed
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' AND NEW.user_id IS NOT NULL THEN
    -- Check if user is not a guest user
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.user_id AND email = 'guest@saharam.system') THEN
      -- Calculate points: 1 point per 100 Naira spent (rounded down)
      DECLARE
        points_to_award INTEGER := FLOOR(NEW.total_amount / 100);
      BEGIN
        -- Insert loyalty transaction
        INSERT INTO loyalty_transactions (user_id, booking_id, transaction_type, points, description)
        VALUES (
          NEW.user_id,
          NEW.id,
          'earned',
          points_to_award,
          'Points earned from booking #' || NEW.booking_reference
        );

        -- Update user's total loyalty points
        UPDATE users
        SET loyalty_points = loyalty_points + points_to_award
        WHERE id = NEW.user_id;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to award points when bookings are paid
CREATE TRIGGER trigger_award_loyalty_points
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION award_loyalty_points();

-- 8. Insert initial data to populate existing users with default values
UPDATE users SET loyalty_points = 0, loyalty_tier = 'bronze' WHERE loyalty_points IS NULL;