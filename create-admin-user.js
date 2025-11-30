require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

console.log('🔧 Using Supabase URL:', supabaseUrl)

// Create Supabase client with service role key (admin access)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user...')

    // Admin user details
    const adminData = {
      email: 'admin@saharamexpress.com',
      password: 'SaharamAdmin2024!',
      phone: '+2348012345678',
      first_name: 'Saharam',
      last_name: 'Admin',
      role: 'admin'
    }

    // Step 1: Create user in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: adminData.first_name,
        last_name: adminData.last_name,
        phone: adminData.phone
      }
    })

    if (authError) {
      console.error('❌ Error creating auth user:', authError.message)
      return
    }

    console.log('✅ Auth user created:', authUser.user.id)

    // Step 2: Create user profile in public.users
    const { data: profileUser, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: adminData.email,
        phone: adminData.phone,
        first_name: adminData.first_name,
        last_name: adminData.last_name,
        role: adminData.role,
        is_verified: true
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Error creating user profile:', profileError.message)
      return
    }

    console.log('✅ User profile created successfully!')

    // Step 3: Create sample driver user (for trips)
    const { data: driverAuth, error: driverAuthError } = await supabase.auth.admin.createUser({
      email: 'driver@saharamexpress.com',
      password: 'SaharamDriver2024!',
      email_confirm: true,
      user_metadata: {
        first_name: 'John',
        last_name: 'Driver',
        phone: '+2348098765432'
      }
    })

    if (!driverAuthError) {
      await supabase
        .from('users')
        .insert({
          id: driverAuth.user.id,
          email: 'driver@saharamexpress.com',
          phone: '+2348098765432',
          first_name: 'John',
          last_name: 'Driver',
          role: 'driver',
          is_verified: true
        })

      console.log('✅ Driver user created for trip assignments')
    }

    console.log('\n🎉 Setup Complete!')
    console.log('\n📋 Admin Login Details:')
    console.log('Email: admin@saharamexpress.com')
    console.log('Password: SaharamAdmin2024!')
    console.log('\n🌐 Login at: http://localhost:3004/login')
    console.log('🔧 Admin Dashboard: http://localhost:3004/admin')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

// Run the script
createAdminUser()