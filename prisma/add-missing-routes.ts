import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addMissingRoutes() {
  console.log('🛣️ Adding missing routes and trips...')

  try {
    // Check and add missing routes
    const missingRoutes = [
      { fromCity: 'Kano', toCity: 'Kaduna', distance: 160, estimatedDuration: 120, basePrice: 2000.00 },
      { fromCity: 'Kano', toCity: 'Lagos', distance: 1050, estimatedDuration: 660, basePrice: 6500.00 },
      { fromCity: 'Abuja', toCity: 'Kano', distance: 350, estimatedDuration: 240, basePrice: 3500.00 }
    ]

    for (const routeData of missingRoutes) {
      const existingRoute = await prisma.route.findUnique({
        where: {
          fromCity_toCity: {
            fromCity: routeData.fromCity,
            toCity: routeData.toCity
          }
        }
      })

      if (!existingRoute) {
        const route = await prisma.route.create({
          data: routeData
        })
        console.log(`✅ Created route: ${route.fromCity} → ${route.toCity}`)
      } else {
        console.log(`✅ Route already exists: ${routeData.fromCity} → ${routeData.toCity}`)
      }
    }

    // Get all routes
    const allRoutes = await prisma.route.findMany()
    console.log(`📍 Total routes in database: ${allRoutes.length}`)

    // Print all routes for verification
    allRoutes.forEach(route => {
      console.log(`   - ${route.fromCity} → ${route.toCity}`)
    })

    // Create trips for the next 7 days for the missing routes
    const targetRoutes = [
      { fromCity: 'Kano', toCity: 'Kaduna' },
      { fromCity: 'Kano', toCity: 'Lagos' },
      { fromCity: 'Abuja', toCity: 'Kano' }
    ]

    const allVehicles = await prisma.vehicle.findMany({ where: { status: 'ACTIVE' } })
    const allDrivers = await prisma.driver.findMany({ where: { status: 'ACTIVE' } })

    const trips = []
    const now = new Date()

    for (let day = 1; day <= 7; day++) {
      const tripDate = new Date(now)
      tripDate.setDate(now.getDate() + day)

      // Skip Sundays
      if (tripDate.getDay() === 0) continue

      for (const routeInfo of targetRoutes) {
        const route = await prisma.route.findUnique({
          where: {
            fromCity_toCity: {
              fromCity: routeInfo.fromCity,
              toCity: routeInfo.toCity
            }
          }
        })

        if (!route) continue

        // Check if trips already exist for this route and date
        const existingTrips = await prisma.trip.count({
          where: {
            routeId: route.id,
            departureTime: {
              gte: new Date(tripDate.setHours(0, 0, 0, 0)),
              lt: new Date(tripDate.setHours(23, 59, 59, 999))
            }
          }
        })

        if (existingTrips > 0) {
          console.log(`✅ Trips already exist for ${route.fromCity} → ${route.toCity} on ${tripDate.toDateString()}`)
          continue
        }

        // Morning trips (6 AM, 10 AM, 2 PM)
        for (const hour of [6, 10, 14]) {
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

    // Create trips in batches
    if (trips.length > 0) {
      for (let i = 0; i < trips.length; i += 20) {
        const batch = trips.slice(i, i + 20)
        await prisma.trip.createMany({ data: batch })
      }
      console.log(`✅ Created ${trips.length} new trips for missing routes`)
    } else {
      console.log('✅ All trips already exist for these routes')
    }

    console.log('🎉 Missing routes and trips added successfully!')

  } catch (error) {
    console.error('❌ Error adding missing routes:', error)
    throw error
  }
}

addMissingRoutes()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })