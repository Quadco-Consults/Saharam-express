require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Use the anon key for regular user registration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔧 Using Supabase URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user via registration...')

    // Step 1: Register the user normally
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'admin@gmail.com',
      password: 'SaharamAdmin2024!',
      options: {
        data: {
          first_name: 'Saharam',
          last_name: 'Admin',
          phone: '+2348012345678'
        }
      }
    })

    if (authError) {
      console.error('❌ Error registering user:', authError.message)
      return
    }

    console.log('✅ User registered successfully!')
    console.log('📧 User ID:', authData.user?.id)

    console.log('\n📋 Admin Login Details:')
    console.log('Email: admin@gmail.com')
    console.log('Password: SaharamAdmin2024!')
    console.log('\n🌐 Login at: http://localhost:3004/login')
    console.log('\n⚠️  IMPORTANT: After logging in, you need to:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to Table Editor > users')
    console.log('3. Find the user with email "admin@gmail.com"')
    console.log('4. Change the "role" field from "customer" to "admin"')
    console.log('5. Log out and log back in to access admin dashboard at http://localhost:3004/admin')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

// Run the script
createAdminUser()