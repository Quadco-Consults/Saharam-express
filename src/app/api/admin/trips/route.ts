import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 })
  }
  return NextResponse.json({ success: false, error: 'Not implemented yet' }, { status: 501 })
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 })
  }
  return NextResponse.json({ success: false, error: 'Not implemented yet' }, { status: 501 })
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 })
  }
  return NextResponse.json({ success: false, error: 'Not implemented yet' }, { status: 501 })
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 })
  }
  return NextResponse.json({ success: false, error: 'Not implemented yet' }, { status: 501 })
}
