import {
  sendBookingConfirmationSMS,
  sendPaymentConfirmationSMS,
  sendDepartureReminderSMS
} from './sms'
import {
  sendBookingConfirmationEmail,
  sendPaymentReceiptEmail
} from './email'
import { createServerClient } from '@/lib/supabase-server'

export interface NotificationResult {
  sms: { success: boolean; error?: string }
  email: { success: boolean; error?: string }
}

// Log notification to database
async function logNotification(
  userId: string,
  type: 'sms' | 'email',
  title: string,
  message: string,
  success: boolean
) {
  try {
    const supabase = await createServerClient()
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message: success ? message : `Failed: ${message}`,
        is_read: false,
        sent_at: success ? new Date().toISOString() : null
      })
  } catch (error) {
    console.error('Failed to log notification:', error)
  }
}

// Send booking confirmation notifications (SMS + Email)
export async function sendBookingConfirmation(booking: {
  id: string
  user_id: string
  passenger_name: string
  booking_reference: string
  passenger_phone: string
  total_amount: number
  seat_numbers: string[]
  qr_code?: string
  trip: {
    route: { from_city: string; to_city: string }
    departure_time: string
    arrival_time: string
  }
  user: { email: string }
}): Promise<NotificationResult> {
  const results: NotificationResult = {
    sms: { success: false },
    email: { success: false }
  }

  // Send SMS notification
  try {
    const smsResult = await sendBookingConfirmationSMS(booking)
    results.sms = smsResult

    await logNotification(
      booking.user_id,
      'sms',
      'Booking Confirmation',
      `Booking ${booking.booking_reference} confirmed`,
      smsResult.success
    )
  } catch (error) {
    console.error('SMS notification error:', error)
    results.sms = { success: false, error: 'SMS sending failed' }
  }

  // Send Email notification
  try {
    const emailResult = await sendBookingConfirmationEmail(booking)
    results.email = emailResult

    await logNotification(
      booking.user_id,
      'email',
      'Booking Confirmation',
      `Booking confirmation email sent for ${booking.booking_reference}`,
      emailResult.success
    )
  } catch (error) {
    console.error('Email notification error:', error)
    results.email = { success: false, error: 'Email sending failed' }
  }

  return results
}

// Send payment confirmation notifications
export async function sendPaymentConfirmation(booking: {
  id: string
  user_id: string
  passenger_name: string
  booking_reference: string
  passenger_phone: string
  total_amount: number
  payment_method: string
  payment_reference: string
  user: { email: string }
}): Promise<NotificationResult> {
  const results: NotificationResult = {
    sms: { success: false },
    email: { success: false }
  }

  // Send SMS notification
  try {
    const smsResult = await sendPaymentConfirmationSMS(booking)
    results.sms = smsResult

    await logNotification(
      booking.user_id,
      'sms',
      'Payment Confirmation',
      `Payment received for booking ${booking.booking_reference}`,
      smsResult.success
    )
  } catch (error) {
    console.error('Payment SMS error:', error)
    results.sms = { success: false, error: 'SMS sending failed' }
  }

  // Send Email receipt
  try {
    const emailResult = await sendPaymentReceiptEmail(booking)
    results.email = emailResult

    await logNotification(
      booking.user_id,
      'email',
      'Payment Receipt',
      `Payment receipt sent for booking ${booking.booking_reference}`,
      emailResult.success
    )
  } catch (error) {
    console.error('Payment email error:', error)
    results.email = { success: false, error: 'Email sending failed' }
  }

  return results
}

// Send departure reminder notifications
export async function sendDepartureReminder(booking: {
  user_id: string
  passenger_name: string
  passenger_phone: string
  trip: {
    route: { from_city: string; to_city: string }
    departure_time: string
  }
}): Promise<NotificationResult> {
  const results: NotificationResult = {
    sms: { success: false },
    email: { success: false } // Email reminder not implemented yet
  }

  // Send SMS reminder
  try {
    const smsResult = await sendDepartureReminderSMS(booking)
    results.sms = smsResult

    await logNotification(
      booking.user_id,
      'sms',
      'Departure Reminder',
      `Departure reminder sent for ${booking.trip.route.from_city} → ${booking.trip.route.to_city}`,
      smsResult.success
    )
  } catch (error) {
    console.error('Reminder SMS error:', error)
    results.sms = { success: false, error: 'SMS sending failed' }
  }

  return results
}

// Send trip update notification
export async function sendTripUpdate(
  userIds: string[],
  bookingRef: string,
  update: string
): Promise<void> {
  // This would send notifications to multiple users about trip updates
  // Implementation would depend on having user contact information
  console.log('Trip update notification:', { userIds, bookingRef, update })
}

// Get user notifications from database
export async function getUserNotifications(userId: string, limit = 20) {
  try {
    const supabase = await createServerClient()

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching notifications:', error)
      return []
    }

    return notifications || []
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error marking notification as read:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return false
  }
}

export * from './sms'
export * from './email'
export * from './emailConfig'