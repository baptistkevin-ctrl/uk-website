import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockSignOut = vi.fn()
const mockResetPasswordForEmail = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockUnsubscribe = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      resetPasswordForEmail: mockResetPasswordForEmail,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}))

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    mockGetUser.mockResolvedValue({ data: { user: null } })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('starts with loading true and user null', async () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.loading).toBe(true)
      expect(result.current.user).toBe(null)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('fetches user on mount', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.loading).toBe(false)
      })

      // May be called multiple times due to React Strict Mode
      expect(mockGetUser).toHaveBeenCalled()
    })

    it('subscribes to auth state changes', async () => {
      renderHook(() => useAuth())

      await waitFor(() => {
        expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1)
      })
    })

    it('unsubscribes on unmount', async () => {
      const { unmount } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(mockOnAuthStateChange).toHaveBeenCalled()
      })

      unmount()

      // May be called multiple times due to React Strict Mode
      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('Auth State Changes', () => {
    it('updates user when auth state changes', async () => {
      let authCallback: (event: string, session: any) => void = () => {}

      mockOnAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newUser = { id: 'user-456', email: 'new@example.com' }

      act(() => {
        authCallback('SIGNED_IN', { user: newUser })
      })

      expect(result.current.user).toEqual(newUser)
    })

    it('clears user on sign out event', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })

      let authCallback: (event: string, session: any) => void = () => {}

      mockOnAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      act(() => {
        authCallback('SIGNED_OUT', null)
      })

      expect(result.current.user).toBeNull()
    })
  })

  describe('signIn', () => {
    it('calls supabase signInWithPassword with credentials', async () => {
      const mockAuthData = {
        user: { id: 'user-123', email: 'test@example.com' },
        session: { access_token: 'token' }
      }
      mockSignInWithPassword.mockResolvedValue({ data: mockAuthData, error: null })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const data = await result.current.signIn('test@example.com', 'password123')

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(data).toEqual(mockAuthData)
    })

    it('throws error on failed sign in', async () => {
      const mockError = new Error('Invalid credentials')
      mockSignInWithPassword.mockResolvedValue({ data: null, error: mockError })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(result.current.signIn('test@example.com', 'wrong')).rejects.toThrow('Invalid credentials')
    })
  })

  describe('signUp', () => {
    it('calls supabase signUp with user data', async () => {
      const mockAuthData = {
        user: { id: 'new-user', email: 'new@example.com' },
        session: null
      }
      mockSignUp.mockResolvedValue({ data: mockAuthData, error: null })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const data = await result.current.signUp('new@example.com', 'password123', 'John Doe')

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'John Doe',
          },
        },
      })
      expect(data).toEqual(mockAuthData)
    })

    it('throws error on failed sign up', async () => {
      const mockError = new Error('Email already exists')
      mockSignUp.mockResolvedValue({ data: null, error: mockError })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(
        result.current.signUp('existing@example.com', 'password', 'Test User')
      ).rejects.toThrow('Email already exists')
    })
  })

  describe('signOut', () => {
    it('calls supabase signOut and redirects', async () => {
      mockSignOut.mockResolvedValue({ error: null })

      // Mock window.location
      const originalLocation = window.location
      delete (window as any).location
      window.location = { ...originalLocation, href: '' } as Location

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await result.current.signOut()

      expect(mockSignOut).toHaveBeenCalled()
      expect(window.location.href).toBe('/')

      // Restore window.location
      window.location = originalLocation
    })

    it('throws error on failed sign out', async () => {
      const mockError = new Error('Sign out failed')
      mockSignOut.mockResolvedValue({ error: mockError })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(result.current.signOut()).rejects.toThrow('Sign out failed')
    })
  })

  describe('resetPassword', () => {
    it('calls supabase resetPasswordForEmail', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null })

      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:3000' },
        writable: true
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await result.current.resetPassword('test@example.com')

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: 'http://localhost:3000/auth/reset-password',
      })
    })

    it('throws error on failed password reset', async () => {
      const mockError = new Error('User not found')
      mockResetPasswordForEmail.mockResolvedValue({ error: mockError })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(result.current.resetPassword('unknown@example.com')).rejects.toThrow('User not found')
    })
  })

  describe('Return Values', () => {
    it('returns all expected properties and methods', async () => {
      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current).toHaveProperty('user')
      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('signIn')
      expect(result.current).toHaveProperty('signUp')
      expect(result.current).toHaveProperty('signOut')
      expect(result.current).toHaveProperty('resetPassword')

      expect(typeof result.current.signIn).toBe('function')
      expect(typeof result.current.signUp).toBe('function')
      expect(typeof result.current.signOut).toBe('function')
      expect(typeof result.current.resetPassword).toBe('function')
    })
  })
})
