// Paystack Payment Integration for Saharam Express

interface PaystackConfig {
  publicKey: string
  secretKey: string
  baseUrl: string
}

interface PaystackInitializePayment {
  email: string
  amount: number // in kobo
  reference: string
  currency?: string
  metadata?: any
  callback_url?: string
}

interface PaystackVerifyPayment {
  reference: string
}

class PaystackService {
  private config: PaystackConfig

  constructor() {
    this.config = {
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
      secretKey: process.env.PAYSTACK_SECRET_KEY || '',
      baseUrl: 'https://api.paystack.co'
    }

    if (!this.config.publicKey || !this.config.secretKey) {
      console.warn('Paystack keys not configured')
    }
  }

  // Initialize payment (server-side)
  async initializePayment(data: PaystackInitializePayment): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          currency: data.currency || 'NGN',
          channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Payment initialization failed')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Paystack initialization error:', error)
      throw error
    }
  }

  // Verify payment (server-side)
  async verifyPayment(reference: string): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Payment verification failed')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Paystack verification error:', error)
      throw error
    }
  }

  // Get transaction details
  async getTransaction(transactionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/transaction/${transactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to get transaction')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Paystack transaction fetch error:', error)
      throw error
    }
  }

  // Client-side payment popup
  async payWithPaystack(data: PaystackInitializePayment): Promise<string> {
    return new Promise((resolve, reject) => {
      // Check if Paystack is loaded
      if (typeof window === 'undefined' || !(window as any).PaystackPop) {
        reject(new Error('Paystack library not loaded'))
        return
      }

      const handler = (window as any).PaystackPop.setup({
        key: this.config.publicKey,
        email: data.email,
        amount: data.amount,
        currency: data.currency || 'NGN',
        reference: data.reference,
        metadata: data.metadata,
        callback: function(response: any) {
          resolve(response.reference)
        },
        onClose: function() {
          reject(new Error('Payment cancelled'))
        }
      })

      handler.openIframe()
    })
  }

  // Generate payment reference
  generateReference(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `SEL_${timestamp}_${random}`.toUpperCase()
  }
}

// Export singleton instance
export const paystackService = new PaystackService()

// Client-side hook for loading Paystack script
export const usePaystackScript = () => {
  const loadScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Not in browser environment'))
        return
      }

      // Check if already loaded
      if ((window as any).PaystackPop) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.async = true

      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Paystack script'))

      document.head.appendChild(script)
    })
  }

  return { loadScript }
}