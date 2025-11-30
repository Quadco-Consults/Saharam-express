import nodemailer from 'nodemailer'
import { createTransporter } from './emailConfig'

export interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: string
    contentType: string
  }>
}

export interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
}

// Create email transporter
let transporter: nodemailer.Transporter | null = null

async function getTransporter() {
  if (!transporter) {
    transporter = await createTransporter()
  }
  return transporter
}

// Send email
export async function sendEmail(data: EmailData): Promise<EmailResponse> {
  try {
    const emailTransporter = await getTransporter()

    if (!emailTransporter) {
      return {
        success: false,
        error: 'Email service not configured'
      }
    }

    const mailOptions = {
      from: `"Saharam Express" <${process.env.EMAIL_FROM || 'noreply@saharamexpress.com.ng'}>`,
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
      attachments: data.attachments
    }

    const result = await emailTransporter.sendMail(mailOptions)

    return {
      success: true,
      messageId: result.messageId
    }

  } catch (error: any) {
    console.error('Email sending error:', error)
    return {
      success: false,
      error: error.message || 'Email sending failed'
    }
  }
}

// Email templates
export const EMAIL_TEMPLATES = {
  BOOKING_CONFIRMATION: (data: {
    passengerName: string
    bookingRef: string
    route: string
    departureTime: string
    arrivalTime: string
    seatNumbers: string[]
    totalAmount: number
    qrCodeUrl?: string
  }) => ({
    subject: `Booking Confirmed - ${data.bookingRef} | Saharam Express`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #16a34a, #15803d); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 30px -20px; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .success-icon { font-size: 48px; margin-bottom: 15px; }
            .booking-details { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: 600; color: #555; }
            .detail-value { font-weight: bold; color: #16a34a; }
            .qr-section { text-align: center; margin: 30px 0; padding: 20px; background: #f0fdf4; border-radius: 8px; }
            .important-notes { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
            @media (max-width: 600px) {
              .container { margin: 0; border-radius: 0; }
              .detail-row { flex-direction: column; }
              .detail-label { margin-bottom: 5px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✅</div>
              <div class="logo">SAHARAM EXPRESS</div>
              <h2 style="margin: 0;">Booking Confirmed!</h2>
            </div>

            <p>Dear ${data.passengerName},</p>
            <p>Thank you for choosing Saharam Express! Your booking has been confirmed and payment received.</p>

            <div class="booking-details">
              <h3 style="margin-top: 0; color: #16a34a;">Booking Details</h3>
              <div class="detail-row">
                <span class="detail-label">Booking Reference:</span>
                <span class="detail-value">${data.bookingRef}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Route:</span>
                <span class="detail-value">${data.route}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Departure:</span>
                <span class="detail-value">${data.departureTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Arrival:</span>
                <span class="detail-value">${data.arrivalTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Seat(s):</span>
                <span class="detail-value">${data.seatNumbers.join(', ')}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount Paid:</span>
                <span class="detail-value">₦${data.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            ${data.qrCodeUrl ? `
              <div class="qr-section">
                <h3 style="color: #16a34a;">Your Digital Ticket</h3>
                <p>Scan this QR code for quick verification:</p>
                <img src="${data.qrCodeUrl}" alt="Ticket QR Code" style="max-width: 200px; margin: 10px 0;">
                <p style="font-size: 12px; color: #666;">Present this QR code to the driver during boarding</p>
              </div>
            ` : ''}

            <div class="important-notes">
              <h4 style="margin-top: 0; color: #1e40af;">Important Information:</h4>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Arrive at the terminal 30 minutes before departure</li>
                <li>Bring a valid ID that matches your booking name</li>
                <li>Present your digital ticket QR code for verification</li>
                <li>Contact support for any changes or emergencies</li>
              </ul>
            </div>

            <p>We wish you a safe and comfortable journey!</p>

            <div class="footer">
              <p><strong>Saharam Express Limited</strong><br>
              Email: info@saharamexpress.com.ng<br>
              Phone: +234-XXX-XXX-XXXX</p>
              <p style="font-size: 12px; color: #999;">
                This is an automated email. Please do not reply to this message.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      SAHARAM EXPRESS - Booking Confirmed!

      Dear ${data.passengerName},

      Your booking has been confirmed:

      Booking Reference: ${data.bookingRef}
      Route: ${data.route}
      Departure: ${data.departureTime}
      Arrival: ${data.arrivalTime}
      Seats: ${data.seatNumbers.join(', ')}
      Amount Paid: ₦${data.totalAmount.toLocaleString()}

      Please arrive 30 minutes early and bring valid ID.
      Present your digital ticket QR code for verification.

      Safe travels!

      Saharam Express Limited
    `
  }),

  PAYMENT_RECEIPT: (data: {
    passengerName: string
    bookingRef: string
    amount: number
    paymentMethod: string
    transactionRef: string
  }) => ({
    subject: `Payment Receipt - ${data.bookingRef} | Saharam Express`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .receipt-details { background: #f8f9fa; padding: 20px; border-radius: 8px; }
            .amount { font-size: 24px; font-weight: bold; color: #16a34a; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="color: #16a34a;">Payment Received</h2>
              <p>Thank you for your payment!</p>
            </div>

            <div class="receipt-details">
              <h3>Receipt Details</h3>
              <p><strong>Passenger:</strong> ${data.passengerName}</p>
              <p><strong>Booking Reference:</strong> ${data.bookingRef}</p>
              <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
              <p><strong>Transaction Reference:</strong> ${data.transactionRef}</p>
              <div class="amount">₦${data.amount.toLocaleString()}</div>
              <p style="text-align: center; color: #666; font-size: 14px;">
                Payment processed successfully
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  })
}

// Send booking confirmation email
export async function sendBookingConfirmationEmail(booking: {
  passenger_name: string
  booking_reference: string
  user: { email: string }
  trip: {
    route: { from_city: string; to_city: string }
    departure_time: string
    arrival_time: string
  }
  seat_numbers: string[]
  total_amount: number
  qr_code?: string
}): Promise<EmailResponse> {
  const departureTime = new Date(booking.trip.departure_time).toLocaleString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const arrivalTime = new Date(booking.trip.arrival_time).toLocaleString('en-NG', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const template = EMAIL_TEMPLATES.BOOKING_CONFIRMATION({
    passengerName: booking.passenger_name,
    bookingRef: booking.booking_reference,
    route: `${booking.trip.route.from_city} → ${booking.trip.route.to_city}`,
    departureTime,
    arrivalTime,
    seatNumbers: booking.seat_numbers,
    totalAmount: booking.total_amount,
    qrCodeUrl: booking.qr_code
  })

  return sendEmail({
    to: booking.user.email,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
}

// Send payment receipt email
export async function sendPaymentReceiptEmail(booking: {
  passenger_name: string
  booking_reference: string
  user: { email: string }
  total_amount: number
  payment_method: string
  payment_reference: string
}): Promise<EmailResponse> {
  const template = EMAIL_TEMPLATES.PAYMENT_RECEIPT({
    passengerName: booking.passenger_name,
    bookingRef: booking.booking_reference,
    amount: booking.total_amount,
    paymentMethod: booking.payment_method.toUpperCase(),
    transactionRef: booking.payment_reference
  })

  return sendEmail({
    to: booking.user.email,
    subject: template.subject,
    html: template.html
  })
}