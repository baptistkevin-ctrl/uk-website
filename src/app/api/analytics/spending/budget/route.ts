import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { monthlyBudget } = body

    if (typeof monthlyBudget !== 'number' || monthlyBudget < 0) {
      return NextResponse.json(
        { error: 'monthlyBudget must be a non-negative number (in pence)' },
        { status: 400 }
      )
    }

    // Cap at a reasonable maximum (100,000 GBP = 10,000,000 pence)
    if (monthlyBudget > 10_000_000) {
      return NextResponse.json(
        { error: 'Budget exceeds maximum allowed value' },
        { status: 400 }
      )
    }

    const budgetPence = Math.round(monthlyBudget)
    const admin = getSupabaseAdmin()

    // Try updating the profiles table with monthly_budget_pence
    const { error: updateError } = await admin
      .from('profiles')
      .update({ monthly_budget_pence: budgetPence > 0 ? budgetPence : null })
      .eq('id', user.id)

    if (updateError) {
      // If the column doesn't exist, return a graceful message
      if (updateError.message?.includes('column') || updateError.code === '42703') {
        return NextResponse.json(
          {
            error: 'Budget feature not yet configured. The monthly_budget_pence column needs to be added to the profiles table.',
            details: 'Run: ALTER TABLE profiles ADD COLUMN monthly_budget_pence INTEGER DEFAULT NULL;',
          },
          { status: 501 }
        )
      }

      console.error('Budget update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to save budget' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      monthlyBudget: budgetPence > 0 ? budgetPence : null,
      message: budgetPence > 0
        ? `Monthly budget set to ${(budgetPence / 100).toFixed(2)} GBP`
        : 'Monthly budget cleared',
    })
  } catch (error) {
    console.error('Budget API error:', error)
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    )
  }
}
