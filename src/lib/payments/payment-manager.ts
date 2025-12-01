import { paystackService } from './paystack'
import { oPayService } from './opay'
import { prisma } from '@/lib/prisma'

export type PaymentProvider = 'paystack' | 'opay'

export interface PaymentInitializeData {
  bookingId: string
  amount: number
  customerEmail: string
  customerName: string
  customerPhone: string
  provider: PaymentProvider
  metadata?: Record<string, any>
}

export interface PaymentResult {
  success: boolean
  provider: PaymentProvider
  reference: string
  authorizationUrl?: string
  message?: string
  error?: string
}

export interface PaymentVerificationResult {
  success: boolean
  provider: PaymentProvider
  reference: string
  status: string
  amount: number
  paidAt?: Date
  gatewayResponse?: string
  error?: string
}

export class PaymentManager {
  /**
   * Initialize a payment with the specified provider
   */
  async initializePayment(data: PaymentInitializeData): Promise<PaymentResult> {
    try {
      const reference = this.generateReference(data.provider)

      // Store payment attempt in database
      await prisma.booking.update({
        where: { id: data.bookingId },
        data: {
          paymentReference: reference,
          paymentMethod: data.provider.toUpperCase()
        }
      })

      if (data.provider === 'paystack') {
        return await this.initializePaystackPayment(data, reference)
      } else if (data.provider === 'opay') {
        return await this.initializeOpayPayment(data, reference)
      } else {
        throw new Error(`Unsupported payment provider: ${data.provider}`)
      }
    } catch (error) {
      console.error('Payment initialization error:', error)
      return {
        success: false,
        provider: data.provider,
        reference: '',
        error: error instanceof Error ? error.message : 'Payment initialization failed'
      }
    }
  }

  /**
   * Verify a payment with the specified provider
   */
  async verifyPayment(reference: string, provider: PaymentProvider): Promise<PaymentVerificationResult> {
    try {
      if (provider === 'paystack') {
        return await this.verifyPaystackPayment(reference)
      } else if (provider === 'opay') {
        return await this.verifyOpayPayment(reference)
      } else {
        throw new Error(`Unsupported payment provider: ${provider}`)
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      return {
        success: false,
        provider,
        reference,
        status: 'failed',
        amount: 0,
        error: error instanceof Error ? error.message : 'Payment verification failed'
      }
    }
  }

  /**
   * Update booking payment status after verification
   */
  async updateBookingPaymentStatus(
    reference: string,
    verificationResult: PaymentVerificationResult
  ): Promise<void> {
    try {
      const booking = await prisma.booking.findFirst({
        where: { paymentReference: reference }
      })

      if (!booking) {
        throw new Error('Booking not found for payment reference')
      }

      if (verificationResult.success && verificationResult.status === 'success') {
        // Payment successful
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: 'COMPLETED',
            status: 'CONFIRMED',
            updatedAt: new Date()
          }
        })

        // Award loyalty points if user is registered
        if (booking.userId) {
          const pointsToEarn = Math.floor(verificationResult.amount * 0.01) // 1% of amount as points

          await prisma.user.update({
            where: { id: booking.userId },
            data: {
              loyaltyPoints: {
                increment: pointsToEarn
              }
            }
          })

          await prisma.loyaltyTransaction.create({
            data: {
              userId: booking.userId,
              bookingId: booking.id,
              pointsChange: pointsToEarn,
              transactionType: 'earned',
              description: `Points earned from booking ${booking.bookingReference}`
            }
          })

          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              loyaltyPointsEarned: pointsToEarn
            }
          })
        }
      } else {
        // Payment failed
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: 'FAILED',
            status: 'CANCELLED',
            updatedAt: new Date()
          }
        })
      }
    } catch (error) {
      console.error('Error updating booking payment status:', error)
      throw error
    }
  }

  /**
   * Initialize Paystack payment
   */
  private async initializePaystackPayment(
    data: PaymentInitializeData,
    reference: string
  ): Promise<PaymentResult> {
    try {
      const result = await paystackService.initializePayment({
        email: data.customerEmail,
        amount: paystackService.toKobo(data.amount),
        reference,
        metadata: {
          bookingId: data.bookingId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          ...data.metadata
        },
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/booking/payment/callback?provider=paystack`
      })

      return {
        success: true,
        provider: 'paystack',
        reference,
        authorizationUrl: result.data.authorization_url,
        message: 'Payment initialized successfully'
      }
    } catch (error) {
      throw new Error(`Paystack initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Initialize OPay payment
   */
  private async initializeOpayPayment(
    data: PaymentInitializeData,
    reference: string
  ): Promise<PaymentResult> {
    try {
      const result = await oPayService.initializePayment({
        reference,
        amount: oPayService.formatAmount(data.amount),
        currency: 'NGN',
        userInfo: {
          userEmail: data.customerEmail,
          userName: data.customerName,
          userMobile: data.customerPhone
        },
        productInfo: {
          productName: 'Bus Ticket - Saharan Express',
          productDesc: `Booking ${data.bookingId}`
        },
        callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/webhook/opay`,
        returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/booking/payment/success?provider=opay`
      })

      return {
        success: true,
        provider: 'opay',
        reference,
        authorizationUrl: result.data?.cashierUrl,
        message: 'Payment initialized successfully'
      }
    } catch (error) {
      throw new Error(`OPay initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Verify Paystack payment
   */
  private async verifyPaystackPayment(reference: string): Promise<PaymentVerificationResult> {
    try {
      const result = await paystackService.verifyPayment(reference)

      return {
        success: result.data.status === 'success',
        provider: 'paystack',
        reference,
        status: result.data.status,
        amount: paystackService.fromKobo(result.data.amount),
        paidAt: result.data.paid_at ? new Date(result.data.paid_at) : undefined,
        gatewayResponse: result.data.gateway_response
      }
    } catch (error) {
      throw new Error(`Paystack verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Verify OPay payment
   */
  private async verifyOpayPayment(reference: string): Promise<PaymentVerificationResult> {
    try {
      const result = await oPayService.verifyPayment(reference)

      return {
        success: result.data?.status === 'SUCCESS',
        provider: 'opay',
        reference,
        status: result.data?.status?.toLowerCase() || 'unknown',
        amount: result.data?.amount ? parseFloat(result.data.amount) : 0
      }
    } catch (error) {
      throw new Error(`OPay verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate a unique payment reference
   */
  private generateReference(provider: PaymentProvider): string {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    const providerPrefix = provider === 'paystack' ? 'PST' : 'OPY'
    return `SAH_${providerPrefix}_${timestamp}_${random}`
  }

  /**
   * Get available payment providers for Nigeria
   */
  getAvailableProviders(): Array<{ code: PaymentProvider; name: string; description: string }> {
    return [
      {
        code: 'paystack',
        name: 'Paystack',
        description: 'Pay with card, bank transfer, or USSD'
      },
      {
        code: 'opay',
        name: 'OPay',
        description: 'Pay with OPay wallet or bank transfer'
      }
    ]
  }
}

// Export singleton instance
export const paymentManager = new PaymentManager()