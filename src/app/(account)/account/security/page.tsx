'use client'

import { useState } from 'react'
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  CheckCircle,
  Loader2,
  AlertTriangle,
  LogOut,
  Key
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function SecurityPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const validatePassword = (pass: string) => {
    const requirements = [
      { test: pass.length >= 8, message: 'At least 8 characters' },
      { test: /[A-Z]/.test(pass), message: 'One uppercase letter' },
      { test: /[a-z]/.test(pass), message: 'One lowercase letter' },
      { test: /[0-9]/.test(pass), message: 'One number' },
      { test: /[^A-Za-z0-9]/.test(pass), message: 'One special character' },
    ]
    return requirements
  }

  const passwordRequirements = validatePassword(passwordForm.newPassword)
  const isPasswordValid = passwordRequirements.every((req) => req.test)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    if (!isPasswordValid) {
      setPasswordError('Password does not meet requirements')
      return
    }

    setIsChangingPassword(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      })

      if (error) {
        setPasswordError(error.message)
        toast.error(error.message)
      } else {
        setPasswordSuccess(true)
        toast.success('Password changed successfully')
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        setTimeout(() => setPasswordSuccess(false), 5000)
      }
    } catch (err) {
      setPasswordError('An unexpected error occurred')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSignOutAllDevices = async () => {
    if (confirm('Are you sure you want to sign out of all devices? You will need to log in again.')) {
      const supabase = createClient()
      await supabase.auth.signOut({ scope: 'global' })
      window.location.href = '/login'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-(--brand-primary)" />
          Security Settings
        </h1>
        <p className="text-(--color-text-muted) mt-1">Manage your account security and password</p>
      </div>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-(--color-text-secondary)" />
            <h2 className="text-lg font-semibold">Change Password</h2>
          </div>
        </CardHeader>
        <CardContent>
          {/* Success Message */}
          {passwordSuccess && (
            <div className="mb-6 flex items-center gap-2 p-4 bg-(--brand-primary-light) border border-(--brand-primary)/20 rounded-lg text-(--brand-primary)">
              <CheckCircle className="h-5 w-5" />
              Password changed successfully!
            </div>
          )}

          {/* Error Message */}
          {passwordError && (
            <div className="mb-6 flex items-center gap-2 p-4 bg-(--color-error-bg) border border-(--color-error)/20 rounded-lg text-(--color-error)">
              <AlertTriangle className="h-5 w-5" />
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-(--color-text-muted) hover:text-(--color-text-secondary) hover:bg-(--color-elevated) transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-(--color-text-muted) hover:text-(--color-text-secondary) hover:bg-(--color-elevated) transition-colors"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Requirements */}
              {passwordForm.newPassword && (
                <div className="mt-3 space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 text-sm ${
                        req.test ? 'text-(--brand-primary)' : 'text-(--color-text-muted)'
                      }`}
                    >
                      <CheckCircle
                        className={`h-4 w-4 ${req.test ? 'opacity-100' : 'opacity-30'}`}
                      />
                      {req.message}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  placeholder="Confirm new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-(--color-text-muted) hover:text-(--color-text-secondary) hover:bg-(--color-elevated) transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {passwordForm.confirmPassword &&
                passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="text-sm text-(--color-error)">Passwords do not match</p>
                )}
            </div>

            <Button
              type="submit"
              disabled={isChangingPassword || !isPasswordValid}
              className="bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing Password...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-(--color-text-secondary)" />
            <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Authenticator App</p>
              <p className="text-sm text-(--color-text-muted)">
                Add an extra layer of security using an authenticator app
              </p>
            </div>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-(--color-text-secondary)" />
            <h2 className="text-lg font-semibold">Active Sessions</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Session */}
          <div className="flex items-center justify-between p-4 bg-(--brand-primary-light) border border-(--brand-primary)/20 rounded-lg">
            <div className="flex items-center gap-3">
              <Monitor className="h-8 w-8 text-(--brand-primary)" />
              <div>
                <p className="font-medium text-foreground">Current Session</p>
                <p className="text-sm text-(--color-text-muted)">This device</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-(--brand-primary-light) text-(--brand-primary) text-xs font-medium rounded-full">
              Active
            </span>
          </div>

          {/* Sign out all devices */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Sign out of all devices</p>
                <p className="text-sm text-(--color-text-muted)">
                  This will sign you out of all devices including this one
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleSignOutAllDevices}
                className="text-(--color-error) border-(--color-error)/20 hover:bg-(--color-error-bg)"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login History */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Recent Login Activity</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-(--color-text-muted)">
            Login history tracking will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
