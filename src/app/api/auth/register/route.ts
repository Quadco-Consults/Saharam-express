import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid input: ' + validation.error.errors.map(e => e.message).join(', ')
      }, { status: 400 })
    }

    const { email, password, firstName, lastName } = validation.data

    // Attempt registration
    try {
      const user = await AuthService.register(email, password, firstName, lastName)
      const token = AuthService.generateToken(user)

      // Return success response
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        token
      })

    } catch (registrationError: any) {
      if (registrationError.message === 'User already exists') {
        return NextResponse.json({
          error: 'An account with this email already exists'
        }, { status: 409 })
      }
      throw registrationError
    }

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}