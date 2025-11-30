'use client'
import Image from 'next/image'
import { QrCode, Download, Share2, Calendar, MapPin, Clock, Users, Hash } from 'lucide-react'

interface DigitalTicketProps {
  booking: {
    id: string
    booking_reference: string
    passenger_name: string
    passenger_phone: string
    seat_numbers: string[]
    total_amount: number
    payment_status: string
    qr_code: string | null
    created_at: string
    trip: {
      id: string
      departure_time: string
      arrival_time: string
      status: string
      route: {
        from_city: string
        to_city: string
      }
      vehicle: {
        model: string
        plate_number: string
      }
    }
  }
}

export default function DigitalTicket({ booking }: DigitalTicketProps) {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-NG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-NG', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  const departure = formatDateTime(booking.trip.departure_time)
  const arrival = formatDateTime(booking.trip.arrival_time)

  const downloadTicket = async () => {
    // Create a printable version of the ticket
    const printContent = document.getElementById('digital-ticket')?.innerHTML
    if (printContent) {
      const printWindow = window.open('', '_blank')
      printWindow?.document.write(`
        <html>
          <head>
            <title>Saharam Express - Ticket ${booking.booking_reference}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .ticket-print { max-width: 400px; margin: 0 auto; }
              .no-print { display: none; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <div class="ticket-print">${printContent}</div>
          </body>
        </html>
      `)
    }
  }

  const shareTicket = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Saharam Express Ticket - ${booking.booking_reference}`,
          text: `My ticket for ${booking.trip.route.from_city} to ${booking.trip.route.to_city} on ${departure.date}`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Sharing failed:', error)
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href)
      alert('Ticket link copied to clipboard!')
    }
  }

  return (
    <div className=\"max-w-md mx-auto\">
      {/* Ticket Card */}
      <div
        id=\"digital-ticket\"
        className=\"bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200\"
      >
        {/* Header */}
        <div className=\"bg-gradient-to-r from-saharam-600 to-saharam-700 text-white p-6 text-center\">
          <h2 className=\"text-lg font-bold\">SAHARAM EXPRESS</h2>
          <p className=\"text-sm opacity-90\">Digital Ticket</p>
        </div>

        {/* Route Information */}
        <div className=\"p-6\">
          <div className=\"flex items-center justify-between mb-6\">
            <div className=\"text-center\">
              <p className=\"text-sm text-gray-600 mb-1\">FROM</p>
              <p className=\"font-bold text-lg text-gray-900\">{booking.trip.route.from_city}</p>
            </div>
            <div className=\"flex-1 mx-4\">
              <MapPin className=\"w-6 h-6 text-saharam-500 mx-auto\" />
              <div className=\"h-px bg-gray-300 mt-2\"></div>
            </div>
            <div className=\"text-center\">
              <p className=\"text-sm text-gray-600 mb-1\">TO</p>
              <p className=\"font-bold text-lg text-gray-900\">{booking.trip.route.to_city}</p>
            </div>
          </div>

          {/* Journey Details */}
          <div className=\"space-y-4 mb-6\">
            <div className=\"flex items-center gap-3\">
              <Calendar className=\"w-5 h-5 text-gray-400\" />
              <div>
                <p className=\"text-sm text-gray-600\">Date</p>
                <p className=\"font-medium\">{departure.date}</p>
              </div>
            </div>

            <div className=\"flex items-center gap-3\">
              <Clock className=\"w-5 h-5 text-gray-400\" />
              <div>
                <p className=\"text-sm text-gray-600\">Departure Time</p>
                <p className=\"font-medium\">{departure.time}</p>
              </div>
            </div>

            <div className=\"flex items-center gap-3\">
              <Users className=\"w-5 h-5 text-gray-400\" />
              <div>
                <p className=\"text-sm text-gray-600\">Seats</p>
                <p className=\"font-medium\">{booking.seat_numbers.join(', ')}</p>
              </div>
            </div>

            <div className=\"flex items-center gap-3\">
              <Hash className=\"w-5 h-5 text-gray-400\" />
              <div>
                <p className=\"text-sm text-gray-600\">Booking Reference</p>
                <p className=\"font-mono font-bold text-saharam-600\">{booking.booking_reference}</p>
              </div>
            </div>
          </div>

          {/* Passenger Information */}
          <div className=\"border-t border-gray-200 pt-4 mb-6\">
            <h3 className=\"font-semibold text-gray-900 mb-2\">Passenger Details</h3>
            <p className=\"text-gray-700\">{booking.passenger_name}</p>
            <p className=\"text-gray-600 text-sm\">{booking.passenger_phone}</p>
            <p className=\"text-gray-600 text-sm mt-1\">Amount Paid: {formatCurrency(booking.total_amount)}</p>
          </div>

          {/* QR Code */}
          {booking.qr_code && (
            <div className=\"text-center border-t border-gray-200 pt-6\">
              <p className=\"text-sm text-gray-600 mb-4\">Scan QR code for verification</p>
              <div className=\"inline-block p-4 bg-gray-50 rounded-lg\">
                <Image
                  src={booking.qr_code}
                  alt=\"Ticket QR Code\"
                  width={200}
                  height={200}
                  className=\"mx-auto\"
                />
              </div>
              <p className=\"text-xs text-gray-500 mt-3\">
                Present this QR code to the driver for verification
              </p>
            </div>
          )}

          {/* Status */}
          <div className=\"mt-6 text-center\">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              booking.payment_status === 'paid'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {booking.payment_status === 'paid' ? '✓ Confirmed' : 'Pending Payment'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className=\"mt-6 flex gap-3 no-print\">
        <button
          onClick={downloadTicket}
          className=\"flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors\"
        >
          <Download className=\"w-4 h-4\" />
          Download
        </button>

        <button
          onClick={shareTicket}
          className=\"flex-1 flex items-center justify-center gap-2 bg-saharam-500 text-white py-3 px-4 rounded-lg hover:bg-saharam-600 transition-colors\"
        >
          <Share2 className=\"w-4 h-4\" />
          Share
        </button>
      </div>

      {/* Important Notes */}
      <div className=\"mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 no-print\">
        <h4 className=\"font-semibold text-gray-900 mb-2\">Important Notes:</h4>
        <ul className=\"space-y-1 text-xs\">
          <li>• Please arrive at the terminal 30 minutes before departure</li>
          <li>• Present this QR code to the driver for verification</li>
          <li>• No smoking or drinking allowed during the journey</li>
          <li>• Contact support for any changes or cancellations</li>
        </ul>
      </div>
    </div>
  )
}