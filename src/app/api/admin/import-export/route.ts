import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Get import/export jobs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // import, export
    const status = searchParams.get('status')
    const entity = searchParams.get('entity')

    // Build query
    let query = supabase
      .from('import_export_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (type && type !== 'all') {
      query = query.eq('job_type', type)
    }
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (entity && entity !== 'all') {
      query = query.eq('entity_type', entity)
    }

    const { data: jobs, error } = await query

    if (error) {
      console.error('Error fetching jobs:', error)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('Get jobs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create export job
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { job_type, entity_type, file_format = 'csv', filters = {} } = body

    if (!job_type || !entity_type) {
      return NextResponse.json({ error: 'job_type and entity_type are required' }, { status: 400 })
    }

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('import_export_jobs')
      .insert({
        job_type,
        entity_type,
        file_format,
        status: 'processing',
        started_at: new Date().toISOString(),
        created_by: user.id
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating job:', jobError)
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
    }

    // For exports, fetch data immediately (for simplicity)
    if (job_type === 'export') {
      try {
        let data: Record<string, unknown>[] = []
        let total = 0

        // Fetch data based on entity type
        switch (entity_type) {
          case 'products': {
            const { data: products, count } = await supabase
              .from('products')
              .select('id, name, slug, sku, price_pence, compare_at_price_pence, stock_quantity, is_active, brand, created_at', { count: 'exact' })
            data = products || []
            total = count || 0
            break
          }
          case 'orders': {
            const { data: orders, count } = await supabase
              .from('orders')
              .select('id, order_number, status, total_pence, customer_name, customer_email, created_at', { count: 'exact' })
            data = orders || []
            total = count || 0
            break
          }
          case 'customers': {
            const { data: customers, count } = await supabase
              .from('profiles')
              .select('id, email, full_name, phone, created_at', { count: 'exact' })
              .eq('role', 'customer')
            data = customers || []
            total = count || 0
            break
          }
          case 'categories': {
            const { data: categories, count } = await supabase
              .from('categories')
              .select('id, name, slug, description, is_active, sort_order, created_at', { count: 'exact' })
            data = categories || []
            total = count || 0
            break
          }
          default:
            throw new Error('Invalid entity type')
        }

        // Generate CSV content
        let csvContent = ''
        if (data.length > 0) {
          const headers = Object.keys(data[0])
          csvContent = headers.join(',') + '\n'
          csvContent += data.map(row =>
            headers.map(h => {
              const val = row[h]
              if (val === null || val === undefined) return ''
              const str = String(val)
              return str.includes(',') || str.includes('"') || str.includes('\n')
                ? `"${str.replace(/"/g, '""')}"`
                : str
            }).join(',')
          ).join('\n')
        }

        // Update job as completed
        await supabase
          .from('import_export_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            total_rows: total,
            processed_rows: total,
            success_count: total,
            result_summary: { message: `Exported ${total} ${entity_type}` }
          })
          .eq('id', job.id)

        // Return the CSV data
        return NextResponse.json({
          job,
          data: csvContent,
          filename: `${entity_type}-export-${new Date().toISOString().split('T')[0]}.csv`
        })
      } catch (exportError) {
        // Update job as failed
        await supabase
          .from('import_export_jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            errors: [{ message: String(exportError) }]
          })
          .eq('id', job.id)

        return NextResponse.json({ error: 'Export failed', job }, { status: 500 })
      }
    }

    return NextResponse.json({ job })
  } catch (error) {
    console.error('Create job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
