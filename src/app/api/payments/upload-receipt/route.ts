import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { z } from 'zod'

// Validation schema
const uploadReceiptSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  paymentReference: z.string().min(1, 'Payment reference is required'),
  amountPaid: z.string().transform(val => parseFloat(val))
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Get form fields
    const receipt = formData.get('receipt') as File
    const bookingId = formData.get('bookingId') as string
    const paymentReference = formData.get('paymentReference') as string
    const amountPaid = formData.get('amountPaid') as string

    // Validate required fields
    const validationResult = uploadReceiptSchema.safeParse({
      bookingId,
      paymentReference,
      amountPaid
    })

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    // Validate file
    if (!receipt) {
      return NextResponse.json(
        { success: false, error: 'Receipt file is required' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(receipt.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload JPG, PNG, or WebP images only.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (receipt.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: validationResult.data.bookingId }
    })

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if payment reference matches
    if (booking.paymentReference !== validationResult.data.paymentReference) {
      return NextResponse.json(
        { success: false, error: 'Payment reference mismatch' },
        { status: 400 }
      )
    }

    // Check if receipt already exists
    const existingReceipt = await prisma.paymentReceipt.findUnique({
      where: { bookingId: validationResult.data.bookingId }
    })

    if (existingReceipt) {
      return NextResponse.json(
        { success: false, error: 'Payment receipt has already been uploaded for this booking' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'receipts')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const fileExtension = receipt.name.split('.').pop() || 'jpg'
    const fileName = `receipt_${booking.bookingReference}_${timestamp}_${randomString}.${fileExtension}`
    const filePath = path.join(uploadsDir, fileName)

    // Save file
    const buffer = Buffer.from(await receipt.arrayBuffer())
    await writeFile(filePath, buffer)

    // Create receipt record in database
    const receiptRecord = await prisma.paymentReceipt.create({
      data: {
        bookingId: validationResult.data.bookingId,
        receiptUrl: `/uploads/receipts/${fileName}`,
        fileName: receipt.name,
        fileSize: receipt.size,
        mimeType: receipt.type,
        status: 'PENDING',
        uploadedBy: booking.userId, // Will be null for guest bookings
        amountPaid: validationResult.data.amountPaid,
        transferDate: new Date() // User can provide this later via admin interface
      }
    })

    // Update booking status to indicate receipt has been uploaded
    await prisma.booking.update({
      where: { id: validationResult.data.bookingId },
      data: {
        paymentStatus: 'PENDING' // Keep as pending until admin approves
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment receipt uploaded successfully. Your booking will be confirmed within 2-4 hours after verification.',
      data: {
        receiptId: receiptRecord.id,
        bookingReference: booking.bookingReference,
        status: 'pending_verification'
      }
    })

  } catch (error) {
    console.error('Receipt upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload receipt. Please try again.' },
      { status: 500 }
    )
  }
}