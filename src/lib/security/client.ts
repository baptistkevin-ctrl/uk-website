/**
 * Client-side security utilities
 * Use these in React components and client-side API calls
 */

const CSRF_TOKEN_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Get CSRF token from cookies (client-side)
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === CSRF_TOKEN_NAME) {
      return value
    }
  }
  return null
}

/**
 * Create headers object with CSRF token included
 * Use this for all POST/PUT/DELETE API requests
 */
export function getSecureHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
  const csrfToken = getCsrfToken()

  return {
    'Content-Type': 'application/json',
    ...(csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}),
    ...additionalHeaders
  }
}

/**
 * Secure fetch wrapper that automatically includes CSRF token
 * and handles common security concerns
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET'
  const isUnsafeMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)

  // Add CSRF token for unsafe methods
  if (isUnsafeMethod) {
    const csrfToken = getCsrfToken()
    const headers = new Headers(options.headers)

    if (csrfToken) {
      headers.set(CSRF_HEADER_NAME, csrfToken)
    }

    // Set default content type if not set
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json')
    }

    options.headers = headers
  }

  // Include credentials for cookie-based auth
  options.credentials = options.credentials || 'same-origin'

  return fetch(url, options)
}

/**
 * Secure JSON fetch that parses response and handles errors
 */
export async function secureJsonFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  try {
    const response = await secureFetch(url, options)
    const status = response.status

    if (!response.ok) {
      // Handle rate limiting
      if (status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        return {
          error: `Rate limited. Please wait ${retryAfter || 'a moment'} before retrying.`,
          status
        }
      }

      // Handle CSRF errors
      if (status === 403) {
        const data = await response.json().catch(() => ({}))
        if (data.error?.includes('CSRF')) {
          // Token might be stale, suggest refresh
          return {
            error: 'Session expired. Please refresh the page.',
            status
          }
        }
        return { error: data.error || 'Access denied', status }
      }

      // Handle other errors
      const data = await response.json().catch(() => ({}))
      return { error: data.error || 'Request failed', status }
    }

    const data = await response.json()
    return { data, status }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0
    }
  }
}

/**
 * React hook for making secure API requests
 * Usage in React components:
 *
 * import { useSecureFetch } from '@/lib/security/client'
 *
 * function MyComponent() {
 *   const { fetch: secureFetch, loading, error } = useSecureFetch()
 *
 *   const handleSubmit = async () => {
 *     const result = await secureFetch('/api/data', {
 *       method: 'POST',
 *       body: JSON.stringify({ name: 'test' })
 *     })
 *   }
 * }
 */
export function createApiClient() {
  return {
    get: <T>(url: string) => secureJsonFetch<T>(url, { method: 'GET' }),

    post: <T>(url: string, body: unknown) => secureJsonFetch<T>(url, {
      method: 'POST',
      body: JSON.stringify(body)
    }),

    put: <T>(url: string, body: unknown) => secureJsonFetch<T>(url, {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

    patch: <T>(url: string, body: unknown) => secureJsonFetch<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(body)
    }),

    delete: <T>(url: string) => secureJsonFetch<T>(url, { method: 'DELETE' })
  }
}

// Export a default API client instance
export const api = createApiClient()
