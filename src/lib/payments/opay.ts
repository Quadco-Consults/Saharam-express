// OPay Payment Integration for Saharan Express

interface OPayConfig {
  publicKey: string
  secretKey: string
  merchantId: string
  baseUrl: string
}

interface OPayInitializePayment {
  reference: string
  amount: string // in kobo as string
  currency: string
  userInfo: {
    userEmail: string
    userName: string
    userMobile: string
  }
  productInfo: {
    productName: string
    productDesc: string
  }
  callbackUrl?: string
  returnUrl?: string
}

interface OPayVerifyPayment {
  reference: string
  orderNo?: string
}

class OPayService {
  private config: OPayConfig

  constructor() {
    this.config = {
      publicKey: process.env.NEXT_PUBLIC_OPAY_PUBLIC_KEY || '',
      secretKey: process.env.OPAY_SECRET_KEY || '',
      merchantId: process.env.OPAY_MERCHANT_ID || '',
      baseUrl: 'https://api.opaycheckout.com'
    }

    if (!this.config.publicKey || !this.config.secretKey || !this.config.merchantId) {
      console.warn('OPay credentials not fully configured')
    }
  }

  // Generate HMAC signature for OPay
  private generateSignature(data: any, timestamp: string): string {
    // This would need the actual HMAC-SHA512 implementation
    // For production, use a proper crypto library
    const crypto = require('crypto')
    const message = JSON.stringify(data) + timestamp
    return crypto
      .createHmac('sha512', this.config.secretKey)
      .update(message)
      .digest('hex')
  }

  // Initialize payment (server-side)
  async initializePayment(data: OPayInitializePayment): Promise<any> {
    try {
      const timestamp = Date.now().toString()
      const requestData = {
        reference: data.reference,
        mchShortName: 'Saharan Express',
        productName: data.productInfo.productName,
        productDesc: data.productInfo.productDesc,
        userInfo: data.userInfo,
        amount: data.amount,
        currency: data.currency,
        osType: 'WEB',
        bankAccountNumber: '',
        callbackUrl: data.callbackUrl || '',
        returnUrl: data.returnUrl || ''
      }

      const signature = this.generateSignature(requestData, timestamp)

      const response = await fetch(`${this.config.baseUrl}/api/v3/cashier/initialize`, {
        method: 'POST',
        headers: {
          'MerchantId': this.config.merchantId,
          'Authorization': `Bearer ${this.config.publicKey}`,
          'Content-Type': 'application/json',
          'Timestamp': timestamp,
          'Signature': signature,
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'OPay payment initialization failed')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('OPay initialization error:', error)
      throw error
    }
  }

  // Verify payment (server-side)
  async verifyPayment(reference: string, orderNo?: string): Promise<any> {
    try {
      const timestamp = Date.now().toString()
      const requestData = {
        reference: reference,
        orderNo: orderNo || ''
      }

      const signature = this.generateSignature(requestData, timestamp)

      const response = await fetch(`${this.config.baseUrl}/api/v3/cashier/status`, {
        method: 'POST',
        headers: {
          'MerchantId': this.config.merchantId,
          'Authorization': `Bearer ${this.config.publicKey}`,
          'Content-Type': 'application/json',
          'Timestamp': timestamp,
          'Signature': signature,
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'OPay payment verification failed')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('OPay verification error:', error)
      throw error
    }
  }

  // Client-side payment popup (if OPay provides client SDK)
  async payWithOPay(data: OPayInitializePayment): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // Initialize payment first
        const initResult = await this.initializePayment(data)

        if (initResult.code === '00000' && initResult.data) {
          // Redirect to OPay checkout URL
          const checkoutUrl = initResult.data.cashierUrl
          window.open(checkoutUrl, '_blank')

          // In a real implementation, you'd handle the callback
          // For now, we'll return the reference
          resolve(data.reference)
        } else {
          reject(new Error(initResult.message || 'Payment initialization failed'))
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  // Generate payment reference
  generateReference(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `SEL_OPAY_${timestamp}_${random}`.toUpperCase()
  }

  // Format amount for OPay (in kobo as string)
  formatAmount(amount: number): string {
    return (amount * 100).toString()
  }
}

// Export singleton instance
export const oPayService = new OPayService()

// Client-side hook for OPay integration
export const useOPayScript = () => {
  const loadScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Not in browser environment'))
        return
      }

      // OPay doesn't have a standard client library like Paystack
      // They typically use redirect-based flow
      resolve()
    })
  }

  return { loadScript }
}