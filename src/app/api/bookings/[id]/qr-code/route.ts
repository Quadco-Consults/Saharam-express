import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  return NextResponse.json({ success: false, error: 'Not implemented yet' }, { status: 501 })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: false, error: 'Not implemented yet' }, { status: 501 })
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ success: false, error: 'Not implemented yet' }, { status: 501 })
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ success: false, error: 'Not implemented yet' }, { status: 501 })
}
