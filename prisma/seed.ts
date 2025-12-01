import { PrismaClient } from '@prisma/client'
import { AuthService } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Saharam Express database...')

  // Create admin user
  const admin = await AuthService.createAdminUser(
    'admin@saharam-express.com',
    'admin123',
    'Admin',
    'User'
  )
  console.log('✅ Created admin user:', admin.email)

  // Create sample routes
  const routes = await prisma.route.createMany({
    data: [
      { fromCity: 'Lagos', toCity: 'Abuja', distance: 750, estimatedDuration: 480, basePrice: 4500.00 },
      { fromCity: 'Lagos', toCity: 'Ibadan', distance: 130, estimatedDuration: 120, basePrice: 2500.00 },
      { fromCity: 'Lagos', toCity: 'Kano', distance: 1050, estimatedDuration: 660, basePrice: 6500.00 },
      { fromCity: 'Abuja', toCity: 'Kano', distance: 350, estimatedDuration: 240, basePrice: 3500.00 },
      { fromCity: 'Abuja', toCity: 'Jos', distance: 200, estimatedDuration: 180, basePrice: 3000.00 },
      { fromCity: 'Ibadan', toCity: 'Abuja', distance: 620, estimatedDuration: 360, basePrice: 4000.00 },
      { fromCity: 'Kano', toCity: 'Kaduna', distance: 160, estimatedDuration: 120, basePrice: 2000.00 },
      { fromCity: 'Lagos', toCity: 'Benin', distance: 320, estimatedDuration: 240, basePrice: 3500.00 },
      { fromCity: 'Benin', toCity: 'Asaba', distance: 140, estimatedDuration: 90, basePrice: 2000.00 },
      { fromCity: 'Port Harcourt', toCity: 'Lagos', distance: 450, estimatedDuration: 300, basePrice: 4000.00 }
    ]
  })
  console.log(`✅ Created ${routes.count} routes`)

  // Create sample vehicles
  const vehicles = await prisma.vehicle.createMany({
    data: [
      { plateNumber: 'SAH-001-AA', model: 'Toyota Hiace', capacity: 18, year: 2022, status: 'ACTIVE' },
      { plateNumber: 'SAH-002-AB', model: 'Mercedes Sprinter', capacity: 22, year: 2021, status: 'ACTIVE' },
      { plateNumber: 'SAH-003-AC', model: 'Toyota Coaster', capacity: 30, year: 2023, status: 'ACTIVE' },
      { plateNumber: 'SAH-004-AD', model: 'Iveco Daily', capacity: 25, year: 2022, status: 'ACTIVE' },
      { plateNumber: 'SAH-005-AE', model: 'Ford Transit', capacity: 20, year: 2021, status: 'ACTIVE' },
      { plateNumber: 'SAH-006-AF', model: 'Toyota Hiace', capacity: 18, year: 2020, status: 'MAINTENANCE' },
      { plateNumber: 'SAH-007-AG', model: 'Mercedes Sprinter', capacity: 22, year: 2023, status: 'ACTIVE' },
      { plateNumber: 'SAH-008-AH', model: 'Toyota Coaster', capacity: 30, year: 2022, status: 'ACTIVE' },
      { plateNumber: 'SAH-009-AI', model: 'Iveco Daily', capacity: 25, year: 2021, status: 'ACTIVE' },
      { plateNumber: 'SAH-010-AJ', model: 'Ford Transit', capacity: 20, year: 2023, status: 'ACTIVE' }
    ]
  })
  console.log(`✅ Created ${vehicles.count} vehicles`)

  // Create sample drivers
  const drivers = await prisma.driver.createMany({
    data: [
      { firstName: 'Ibrahim', lastName: 'Mohammed', phone: '+2348012345678', email: 'ibrahim.mohammed@saharam.com', licenseNumber: 'KN123456789', licenseExpiry: new Date('2025-12-31'), status: 'ACTIVE', rating: 4.8 },
      { firstName: 'Fatima', lastName: 'Abubakar', phone: '+2348023456789', email: 'fatima.abubakar@saharam.com', licenseNumber: 'LG234567890', licenseExpiry: new Date('2026-06-30'), status: 'ACTIVE', rating: 4.9 },
      { firstName: 'Yusuf', lastName: 'Aliyu', phone: '+2348034567890', email: 'yusuf.aliyu@saharam.com', licenseNumber: 'AB345678901', licenseExpiry: new Date('2025-09-15'), status: 'ACTIVE', rating: 4.7 },
      { firstName: 'Khadija', lastName: 'Usman', phone: '+2348045678901', email: 'khadija.usman@saharam.com', licenseNumber: 'KD456789012', licenseExpiry: new Date('2026-03-20'), status: 'ACTIVE', rating: 4.8 },
      { firstName: 'Ahmed', lastName: 'Bello', phone: '+2348056789012', email: 'ahmed.bello@saharam.com', licenseNumber: 'JO567890123', licenseExpiry: new Date('2025-11-10'), status: 'ACTIVE', rating: 4.6 }
    ]
  })
  console.log(`✅ Created ${drivers.count} drivers`)

  // Create admin settings
  const settings = await prisma.adminSetting.createMany({
    data: [
      { key: 'company_name', value: 'Saharam Express Limited', description: 'Company name displayed on tickets and emails' },
      { key: 'support_email', value: 'support@saharam-express.com', description: 'Customer support email address' },
      { key: 'support_phone', value: '+234-800-SAHARAM', description: 'Customer support phone number' },
      { key: 'loyalty_points_rate', value: '100', description: 'Points earned per 1000 NGN spent' },
      { key: 'loyalty_redemption_rate', value: '10', description: 'NGN value per loyalty point' },
      { key: 'booking_cancellation_hours', value: '24', description: 'Hours before departure when cancellation is allowed' },
      { key: 'max_seats_per_booking', value: '8', description: 'Maximum number of seats per single booking' },
      { key: 'website_url', value: 'https://saharam-express.vercel.app', description: 'Company website URL' }
    ]
  })
  console.log(`✅ Created ${settings.count} admin settings`)

  // Create sample trips for the next 30 days
  const allRoutes = await prisma.route.findMany()
  const allVehicles = await prisma.vehicle.findMany({ where: { status: 'ACTIVE' } })
  const allDrivers = await prisma.driver.findMany({ where: { status: 'ACTIVE' } })

  const trips = []
  const now = new Date()

  for (let day = 0; day < 30; day++) {
    const tripDate = new Date(now)
    tripDate.setDate(now.getDate() + day)

    // Skip Sundays
    if (tripDate.getDay() === 0) continue

    // Morning trips (6 AM, 8 AM, 10 AM)
    for (let hour = 6; hour <= 10; hour += 2) {
      for (let routeIndex = 0; routeIndex < Math.min(allRoutes.length, 3); routeIndex++) {
        const route = allRoutes[routeIndex]
        const vehicle = allVehicles[Math.floor(Math.random() * allVehicles.length)]
        const driver = allDrivers[Math.floor(Math.random() * allDrivers.length)]

        const departureTime = new Date(tripDate)
        departureTime.setHours(hour, 0, 0, 0)

        const arrivalTime = new Date(departureTime)
        arrivalTime.setMinutes(arrivalTime.getMinutes() + route.estimatedDuration)

        trips.push({
          routeId: route.id,
          vehicleId: vehicle.id,
          driverId: driver.id,
          departureTime,
          arrivalTime,
          basePrice: route.basePrice,
          availableSeats: vehicle.capacity,
          totalSeats: vehicle.capacity,
          isActive: true
        })
      }
    }

    // Evening trips (2 PM, 4 PM, 6 PM) - weekdays only
    if (tripDate.getDay() !== 6) {
      for (let hour = 14; hour <= 18; hour += 2) {
        for (let routeIndex = 0; routeIndex < Math.min(allRoutes.length, 2); routeIndex++) {
          const route = allRoutes[routeIndex]
          const vehicle = allVehicles[Math.floor(Math.random() * allVehicles.length)]
          const driver = allDrivers[Math.floor(Math.random() * allDrivers.length)]

          const departureTime = new Date(tripDate)
          departureTime.setHours(hour, 0, 0, 0)

          const arrivalTime = new Date(departureTime)
          arrivalTime.setMinutes(arrivalTime.getMinutes() + route.estimatedDuration)

          trips.push({
            routeId: route.id,
            vehicleId: vehicle.id,
            driverId: driver.id,
            departureTime,
            arrivalTime,
            basePrice: route.basePrice,
            availableSeats: vehicle.capacity,
            totalSeats: vehicle.capacity,
            isActive: true
          })
        }
      }
    }
  }

  // Create trips in batches
  for (let i = 0; i < trips.length; i += 50) {
    const batch = trips.slice(i, i + 50)
    await prisma.trip.createMany({ data: batch })
  }

  console.log(`✅ Created ${trips.length} trips for the next 30 days`)
  console.log('🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })