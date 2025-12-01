import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phone: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    // Get user from token
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Get fresh user data from database
    const userData = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!userData) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role
      }
    })

  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get user from token
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validation = updateProfileSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid input: ' + validation.error.errors.map(e => e.message).join(', ')
      }, { status: 400 })
    }

    const updates = validation.data

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(updates.firstName && { firstName: updates.firstName }),
        ...(updates.lastName && { lastName: updates.lastName }),
        ...(updates.phone && { phone: updates.phone })
      }
    })

    // Return updated user data
    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role
      }
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}