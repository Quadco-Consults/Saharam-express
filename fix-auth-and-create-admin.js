require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Use service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Supabase URL:', supabaseUrl)
console.log('🔑 Service Key available:', !!supabaseServiceKey)

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user with service role...')

    // First, let's disable email confirmation temporarily (if possible)
    console.log('📧 Attempting to create user with email auto-confirmed...')

    // Create admin user with service role (bypassing email confirmation)
    const { data: adminAuth, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@test.com',
      password: 'AdminTest123!',
      email_confirm: true, // This bypasses email confirmation when using service role
      user_metadata: {
        first_name: 'Admin',
        last_name: 'User',
        phone: '+2348012345678'
      }
    })

    if (adminError) {
      console.error('❌ Error creating admin user:', adminError.message)

      // Try alternative approach with anon key
      console.log('🔄 Trying with anon key for regular signup...')
      const anonSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

      const { data: signupData, error: signupError } = await anonSupabase.auth.signUp({
        email: 'test@example.com',
        password: 'TestUser123!',
        options: {
          data: {
            first_name: 'Test',
            last_name: 'User',
            phone: '+2348012345678'
          }
        }
      })

      if (signupError) {
        console.error('❌ Regular signup also failed:', signupError.message)
        return
      }

      console.log('✅ Regular signup succeeded! User created:', signupData.user?.id)
      console.log('⚠️ Email confirmation may be required.')
    } else {
      console.log('✅ Admin user created with service role:', adminAuth.user.id)
    }

    // Create user profile in public.users table
    const userId = adminAuth?.user?.id || signupData?.user?.id
    const email = adminAuth?.user?.email || signupData?.user?.email || 'test@example.com'

    if (userId) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          phone: '+2348012345678',
          first_name: adminAuth?.user ? 'Admin' : 'Test',
          last_name: adminAuth?.user ? 'User' : 'User',
          role: adminAuth?.user ? 'admin' : 'customer',
          is_verified: true
        })
        .select()

      if (profileError) {
        console.error('❌ Error creating user profile:', profileError.message)
        // Try to update existing profile
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: adminAuth?.user ? 'admin' : 'customer' })
          .eq('id', userId)

        if (updateError) {
          console.error('❌ Error updating profile:', updateError.message)
        } else {
          console.log('✅ Updated existing user profile')
        }
      } else {
        console.log('✅ User profile created successfully!')
      }
    }

    console.log('\n🎉 User Creation Complete!')
    console.log('\n📋 Login Details:')
    if (adminAuth?.user) {
      console.log('Email: admin@test.com')
      console.log('Password: AdminTest123!')
      console.log('Role: Admin')
    } else {
      console.log('Email: test@example.com')
      console.log('Password: TestUser123!')
      console.log('Role: Customer (can be promoted to admin manually)')
    }
    console.log('\n🌐 Try logging in at: http://localhost:3000')
    console.log('🔧 Admin Dashboard: http://localhost:3000/admin')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

// Run the script
createAdminUser()