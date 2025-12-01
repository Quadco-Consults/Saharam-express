# Saharam Express Limited - Deployment Guide

This guide will help you deploy the Saharam Express Limited ticketing system to production.

## 🚀 Quick Deploy Options

### Option 1: Deploy to Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Production ready deployment"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect it's a Next.js project

3. **Set Environment Variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add the following variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy automatically

### Option 2: Deploy to Netlify

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Connect to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `.next` folder OR connect to GitHub

3. **Set Environment Variables:**
   - Go to Site Settings → Environment Variables
   - Add the same environment variables as above

### Option 3: Deploy to VPS/Cloud Server

1. **Install dependencies on server:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   npm install -g pm2
   ```

2. **Upload your project and install dependencies:**
   ```bash
   npm install
   npm run build
   ```

3. **Set up environment variables:**
   ```bash
   # Create .env.local file with your environment variables
   echo "NEXT_PUBLIC_SUPABASE_URL=your_url" >> .env.local
   echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key" >> .env.local
   echo "SUPABASE_SERVICE_ROLE_KEY=your_service_key" >> .env.local
   ```

4. **Start with PM2:**
   ```bash
   pm2 start npm --name "saharam-express" -- start
   pm2 startup
   pm2 save
   ```

## 🗄️ Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for it to be ready
4. Go to Settings → API to get your keys

### 2. Run Database Migrations

Execute these SQL files in your Supabase SQL Editor in order:

1. **Base Schema:**
   ```sql
   -- Run the contents of database-schema.sql
   ```

2. **Loyalty Points System:**
   ```sql
   -- Run the contents of loyalty-system-migration.sql
   ```

3. **Customer Support System:**
   ```sql
   -- Run the contents of support-system-migration.sql
   ```

### 3. Set Up Row Level Security (RLS)

The migration scripts include RLS policies, but verify they're enabled:

```sql
-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
```

### 4. Insert Initial Data (Optional)

```sql
-- Create admin user
INSERT INTO users (email, phone, first_name, last_name, role, is_verified)
VALUES ('admin@saharam.com', '+2348000000000', 'Admin', 'User', 'admin', true);

-- Create sample routes
INSERT INTO routes (from_city, to_city, distance, base_fare, estimated_duration)
VALUES
  ('Lagos', 'Abuja', 760, 15000, 480),
  ('Lagos', 'Kano', 1126, 20000, 720),
  ('Abuja', 'Kano', 366, 12000, 240);

-- Create sample vehicles
INSERT INTO vehicles (plate_number, model, capacity, year, color)
VALUES
  ('LAG-123-ABC', 'Toyota Hiace', 14, 2022, 'White'),
  ('ABJ-456-DEF', 'Mercedes Sprinter', 16, 2023, 'Blue'),
  ('KAN-789-GHI', 'Ford Transit', 12, 2021, 'Silver');
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Analytics and monitoring
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id

# Optional: Error reporting
SENTRY_DSN=your-sentry-dsn
```

### Update next.config.js (if needed)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: false, // For Supabase compatibility
  },
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
}

module.exports = nextConfig
```

## 🎯 Post-Deployment Checklist

### 1. Test Core Functionality

- [ ] User registration and login
- [ ] Guest booking flow
- [ ] Admin dashboard access
- [ ] Vehicle management
- [ ] Driver management
- [ ] Route management
- [ ] Loyalty points system
- [ ] Settings page

### 2. Create Admin Account

1. Register a new account with your admin email
2. In Supabase, update the user role:
   ```sql
   UPDATE users SET role = 'admin', is_verified = true
   WHERE email = 'your-admin@email.com';
   ```

### 3. Configure Admin Access

1. Log in with your admin account
2. Go to `/admin` to access the admin dashboard
3. Set up your initial:
   - Routes
   - Vehicles
   - Drivers
   - Trip schedules

### 4. Set Up Payment Processing (Optional)

If you want to integrate payment processing:

1. Choose a payment provider (Paystack, Flutterwave, etc.)
2. Add payment API keys to environment variables
3. Implement payment hooks in the booking flow

### 5. Configure Email/SMS (Optional)

For notifications:

1. Set up email service (SendGrid, Resend, etc.)
2. Set up SMS service (Twilio, Termii, etc.)
3. Add notification templates

## 🛡️ Security Considerations

### 1. Environment Variables

- Never commit `.env` files to git
- Use different keys for production vs development
- Regularly rotate API keys

### 2. Database Security

- RLS policies are enabled by default
- Review and test all policies
- Use service role key only for admin operations

### 3. Authentication

- Configure Supabase Auth settings
- Set up email verification
- Configure session timeouts

## 📊 Monitoring & Analytics

### 1. Add Analytics

```typescript
// Add to _app.tsx or layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

### 2. Error Monitoring

```typescript
// Optional: Add Sentry for error tracking
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
});
```

### 3. Performance Monitoring

- Monitor Core Web Vitals
- Track API response times
- Monitor database query performance

## 🚨 Troubleshooting

### Common Issues

1. **Environment Variables Not Loading:**
   - Make sure `.env.local` is in the root directory
   - Restart your development/production server
   - Check for typos in variable names

2. **Database Connection Issues:**
   - Verify Supabase URL and keys
   - Check if RLS policies are blocking queries
   - Ensure database is accessible from your deployment region

3. **Build Errors:**
   - Check for TypeScript errors: `npm run type-check`
   - Ensure all dependencies are installed: `npm install`
   - Clear Next.js cache: `rm -rf .next`

4. **Authentication Issues:**
   - Verify Supabase Auth settings
   - Check CORS settings in Supabase
   - Ensure proper redirect URLs are configured

## 📞 Support

If you encounter issues:

1. Check the browser console for errors
2. Check Supabase logs in the dashboard
3. Review deployment logs in Vercel/Netlify
4. Verify all environment variables are set correctly

---

## 🎉 You're All Set!

Your Saharam Express Limited ticketing system is now ready for production use. The system includes:

- ✅ Complete booking management
- ✅ Admin vehicle, driver, and route management
- ✅ Guest and registered user support
- ✅ Loyalty points system with tiers
- ✅ Customer support ticket system
- ✅ Responsive design
- ✅ Secure authentication and authorization

**Live URLs after deployment:**
- Main Site: `https://your-domain.vercel.app`
- Admin Dashboard: `https://your-domain.vercel.app/admin`
- Customer Dashboard: `https://your-domain.vercel.app/bookings`
- Loyalty Program: `https://your-domain.vercel.app/loyalty`