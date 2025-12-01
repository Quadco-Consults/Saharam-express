import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    // Get user from token
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}