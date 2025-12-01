import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'saharam-express-secret'

export interface AuthUser {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  role: 'ADMIN' | 'CUSTOMER'
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  static generateToken(user: AuthUser): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    )
  }

  static verifyToken(token: string): AuthUser | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      return {
        id: decoded.id,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        role: decoded.role
      }
    } catch {
      return null
    }
  }

  static async register(email: string, password: string, firstName?: string, lastName?: string): Promise<AuthUser> {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new Error('User already exists')
    }

    const passwordHash = await this.hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: 'CUSTOMER'
      }
    })

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    }
  }

  static async login(email: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.passwordHash) {
      return null
    }

    const isValid = await this.verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return null
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    }

    const token = this.generateToken(authUser)

    return { user: authUser, token }
  }

  static async getUserById(id: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    }
  }

  static async createAdminUser(email: string, password: string, firstName: string, lastName: string): Promise<AuthUser> {
    const passwordHash = await this.hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: 'ADMIN'
      }
    })

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    }
  }
}