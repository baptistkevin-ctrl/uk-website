import { getSupabaseAdmin } from "@/lib/supabase/server"
import { getTenant } from "./tenant-context"

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function createTenantScopedRepository<T extends Record<string, unknown>>(
  tableName: string,
  tenantColumn = "vendor_id"
) {
  return {
    async findById(id: string): Promise<T | null> {
      const tenant = getTenant()
      const { data, error } = await getSupabaseAdmin()
        .from(tableName)
        .select("*")
        .eq("id", id)
        .eq(tenantColumn, tenant.tenantId)
        .is("deleted_at", null)
        .single()

      if (error && error.code !== "PGRST116") throw error
      return data as T | null
    },

    async findMany(params: {
      page: number
      limit: number
    }): Promise<PaginatedResponse<T>> {
      const tenant = getTenant()
      const offset = (params.page - 1) * params.limit

      const { data, error, count } = await getSupabaseAdmin()
        .from(tableName)
        .select("*", { count: "exact" })
        .eq(tenantColumn, tenant.tenantId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(offset, offset + params.limit - 1)

      if (error) throw error

      return {
        data: (data || []) as T[],
        meta: {
          page: params.page,
          limit: params.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / params.limit),
        },
      }
    },

    async create(
      record: Omit<T, "id" | "created_at" | "updated_at">
    ): Promise<T> {
      const tenant = getTenant()
      const { data, error } = await getSupabaseAdmin()
        .from(tableName)
        .insert({ ...record, [tenantColumn]: tenant.tenantId })
        .select()
        .single()

      if (error) throw error
      return data as T
    },

    async update(id: string, updates: Partial<T>): Promise<T> {
      const tenant = getTenant()
      const { data, error } = await getSupabaseAdmin()
        .from(tableName)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq(tenantColumn, tenant.tenantId)
        .select()
        .single()

      if (error) throw error
      return data as T
    },

    async softDelete(id: string): Promise<void> {
      const tenant = getTenant()
      const { error } = await getSupabaseAdmin()
        .from(tableName)
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .eq(tenantColumn, tenant.tenantId)

      if (error) throw error
    },
  }
}

export type { PaginatedResponse }
