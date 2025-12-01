require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createSampleTrips() {
  try {
    console.log('🚗 Creating sample trips for Saharan Express...')

    // Get routes, vehicles, and driver
    const { data: routes } = await supabase.from('routes').select('*')
    const { data: vehicles } = await supabase.from('vehicles').select('*')
    const { data: drivers } = await supabase.from('users').select('*').eq('role', 'admin').limit(1)

    console.log('📍 Available routes:', routes?.length || 0)
    console.log('🚐 Available vehicles:', vehicles?.length || 0)
    console.log('👨‍✈️ Available drivers:', drivers?.length || 0)

    if (!routes?.length || !vehicles?.length || !drivers?.length) {
      console.log('❌ Missing required data. Need routes, vehicles, and drivers.')
      return
    }

    const driverId = drivers[0].id

    // Create trips for the next 7 days
    const trips = []
    const today = new Date()

    for (let i = 0; i < 7; i++) {
      const tripDate = new Date(today)
      tripDate.setDate(today.getDate() + i)

      // Create multiple trips per day
      const tripTimes = [
        { hour: 8, minute: 0 },   // 8:00 AM
        { hour: 14, minute: 30 }, // 2:30 PM
        { hour: 18, minute: 0 }   // 6:00 PM
      ]

      for (const route of routes) {
        for (let j = 0; j < tripTimes.length; j++) {
          const vehicle = vehicles[j % vehicles.length]
          const time = tripTimes[j]

          const departureTime = new Date(tripDate)
          departureTime.setHours(time.hour, time.minute, 0, 0)

          const arrivalTime = new Date(departureTime)
          arrivalTime.setMinutes(departureTime.getMinutes() + route.estimated_duration)

          trips.push({
            route_id: route.id,
            vehicle_id: vehicle.id,
            driver_id: driverId,
            departure_time: departureTime.toISOString(),
            arrival_time: arrivalTime.toISOString(),
            available_seats: vehicle.capacity,
            total_seats: vehicle.capacity,
            base_price: route.base_fare,
            status: 'scheduled'
          })
        }
      }
    }

    console.log(`📅 Creating ${trips.length} trips...`)

    // Insert trips in batches
    const batchSize = 10
    for (let i = 0; i < trips.length; i += batchSize) {
      const batch = trips.slice(i, i + batchSize)
      const { error } = await supabase.from('trips').insert(batch)

      if (error) {
        console.error(`❌ Error creating trip batch ${i}-${i + batchSize}:`, error.message)
      } else {
        console.log(`✅ Created trips ${i + 1}-${Math.min(i + batchSize, trips.length)}`)
      }
    }

    console.log('\n🎉 Sample trips created successfully!')
    console.log('\n📋 What you can do now:')
    console.log('1. Enable email authentication in Supabase Dashboard')
    console.log('2. Login with: admin@test.com / AdminTest123!')
    console.log('3. Visit http://localhost:3000 and search for trips')
    console.log('4. Test booking trips between:')
    console.log('   • Kano ↔ Kaduna')
    console.log('   • Kano ↔ Abuja')

  } catch (error) {
    console.error('❌ Error creating sample trips:', error.message)
  }
}

createSampleTrips()