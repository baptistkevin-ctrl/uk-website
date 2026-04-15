import { NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'
import { estimateProductCarbon, formatCo2 } from '@/lib/carbon/carbon-data'

export const dynamic = 'force-dynamic'

// UK average grocery carbon footprint: ~1,000 kg CO2/year per person (WRAP/DEFRA)
const UK_AVG_YEARLY_CO2_KG = 1000;
const UK_AVG_MONTHLY_CO2_KG = UK_AVG_YEARLY_CO2_KG / 12;

interface MonthlyTotal {
  month: string;
  co2Kg: number;
  orderCount: number;
}

interface SavingSuggestion {
  tip: string;
  potentialSavingKg: number;
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Fetch orders from the last 12 months with their items
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        created_at,
        order_items (
          product_name,
          quantity
        )
      `)
      .eq('user_id', user.id)
      .gte('created_at', twelveMonthsAgo.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch order history' },
        { status: 500 }
      )
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        totalCo2Kg: 0,
        totalCo2Formatted: formatCo2(0),
        monthlyTotals: [],
        yearlyEstimate: 0,
        ukAverageYearly: UK_AVG_YEARLY_CO2_KG,
        percentVsAverage: 0,
        rating: "A" as const,
        suggestions: getDefaultSuggestions(),
        orderCount: 0,
      })
    }

    // Calculate carbon per order, grouped by month
    const monthlyMap = new Map<string, MonthlyTotal>()
    let totalCo2Kg = 0;
    let highImpactItems: { name: string; co2Kg: number }[] = [];

    for (const order of orders) {
      const orderDate = new Date(order.created_at)
      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`

      const items = order.order_items as Array<{
        product_name: string;
        quantity: number;
      }> | null

      let orderCo2 = 0;

      if (items) {
        for (const item of items) {
          const { co2Kg } = estimateProductCarbon({ name: item.product_name })
          const itemTotal = co2Kg * item.quantity
          orderCo2 += itemTotal

          if (co2Kg >= 5) {
            highImpactItems.push({ name: item.product_name, co2Kg: itemTotal })
          }
        }
      }

      totalCo2Kg += orderCo2

      const existing = monthlyMap.get(monthKey)
      if (existing) {
        existing.co2Kg += orderCo2
        existing.orderCount += 1
      } else {
        monthlyMap.set(monthKey, {
          month: monthKey,
          co2Kg: orderCo2,
          orderCount: 1,
        })
      }
    }

    // Round monthly totals
    const monthlyTotals: MonthlyTotal[] = Array.from(monthlyMap.values()).map((m) => ({
      ...m,
      co2Kg: Math.round(m.co2Kg * 100) / 100,
    }))

    totalCo2Kg = Math.round(totalCo2Kg * 100) / 100

    // Calculate yearly estimate based on available data
    const monthsWithData = monthlyTotals.length
    const avgMonthly = monthsWithData > 0 ? totalCo2Kg / monthsWithData : 0
    const yearlyEstimate = Math.round(avgMonthly * 12 * 100) / 100
    const percentVsAverage = UK_AVG_YEARLY_CO2_KG > 0
      ? Math.round(((yearlyEstimate - UK_AVG_YEARLY_CO2_KG) / UK_AVG_YEARLY_CO2_KG) * 100)
      : 0

    // Overall rating based on monthly average vs UK average
    const rating = getRatingVsAverage(avgMonthly)

    // Generate personalised suggestions
    const suggestions = generateSuggestions(highImpactItems, avgMonthly)

    return NextResponse.json({
      success: true,
      totalCo2Kg,
      totalCo2Formatted: formatCo2(totalCo2Kg),
      monthlyTotals,
      monthlyAverage: Math.round(avgMonthly * 100) / 100,
      monthlyAverageFormatted: formatCo2(avgMonthly),
      yearlyEstimate,
      yearlyEstimateFormatted: formatCo2(yearlyEstimate),
      ukAverageYearly: UK_AVG_YEARLY_CO2_KG,
      ukAverageMonthly: Math.round(UK_AVG_MONTHLY_CO2_KG * 100) / 100,
      percentVsAverage,
      rating,
      suggestions,
      orderCount: orders.length,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to calculate carbon impact' },
      { status: 500 }
    )
  }
}

function getRatingVsAverage(monthlyAvg: number): "A" | "B" | "C" | "D" | "E" {
  const ratio = monthlyAvg / UK_AVG_MONTHLY_CO2_KG
  if (ratio < 0.5) return "A"
  if (ratio < 0.8) return "B"
  if (ratio < 1.0) return "C"
  if (ratio < 1.3) return "D"
  return "E"
}

function generateSuggestions(
  highImpactItems: { name: string; co2Kg: number }[],
  monthlyAvg: number
): SavingSuggestion[] {
  const suggestions: SavingSuggestion[] = []

  // Deduplicate and sort high-impact items
  const uniqueHigh = highImpactItems
    .reduce((acc, item) => {
      const existing = acc.find((i) => i.name === item.name)
      if (existing) {
        existing.co2Kg += item.co2Kg
      } else {
        acc.push({ ...item })
      }
      return acc
    }, [] as { name: string; co2Kg: number }[])
    .sort((a, b) => b.co2Kg - a.co2Kg)

  // Suggest swaps for top high-impact items
  if (uniqueHigh.length > 0) {
    const topItem = uniqueHigh[0]
    const nameLC = topItem.name.toLowerCase()

    if (nameLC.includes("beef") || nameLC.includes("lamb")) {
      suggestions.push({
        tip: `Swap ${topItem.name} for chicken or plant-based alternatives to reduce your biggest carbon contributor`,
        potentialSavingKg: Math.round(topItem.co2Kg * 0.7 * 100) / 100,
      })
    } else if (nameLC.includes("cheese") || nameLC.includes("cheddar")) {
      suggestions.push({
        tip: `Try reducing cheese portions or switching to lower-impact varieties like mozzarella`,
        potentialSavingKg: Math.round(topItem.co2Kg * 0.3 * 100) / 100,
      })
    }
  }

  // General suggestions
  if (monthlyAvg > UK_AVG_MONTHLY_CO2_KG) {
    suggestions.push({
      tip: "Your grocery carbon footprint is above the UK average. Try one meat-free day per week",
      potentialSavingKg: Math.round(UK_AVG_MONTHLY_CO2_KG * 0.15 * 100) / 100,
    })
  }

  suggestions.push({
    tip: "Choose seasonal, UK-grown produce to reduce food miles and transport emissions",
    potentialSavingKg: 2.0,
  })

  suggestions.push({
    tip: "Select Click & Collect or cargo bike delivery to eliminate delivery emissions",
    potentialSavingKg: 1.35,
  })

  return suggestions.slice(0, 5)
}

function getDefaultSuggestions(): SavingSuggestion[] {
  return [
    {
      tip: "Start shopping to track your carbon footprint over time",
      potentialSavingKg: 0,
    },
    {
      tip: "Choose seasonal, UK-grown produce to reduce food miles",
      potentialSavingKg: 2.0,
    },
    {
      tip: "Try plant-based alternatives one day a week to lower your impact",
      potentialSavingKg: 12.5,
    },
  ]
}
