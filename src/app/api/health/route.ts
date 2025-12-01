import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Simple health check - just return success
    // In a real app, you might check database connectivity, external services, etc.
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Service temporarily unavailable'
      },
      { status: 503 }
    )
  }
}