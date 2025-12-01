import axios from 'axios'

// SMS Configuration - using Termii as a popular Nigerian SMS provider
const SMS_API_URL = 'https://api.ng.termii.com/api/sms/send'
const SMS_API_KEY = process.env.SMS_API_KEY || ''
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'SaharanExp'

export interface SMSData {
  to: string
  message: string
  type?: 'plain' | 'unicode'
}

export interface SMSResponse {
  success: boolean
  messageId?: string
  error?: string
}

// Send SMS using Termii API
export async function sendSMS(data: SMSData): Promise<SMSResponse> {
  try {
    if (!SMS_API_KEY) {
      console.warn('SMS_API_KEY not configured')
      return {
        success: false,
        error: 'SMS service not configured'
      }
    }

    // Ensure phone number is in international format
    let phoneNumber = data.to.replace(/\D/g, '') // Remove all non-digits

    // Add Nigeria country code if not present
    if (!phoneNumber.startsWith('234')) {
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '234' + phoneNumber.substring(1)
      } else if (phoneNumber.length === 10) {
        phoneNumber = '234' + phoneNumber
      }
    }

    const payload = {
      to: phoneNumber,
      from: SMS_SENDER_ID,
      sms: data.message,
      type: data.type || 'plain',
      api_key: SMS_API_KEY,
      channel: 'generic'
    }

    const response = await axios.post(SMS_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    })

    if (response.data && response.data.code === 'ok') {
      return {
        success: true,
        messageId: response.data.message_id
      }
    } else {
      return {
        success: false,
        error: response.data?.message || 'Failed to send SMS'
      }
    }

  } catch (error: any) {
    console.error('SMS sending error:', error)
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'SMS sending failed'
    }
  }
}

// Predefined SMS templates
export const SMS_TEMPLATES = {
  BOOKING_CONFIRMATION: (data: {
    passengerName: string
    bookingRef: string
    route: string
    departureTime: string
    seatNumbers: string[]
  }) => `Hi ${data.passengerName}! Your Saharan Express booking is confirmed.
Ref: ${data.bookingRef}
Route: ${data.route}
Departure: ${data.departureTime}
Seats: ${data.seatNumbers.join(', ')}
Present your digital ticket for boarding. Safe travels!`,

  PAYMENT_CONFIRMATION: (data: {
    passengerName: string
    bookingRef: string
    amount: number
  }) => `Payment confirmed! ₦${data.amount.toLocaleString()} received for booking ${data.bookingRef}. Your digital ticket is ready for download.`,

  DEPARTURE_REMINDER: (data: {
    passengerName: string
    route: string
    departureTime: string
    terminal: string
  }) => `Reminder: Your Saharan Express trip ${data.route} departs in 2 hours at ${data.departureTime}. Please arrive at ${data.terminal} 30 minutes early.`,

  TRIP_UPDATE: (data: {
    bookingRef: string
    update: string
  }) => `Trip Update - Booking ${data.bookingRef}: ${data.update}. Contact support for assistance: +234-XXX-XXXX`,

  CANCELLATION: (data: {
    passengerName: string
    bookingRef: string
    refundAmount?: number
  }) => `Your booking ${data.bookingRef} has been cancelled${data.refundAmount ? `. Refund of ₦${data.refundAmount.toLocaleString()} will be processed in 3-5 business days` : ''}. Thank you for choosing Saharan Express.`
}

// Send booking confirmation SMS
export async function sendBookingConfirmationSMS(booking: {
  passenger_name: string
  booking_reference: string
  passenger_phone: string
  trip: {
    route: { from_city: string; to_city: string }
    departure_time: string
  }
  seat_numbers: string[]
}): Promise<SMSResponse> {
  const departureTime = new Date(booking.trip.departure_time).toLocaleString('en-NG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const message = SMS_TEMPLATES.BOOKING_CONFIRMATION({
    passengerName: booking.passenger_name,
    bookingRef: booking.booking_reference,
    route: `${booking.trip.route.from_city} → ${booking.trip.route.to_city}`,
    departureTime,
    seatNumbers: booking.seat_numbers
  })

  return sendSMS({
    to: booking.passenger_phone,
    message
  })
}

// Send payment confirmation SMS
export async function sendPaymentConfirmationSMS(booking: {
  passenger_name: string
  booking_reference: string
  passenger_phone: string
  total_amount: number
}): Promise<SMSResponse> {
  const message = SMS_TEMPLATES.PAYMENT_CONFIRMATION({
    passengerName: booking.passenger_name,
    bookingRef: booking.booking_reference,
    amount: booking.total_amount
  })

  return sendSMS({
    to: booking.passenger_phone,
    message
  })
}

// Send departure reminder SMS
export async function sendDepartureReminderSMS(booking: {
  passenger_name: string
  passenger_phone: string
  trip: {
    route: { from_city: string; to_city: string }
    departure_time: string
  }
}): Promise<SMSResponse> {
  const departureTime = new Date(booking.trip.departure_time).toLocaleString('en-NG', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const message = SMS_TEMPLATES.DEPARTURE_REMINDER({
    passengerName: booking.passenger_name,
    route: `${booking.trip.route.from_city} → ${booking.trip.route.to_city}`,
    departureTime,
    terminal: `${booking.trip.route.from_city} Terminal`
  })

  return sendSMS({
    to: booking.passenger_phone,
    message
  })
}