/**
 * Optimistic Locking — Solaris World-Class (#31)
 *
 * Prevent lost updates when two users edit the same record.
 * Uses a version column to detect concurrent modifications.
 *
 * Usage: Add `version INTEGER NOT NULL DEFAULT 1` to editable tables.
 * Frontend sends the version it loaded with every update request.
 */

import { ok, fail } from './result'
import type { Result } from './result'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export async function updateWithLock<T>(
  table: string,
  id: string,
  data: Record<string, unknown>,
  expectedVersion: number
): Promise<Result<T>> {
  const supabase = getSupabaseAdmin()

  const { data: record, error } = await supabase
    .from(table)
    .update({
      ...data,
      version: expectedVersion + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('version', expectedVersion)
    .select()
    .single()

  if (error || !record) {
    return fail(
      'This record was modified by another user. Please refresh and try again.',
      'CONFLICT'
    )
  }

  return ok(record as T)
}
