'use client'
import { useState } from 'react'
import { ArrowLeft, QrCode } from 'lucide-react'
import { useRouter } from 'next/navigation'
import QRScanner from '@/components/QRScanner'

export default function VerifyTicketsPage() {
  const [scannerActive, setScannerActive] = useState(false)
  const [scanHistory, setScanHistory] = useState<Array<{
    timestamp: string
    qrData: string
    result: 'success' | 'error'
    message: string
  }>>([])

  const router = useRouter()

  const handleScanSuccess = (qrCodeData: string) => {
    setScanHistory(prev => [{
      timestamp: new Date().toISOString(),
      qrData: qrCodeData.substring(0, 50) + '...',
      result: 'success',
      message: 'Ticket verified successfully'
    }, ...prev.slice(0, 9)]) // Keep last 10 scans
  }

  const handleScanError = (error: string) => {
    setScanHistory(prev => [{
      timestamp: new Date().toISOString(),
      qrData: 'Error occurred',
      result: 'error',
      message: error
    }, ...prev.slice(0, 9)])
  }

  const toggleScanner = () => {
    setScannerActive(!scannerActive)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className=\"flex-1\">
      {/* Header */}
      <div className=\"bg-white border-b border-gray-200 px-8 py-6\">
        <div className=\"flex items-center gap-4\">
          <button
            onClick={() => router.back()}
            className=\"p-2 hover:bg-gray-100 rounded-lg transition-colors\"
          >
            <ArrowLeft className=\"w-5 h-5\" />
          </button>
          <div>
            <h1 className=\"text-2xl font-bold text-gray-900\">Ticket Verification</h1>
            <p className=\"text-gray-600 mt-1\">Scan passenger QR codes to verify tickets</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className=\"p-8\">
        <div className=\"max-w-4xl mx-auto space-y-8\">
          {/* Scanner Controls */}
          <div className=\"bg-white rounded-xl border border-gray-200 p-6\">
            <div className=\"flex items-center justify-between mb-6\">
              <div>
                <h2 className=\"text-lg font-semibold text-gray-900\">QR Code Scanner</h2>
                <p className=\"text-sm text-gray-600\">
                  {scannerActive ? 'Scanner is active and ready to scan' : 'Click to activate the QR scanner'}
                </p>
              </div>
              <button
                onClick={toggleScanner}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  scannerActive
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-saharam-500 text-white hover:bg-saharam-600'
                }`}
              >
                <QrCode className=\"w-4 h-4\" />
                {scannerActive ? 'Stop Scanner' : 'Start Scanner'}
              </button>
            </div>

            {/* Scanner Component */}
            <QRScanner
              isActive={scannerActive}
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
            />
          </div>

          {/* Scan History */}
          <div className=\"bg-white rounded-xl border border-gray-200 p-6\">
            <h2 className=\"text-lg font-semibold text-gray-900 mb-4\">Recent Scans</h2>

            {scanHistory.length === 0 ? (
              <div className=\"text-center py-8 text-gray-500\">
                <QrCode className=\"w-12 h-12 mx-auto mb-3 opacity-50\" />
                <p>No scans yet</p>
                <p className=\"text-sm\">Activate the scanner to start verifying tickets</p>
              </div>
            ) : (
              <div className=\"space-y-3\">
                {scanHistory.map((scan, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      scan.result === 'success'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className=\"flex-1\">
                      <div className=\"flex items-center gap-2 mb-1\">
                        <div className={`w-2 h-2 rounded-full ${
                          scan.result === 'success' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className={`text-sm font-medium ${
                          scan.result === 'success' ? 'text-green-900' : 'text-red-900'
                        }`}>
                          {scan.message}
                        </span>
                      </div>
                      <p className=\"text-xs text-gray-600 font-mono\">{scan.qrData}</p>
                    </div>
                    <div className=\"text-right\">
                      <p className=\"text-xs text-gray-500\">{formatTime(scan.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Usage Guidelines */}
          <div className=\"bg-blue-50 rounded-xl border border-blue-200 p-6\">
            <h3 className=\"font-semibold text-blue-900 mb-3\">Verification Guidelines</h3>
            <div className=\"grid md:grid-cols-2 gap-4 text-sm text-blue-800\">
              <div>
                <h4 className=\"font-medium mb-2\">✅ Valid Tickets Show:</h4>
                <ul className=\"space-y-1 list-disc list-inside text-blue-700\">
                  <li>Green verification status</li>
                  <li>Passenger details</li>
                  <li>Seat numbers</li>
                  <li>Trip information</li>
                  <li>Boarding status</li>
                </ul>
              </div>
              <div>
                <h4 className=\"font-medium mb-2\">❌ Invalid Tickets Show:</h4>
                <ul className=\"space-y-1 list-disc list-inside text-blue-700\">
                  <li>Red error status</li>
                  <li>Reason for rejection</li>
                  <li>Unpaid bookings</li>
                  <li>Expired tickets</li>
                  <li>Wrong trip information</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Emergency Actions */}
          <div className=\"bg-yellow-50 rounded-xl border border-yellow-200 p-6\">
            <h3 className=\"font-semibold text-yellow-900 mb-3\">Emergency Procedures</h3>
            <div className=\"text-sm text-yellow-800 space-y-2\">
              <p>
                <strong>Manual Verification:</strong> If QR scanner fails, verify booking reference manually in admin dashboard.
              </p>
              <p>
                <strong>Network Issues:</strong> Check passenger's digital ticket screenshot and contact admin for verification.
              </p>
              <p>
                <strong>Disputes:</strong> Direct passenger to contact customer support with booking reference.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}