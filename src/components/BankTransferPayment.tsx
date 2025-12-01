'use client'
import { useState } from 'react'
import { Copy, Check, Upload, X, CreditCard, Building2, Clock, AlertCircle } from 'lucide-react'
import { paymentManager } from '@/lib/payments/payment-manager'

interface BankTransferPaymentProps {
  bookingData: {
    bookingId: string
    amount: number
    reference: string
    customerEmail: string
    customerName: string
    customerPhone: string
  }
  onSuccess: (reference: string) => void
  onError: (error: string) => void
}

interface BankAccount {
  bankName: string
  accountName: string
  accountNumber: string
  sortCode: string
}

export default function BankTransferPayment({
  bookingData,
  onSuccess,
  onError
}: BankTransferPaymentProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const bankDetails = paymentManager.getCompanyBankDetails()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        onError('Please upload only image files (JPG, PNG, WebP)')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        onError('File size must be less than 5MB')
        return
      }

      setSelectedFile(file)
    }
  }

  const copyToClipboard = async (text: string, accountNumber: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAccount(accountNumber)
      setTimeout(() => setCopiedAccount(null), 2000)
    } catch (error) {
      onError('Failed to copy to clipboard')
    }
  }

  const uploadReceipt = async () => {
    if (!selectedFile) {
      onError('Please select a receipt image to upload')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Create FormData
      const formData = new FormData()
      formData.append('receipt', selectedFile)
      formData.append('bookingId', bookingData.bookingId)
      formData.append('paymentReference', bookingData.reference)
      formData.append('amountPaid', bookingData.amount.toString())

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      // Upload receipt
      const response = await fetch('/api/payments/upload-receipt', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload receipt')
      }

      setTimeout(() => {
        onSuccess(bookingData.reference)
      }, 500)

    } catch (error) {
      console.error('Receipt upload error:', error)
      onError(error instanceof Error ? error.message : 'Failed to upload receipt')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-saharan-500 text-white p-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Bank Transfer Payment</h2>
              <p className="text-saharan-100">Complete your booking with a direct bank transfer</p>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Payment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">₦{bookingData.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference:</span>
                  <span className="font-mono font-semibold text-saharan-600">{bookingData.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span>{bookingData.customerName}</span>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-800">Processing Time</p>
                  <p className="text-sm text-blue-700">Your booking will be confirmed within 2-4 hours after receipt verification</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">Transfer to any of these accounts</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankDetails.accounts.map((account: BankAccount, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-saharan-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800">{account.bankName}</h4>
                  <CreditCard className="w-5 h-5 text-gray-400" />
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600">Account Name:</p>
                    <p className="font-semibold">{account.accountName}</p>
                  </div>

                  <div>
                    <p className="text-gray-600">Account Number:</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-semibold text-lg">{account.accountNumber}</p>
                      <button
                        onClick={() => copyToClipboard(account.accountNumber, account.accountNumber)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Copy account number"
                      >
                        {copiedAccount === account.accountNumber ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-600">Sort Code:</p>
                    <p className="font-mono">{account.sortCode}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">Payment Instructions</h3>
          <div className="space-y-3">
            {bankDetails.paymentInstructions.map((instruction: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-saharan-100 text-saharan-600 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                  {index + 1}
                </div>
                <p className="text-gray-700">{instruction}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Receipt Upload */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Upload Payment Receipt</h3>

          {!selectedFile ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-saharan-300 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Drag and drop your receipt image here, or</p>
              <label className="cursor-pointer">
                <span className="bg-saharan-500 text-white px-4 py-2 rounded-lg hover:bg-saharan-600 transition-colors">
                  Choose File
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: JPG, PNG, WebP (Max 5MB)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected File */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {!uploading && (
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-saharan-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={uploadReceipt}
                disabled={uploading}
                className="w-full bg-saharan-500 text-white py-3 rounded-lg font-semibold hover:bg-saharan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading Receipt...' : 'Upload Receipt & Complete Booking'}
              </button>
            </div>
          )}

          {/* Important Note */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">Important Note</p>
                <p className="text-sm text-amber-700 mt-1">
                  Please ensure the receipt clearly shows the transfer amount, date, and your account details.
                  Unclear or invalid receipts may delay verification process.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}