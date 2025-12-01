'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Award, Star, Gift, TrendingUp, Calendar, ArrowRight, Trophy, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface LoyaltyTransaction {
  id: string
  transaction_type: 'earned' | 'redeemed' | 'expired' | 'bonus'
  points: number
  description: string
  created_at: string
}

interface TierBenefits {
  discount: number
  pointsMultiplier: number
  prioritySupport: boolean
}

interface LoyaltyData {
  loyalty_points: number
  loyalty_tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  tier_benefits: TierBenefits
  next_tier: string | null
  points_to_next_tier: number | null
  transactions: LoyaltyTransaction[]
  tier_thresholds: Record<string, number>
}

export default function LoyaltyPage() {
  const router = useRouter()
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false)
  const [redeemPoints, setRedeemPoints] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    checkUserAndLoadData()
  }, [])

  const checkUserAndLoadData = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      await loadLoyaltyData()
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred')
    }
  }

  const loadLoyaltyData = async () => {
    try {
      const response = await fetch('/api/loyalty')
      const result = await response.json()

      if (result.success) {
        setLoyaltyData(result.data)
      } else {
        toast.error(result.error || 'Failed to load loyalty data')
      }
    } catch (error) {
      console.error('Error loading loyalty data:', error)
      toast.error('Failed to load loyalty data')
    } finally {
      setLoading(false)
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return <Crown className="w-6 h-6 text-purple-600" />
      case 'gold':
        return <Trophy className="w-6 h-6 text-yellow-600" />
      case 'silver':
        return <Award className="w-6 h-6 text-gray-600" />
      default:
        return <Star className="w-6 h-6 text-orange-600" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'from-purple-500 to-purple-700'
      case 'gold':
        return 'from-yellow-500 to-yellow-700'
      case 'silver':
        return 'from-gray-500 to-gray-700'
      default:
        return 'from-orange-500 to-orange-700'
    }
  }

  const handleRedeem = async () => {
    if (!redeemPoints || isNaN(Number(redeemPoints)) || Number(redeemPoints) <= 0) {
      toast.error('Please enter a valid number of points')
      return
    }

    if (loyaltyData && Number(redeemPoints) > loyaltyData.loyalty_points) {
      toast.error('Insufficient points')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/loyalty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'redeem',
          points: Number(redeemPoints),
          description: `Redeemed ${redeemPoints} points for discount`
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.data.message)
        await loadLoyaltyData()
        setIsRedeemModalOpen(false)
        setRedeemPoints('')
      } else {
        toast.error(result.error || 'Failed to redeem points')
      }
    } catch (error) {
      console.error('Error redeeming points:', error)
      toast.error('Failed to redeem points')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'redeemed':
        return <Gift className="w-4 h-4 text-red-600" />
      case 'bonus':
        return <Award className="w-4 h-4 text-blue-600" />
      default:
        return <Calendar className="w-4 h-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saharam-500"></div>
      </div>
    )
  }

  if (!loyaltyData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to load loyalty data</h1>
          <p className="text-gray-600 mb-4">Please try refreshing the page</p>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-saharam-100 rounded-full flex items-center justify-center">
              <Award className="w-6 h-6 text-saharam-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Loyalty Rewards</h1>
              <p className="text-gray-600">Track your points and unlock exclusive benefits</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tier Status Card */}
            <Card className="overflow-hidden">
              <div className={`bg-gradient-to-r ${getTierColor(loyaltyData.loyalty_tier)} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {getTierIcon(loyaltyData.loyalty_tier)}
                      <h2 className="text-2xl font-bold capitalize">{loyaltyData.loyalty_tier} Member</h2>
                    </div>
                    <p className="text-lg opacity-90">{loyaltyData.loyalty_points.toLocaleString()} Points</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-75">Member Since</p>
                    <p className="font-semibold">2024</p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                {loyaltyData.next_tier && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress to {loyaltyData.next_tier}</span>
                      <span className="text-sm text-gray-500">
                        {loyaltyData.points_to_next_tier} points needed
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-saharam-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            loyaltyData.points_to_next_tier
                              ? Math.max(
                                  0,
                                  Math.min(
                                    100,
                                    ((loyaltyData.loyalty_points %
                                      (loyaltyData.tier_thresholds[loyaltyData.next_tier] || 0)) /
                                      (loyaltyData.tier_thresholds[loyaltyData.next_tier] || 1)) * 100
                                  )
                                )
                              : 100
                          }%`
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Discount</p>
                    <p className="text-lg font-bold text-saharam-600">{loyaltyData.tier_benefits.discount}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Points Multiplier</p>
                    <p className="text-lg font-bold text-saharam-600">{loyaltyData.tier_benefits.pointsMultiplier}x</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Priority Support</p>
                    <p className="text-lg font-bold text-saharam-600">
                      {loyaltyData.tier_benefits.prioritySupport ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {loyaltyData.transactions.length > 0 ? (
                  <div className="space-y-4">
                    {loyaltyData.transactions.slice(0, 10).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.transaction_type)}
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-sm text-gray-600">{formatDate(transaction.created_at)}</p>
                          </div>
                        </div>
                        <span className={`font-bold ${
                          transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No transactions yet</p>
                    <p className="text-sm text-gray-500">Start booking trips to earn points!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => setIsRedeemModalOpen(true)}
                  className="w-full justify-between"
                  variant="outline"
                >
                  <span className="flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    Redeem Points
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Button
                  onClick={() => router.push('/')}
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Book New Trip
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Button
                  onClick={() => router.push('/bookings')}
                  className="w-full justify-between"
                  variant="outline"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    View Bookings
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            {/* How to Earn Points */}
            <Card>
              <CardHeader>
                <CardTitle>How to Earn Points</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Book Trips</p>
                    <p className="text-sm text-gray-600">1 point per ₦100 spent</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Award className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Special Bonuses</p>
                    <p className="text-sm text-gray-600">Seasonal promotions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tier Benefits */}
            <Card>
              <CardHeader>
                <CardTitle>Tier Benefits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(loyaltyData.tier_thresholds).map(([tier, threshold]) => (
                  <div key={tier} className={`p-3 rounded-lg border ${
                    tier === loyaltyData.loyalty_tier ? 'border-saharam-500 bg-saharam-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {getTierIcon(tier)}
                      <span className="font-medium capitalize">{tier}</span>
                      {tier === loyaltyData.loyalty_tier && (
                        <span className="text-xs bg-saharam-500 text-white px-2 py-1 rounded-full">Current</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{threshold.toLocaleString()} points required</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Redeem Points Modal */}
      <Dialog open={isRedeemModalOpen} onOpenChange={setIsRedeemModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Loyalty Points</DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Available Points</p>
              <p className="text-2xl font-bold text-gray-900">{loyaltyData.loyalty_points.toLocaleString()}</p>
            </div>

            <div>
              <Label htmlFor="redeem_points">Points to Redeem</Label>
              <Input
                id="redeem_points"
                type="number"
                min="1"
                max={loyaltyData.loyalty_points}
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.value)}
                placeholder="Enter points to redeem"
              />
              <p className="text-xs text-gray-600 mt-1">
                Redemption value: ₦{redeemPoints ? (Number(redeemPoints) * 0.5).toLocaleString() : '0'} discount
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Redeemed points will be converted to a discount code that can be used on your next booking.
                Exchange rate: 2 points = ₦1 discount.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRedeemModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleRedeem} disabled={submitting || !redeemPoints}>
              {submitting ? 'Processing...' : 'Redeem Points'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}