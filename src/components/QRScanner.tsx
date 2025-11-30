'use client'
import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { Camera, CameraOff, CheckCircle, XCircle, AlertCircle, Scan } from 'lucide-react'

interface QRScannerProps {
  onScanSuccess: (qrCodeData: string) => void
  onScanError?: (error: string) => void
  isActive: boolean
}

interface VerificationResult {
  valid: boolean
  status?: string
  message?: string
  data?: {
    booking: {
      reference: string
      passenger_name: string
      seat_numbers: string[]
      passenger_phone: string
      total_amount: number
    }
    trip: {
      departure_time: string
      route: string
      vehicle: string
    }
    verification_time: string
  }
  error?: string
}

export default function QRScanner({ onScanSuccess, onScanError, isActive }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [lastScan, setLastScan] = useState<string>('')
  const [verification, setVerification] = useState<VerificationResult | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    if (isActive && !isScanning) {
      startScanner()
    } else if (!isActive && isScanning) {
      stopScanner()
    }

    return () => {
      stopScanner()
    }
  }, [isActive])

  const startScanner = () => {
    if (scannerRef.current || isScanning) return

    try {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          aspectRatio: 1.0
        },
        false
      )

      scanner.render(
        (decodedText) => {
          if (decodedText !== lastScan) {
            setLastScan(decodedText)
            handleScanSuccess(decodedText)
          }
        },
        (error) => {
          // Ignore frequent scanning errors
          if (!error.includes('No MultiFormat Readers')) {
            console.warn('QR scan error:', error)
          }
        }
      )

      scannerRef.current = scanner
      setIsScanning(true)
    } catch (error) {
      console.error('Failed to start QR scanner:', error)
      onScanError?.('Failed to start camera')
    }
  }

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear()
        scannerRef.current = null
        setIsScanning(false)
      } catch (error) {
        console.error('Error stopping scanner:', error)
      }
    }
  }

  const handleScanSuccess = async (qrCodeData: string) => {
    setIsVerifying(true)
    setVerification(null)

    try {
      const response = await fetch('/api/tickets/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCodeData })
      })

      const result = await response.json()

      setVerification(result.verification ? {
        valid: result.verification.valid,
        status: result.verification.status,
        message: result.verification.message,
        data: result.data,
        error: result.error
      } : {
        valid: false,
        error: result.error || 'Verification failed'
      })

      onScanSuccess(qrCodeData)
    } catch (error) {
      console.error('Verification error:', error)
      setVerification({
        valid: false,
        error: 'Failed to verify ticket'
      })
      onScanError?.('Failed to verify ticket')
    } finally {
      setIsVerifying(false)
    }
  }

  const getStatusIcon = () => {
    if (isVerifying) {
      return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    }

    if (!verification) {
      return <Scan className="w-8 h-8 text-gray-400" />
    }

    if (verification.valid) {
      return <CheckCircle className="w-8 h-8 text-green-600" />
    } else {
      return <XCircle className="w-8 h-8 text-red-600" />
    }
  }

  const getStatusColor = () => {
    if (!verification || isVerifying) return 'bg-gray-50 border-gray-200'
    return verification.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-NG', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Scanner Interface */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Ticket Verification</h3>
          <p className="text-sm text-gray-600">Scan passenger QR code to verify ticket</p>
        </div>

        {isActive ? (
          <div className="space-y-4">
            {/* QR Scanner */}
            <div className="relative">
              <div id="qr-reader" className="w-full"></div>
              {isVerifying && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="bg-white p-4 rounded-lg flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-saharam-600"></div>
                    <span className="text-gray-900 font-medium">Verifying...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Scanner Status */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              {isScanning ? (
                <>
                  <Camera className="w-4 h-4 text-green-600" />
                  <span>Camera active</span>
                </>
              ) : (
                <>
                  <CameraOff className="w-4 h-4 text-red-600" />
                  <span>Camera inactive</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CameraOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Scanner is disabled</p>
          </div>
        )}
      </div>

      {/* Verification Result */}
      {(verification || isVerifying) && (
        <div className={`rounded-xl border p-6 ${getStatusColor()}`}>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {getStatusIcon()}
            </div>

            <div className="flex-1">
              {isVerifying ? (
                <div>
                  <h4 className="font-semibold text-gray-900">Verifying ticket...</h4>
                  <p className="text-sm text-gray-600">Please wait while we verify the ticket</p>
                </div>
              ) : verification ? (
                <div>
                  <h4 className={`font-semibold ${verification.valid ? 'text-green-900' : 'text-red-900'}`}>
                    {verification.valid ? 'Valid Ticket' : 'Invalid Ticket'}
                  </h4>

                  {verification.message && (
                    <p className={`text-sm ${verification.valid ? 'text-green-700' : 'text-red-700'}`}>
                      {verification.message}
                    </p>
                  )}

                  {verification.error && (
                    <p className="text-sm text-red-700 mt-1">
                      {verification.error}
                    </p>
                  )}

                  {verification.valid && verification.data && (
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium text-gray-900">Passenger</p>
                          <p className="text-gray-700">{verification.data.booking.passenger_name}</p>
                          <p className="text-gray-600 text-xs">{verification.data.booking.passenger_phone}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Seats</p>
                          <p className="text-gray-700">{verification.data.booking.seat_numbers.join(', ')}</p>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium text-gray-900">Trip Details</p>
                        <p className="text-gray-700">{verification.data.trip.route}</p>
                        <p className="text-gray-600 text-xs">{formatDateTime(verification.data.trip.departure_time)}</p>
                        <p className="text-gray-600 text-xs">{verification.data.trip.vehicle}</p>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-green-200">
                        <span className="font-medium text-gray-900">Amount Paid</span>
                        <span className="font-bold text-green-900">
                          {formatCurrency(verification.data.booking.total_amount)}
                        </span>
                      </div>
                    </div>
                  )}

                  {verification.status && (
                    <div className="mt-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        verification.status === 'valid' ? 'bg-green-100 text-green-800' :
                        verification.status === 'boarding' ? 'bg-blue-100 text-blue-800' :
                        verification.status === 'too_early' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {verification.status === 'valid' && '✓ Ready to Board'}
                        {verification.status === 'boarding' && '🚌 Boarding Time'}
                        {verification.status === 'too_early' && '⏰ Too Early'}
                        {verification.status === 'expired' && '❌ Expired'}
                        {verification.status === 'boarding_ended' && '❌ Departed'}
                      </span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">How to use:</p>
            <ul className="space-y-1 text-xs">
              <li>1. Ask passenger to show their digital ticket</li>
              <li>2. Position the QR code within the scanning area</li>
              <li>3. Wait for automatic verification</li>
              <li>4. Check the verification result</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}