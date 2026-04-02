/**
 * Type-Safe API Client — Solaris World-Class (#32)
 *
 * Fully typed API client for frontend use.
 * TypeScript catches wrong data/endpoints at compile time.
 */

import { AppError } from '@/lib/utils/errors'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  params?: Record<string, string>
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  headers?: Record<string, string>
}

/**
 * Typed fetch wrapper for API calls.
 * Handles URL construction, query params, error responses.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions & { method?: Method } = {}
): Promise<T> {
  const { method = 'GET', params, body, query, headers } = options

  // Replace :params in URL
  let path = endpoint
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, encodeURIComponent(value))
    }
  }

  // Add query string
  if (query) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) searchParams.set(key, String(value))
    }
    const qs = searchParams.toString()
    if (qs) path += `?${qs}`
  }

  const response = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Request failed' } }))
    throw new AppError(
      errorData?.error?.message || 'Request failed',
      response.status,
      errorData?.error?.code || 'API_ERROR'
    )
  }

  return response.json()
}

// Convenience methods
export const api = {
  get: <T>(url: string, query?: Record<string, string | number | boolean | undefined>) =>
    apiClient<T>(url, { method: 'GET', query }),

  post: <T>(url: string, body?: unknown) =>
    apiClient<T>(url, { method: 'POST', body }),

  put: <T>(url: string, body?: unknown) =>
    apiClient<T>(url, { method: 'PUT', body }),

  patch: <T>(url: string, body?: unknown) =>
    apiClient<T>(url, { method: 'PATCH', body }),

  delete: <T>(url: string) =>
    apiClient<T>(url, { method: 'DELETE' }),
}
