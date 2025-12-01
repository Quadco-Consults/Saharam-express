import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get current user
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's loyalty information
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('loyalty_points, loyalty_tier')
      .eq('id', session.user.id)
      .single()

    if (userError) {
      console.error('Error fetching user loyalty data:', userError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch loyalty data' },
        { status: 500 }
      )
    }

    // Get loyalty transactions for this user
    const { data: transactions, error: transactionsError } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (transactionsError) {
      console.error('Error fetching loyalty transactions:', transactionsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch loyalty transactions' },
        { status: 500 }
      )
    }

    // Calculate tier benefits
    const tierBenefits = {
      bronze: { discount: 0, pointsMultiplier: 1, prioritySupport: false },
      silver: { discount: 5, pointsMultiplier: 1.2, prioritySupport: false },
      gold: { discount: 10, pointsMultiplier: 1.5, prioritySupport: true },
      platinum: { discount: 15, pointsMultiplier: 2, prioritySupport: true }
    }

    // Calculate points needed for next tier
    const tierThresholds = {
      bronze: 0,
      silver: 2000,
      gold: 5000,
      platinum: 10000
    }

    const currentPoints = user?.loyalty_points || 0
    const currentTier = user?.loyalty_tier || 'bronze'

    let nextTier = null
    let pointsToNextTier = null

    if (currentTier === 'bronze') {
      nextTier = 'silver'
      pointsToNextTier = tierThresholds.silver - currentPoints
    } else if (currentTier === 'silver') {
      nextTier = 'gold'
      pointsToNextTier = tierThresholds.gold - currentPoints
    } else if (currentTier === 'gold') {
      nextTier = 'platinum'
      pointsToNextTier = tierThresholds.platinum - currentPoints
    }

    return NextResponse.json({
      success: true,
      data: {
        loyalty_points: currentPoints,
        loyalty_tier: currentTier,
        tier_benefits: tierBenefits[currentTier as keyof typeof tierBenefits],
        next_tier: nextTier,
        points_to_next_tier: pointsToNextTier,
        transactions: transactions || [],
        tier_thresholds: tierThresholds
      }
    })

  } catch (error) {
    console.error('Loyalty data fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get current user
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, points, description } = body

    // Only support redeeming points for now
    if (action !== 'redeem') {
      return NextResponse.json(
        { success: false, error: 'Only point redemption is currently supported' },
        { status: 400 }
      )
    }

    if (!points || points <= 0) {
      return NextResponse.json(
        { success: false, error: 'Points must be a positive number' },
        { status: 400 }
      )
    }

    // Get current user points
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('loyalty_points')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user data' },
        { status: 500 }
      )
    }

    if (user.loyalty_points < points) {
      return NextResponse.json(
        { success: false, error: 'Insufficient loyalty points' },
        { status: 400 }
      )
    }

    // Create redemption transaction
    const { error: transactionError } = await supabase
      .from('loyalty_transactions')
      .insert({
        user_id: session.user.id,
        transaction_type: 'redeemed',
        points: -points, // negative for redemption
        description: description || `Redeemed ${points} points`
      })

    if (transactionError) {
      console.error('Error creating loyalty transaction:', transactionError)
      return NextResponse.json(
        { success: false, error: 'Failed to process redemption' },
        { status: 500 }
      )
    }

    // Update user points
    const { error: updateError } = await supabase
      .from('users')
      .update({
        loyalty_points: user.loyalty_points - points
      })
      .eq('id', session.user.id)

    if (updateError) {
      console.error('Error updating user points:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update points balance' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Successfully redeemed ${points} points`,
        remaining_points: user.loyalty_points - points
      }
    })

  } catch (error) {
    console.error('Loyalty redemption error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}