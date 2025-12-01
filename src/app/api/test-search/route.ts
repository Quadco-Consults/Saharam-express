import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Simple test endpoint that doesn't require database
  return NextResponse.json({
    success: true,
    message: "API is working",
    timestamp: new Date().toISOString(),
    url: request.url
  })
}