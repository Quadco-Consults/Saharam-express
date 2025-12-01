import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid input: ' + validation.error.errors.map(e => e.message).join(', ')
      }, { status: 400 })
    }

    const { email, password } = validation.data

    // Attempt login
    const result = await AuthService.login(email, password)

    if (!result) {
      return NextResponse.json({
        error: 'Invalid email or password'
      }, { status: 401 })
    }

    const { user, token } = result

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

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}