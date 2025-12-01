import { NextRequest } from 'next/server'
import { AuthService, AuthUser } from './auth'

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authorization = request.headers.get('authorization')

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return null
    }

    const token = authorization.replace('Bearer ', '')
    return AuthService.verifyToken(token)
  } catch (error) {
    return null
  }
}

export async function requireAdmin(request: NextRequest): Promise<AuthUser | null> {
  const user = await getAuthenticatedUser(request)

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return user
}