# 🚀 Quick Deploy - Saharan Express Ticketing System

## Automated 1-Click Deployment

Your Saharan Express ticketing system is now ready for automated deployment!

### Step 1: Run the Auto-Deploy Script

```bash
./deploy.sh
```

This script will:
- ✅ Check prerequisites
- ✅ Commit any pending changes
- ✅ Push to GitHub
- ✅ Deploy to Vercel automatically

### Step 2: Set Up Database (5 minutes)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Copy your project URL and keys

2. **Run Database Migrations**
   - Open Supabase SQL Editor
   - Run each migration file in order:
     - `supabase/migrations/001_initial_schema.sql`
     - `supabase/migrations/002_rls_policies.sql`
     - `supabase/migrations/003_sample_data.sql`

### Step 3: Configure Environment Variables

In your Vercel dashboard, add these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret-key
```

### Step 4: Test Your Deployment

1. Visit your live app URL
2. Test guest booking flow
3. Create admin account in Supabase Auth
4. Test admin dashboard

## 🎉 That's it!

Your bus ticketing system is now live with:
- ✅ Guest booking system
- ✅ Payment integration ready
- ✅ Admin management dashboard
- ✅ QR code ticketing
- ✅ Customer support system
- ✅ Loyalty points program

## Need Help?

Check the detailed `DEPLOYMENT_GUIDE.md` for troubleshooting and advanced configuration options.