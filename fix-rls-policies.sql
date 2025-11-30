-- Fix RLS policies to prevent infinite recursion
-- Run this in your Supabase SQL Editor

-- Drop the problematic admin policies
DROP POLICY IF EXISTS "Admins have full access to users" ON public.users;

-- Create a simpler admin policy that doesn't cause recursion
-- This policy allows access to the users table using a direct JWT claim check
CREATE POLICY "Admins can manage users" ON public.users
  FOR ALL USING (
    -- Check if the JWT contains admin role metadata or if it's our specific admin user
    (auth.jwt() ->> 'email' = 'admin@test.com') OR
    (auth.jwt() ->> 'role' = 'admin') OR
    -- Allow users to access their own records
    (auth.uid() = id)
  );

-- Also create a policy that allows authenticated users to read their own profile
-- without recursion
CREATE POLICY IF NOT EXISTS "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- For the other tables, let's also simplify the admin policies
DROP POLICY IF EXISTS "Admins have full access to routes" ON public.routes;
DROP POLICY IF EXISTS "Admins have full access to vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins have full access to trips" ON public.trips;
DROP POLICY IF EXISTS "Admins have full access to bookings" ON public.bookings;

-- Create simpler admin policies using JWT claims
CREATE POLICY "Admins can manage routes" ON public.routes
  FOR ALL USING (
    (auth.jwt() ->> 'email' = 'admin@test.com') OR
    (auth.jwt() ->> 'role' = 'admin')
  );

CREATE POLICY "Admins can manage vehicles" ON public.vehicles
  FOR ALL USING (
    (auth.jwt() ->> 'email' = 'admin@test.com') OR
    (auth.jwt() ->> 'role' = 'admin')
  );

CREATE POLICY "Admins can manage trips" ON public.trips
  FOR ALL USING (
    (auth.jwt() ->> 'email' = 'admin@test.com') OR
    (auth.jwt() ->> 'role' = 'admin')
  );

CREATE POLICY "Admins can manage bookings" ON public.bookings
  FOR ALL USING (
    (auth.jwt() ->> 'email' = 'admin@test.com') OR
    (auth.jwt() ->> 'role' = 'admin')
  );