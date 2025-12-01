import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('Checking users...')

    // Check existing users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    })

    console.log('Current users:', users)

    if (users.length === 0) {
      console.log('No users found. Creating admin user...')

      const passwordHash = await bcrypt.hash('admin123', 10)

      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@saharanexpress.com',
          passwordHash,
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN'
        }
      })

      console.log('Created admin user:', {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role
      })

      console.log('You can now login with:')
      console.log('Email: admin@saharanexpress.com')
      console.log('Password: admin123')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()