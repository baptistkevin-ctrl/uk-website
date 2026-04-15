'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Phone, Save, Loader2, CheckCircle, Camera } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  created_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile')
        if (res.ok) {
          const data = await res.json()
          setProfile(data)
          setFormData({
            full_name: data.full_name || '',
            phone: data.phone || '',
          })
        }
      } catch (err) {
        setError('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to update profile')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <User className="h-6 w-6 text-(--brand-primary)" />
          My Profile
        </h1>
        <p className="text-(--color-text-muted) mt-1">Manage your personal information</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-(--brand-primary-light) border border-(--brand-primary)/20 rounded-lg text-(--brand-primary)">
          <CheckCircle className="h-5 w-5" />
          Profile updated successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-(--color-error-bg) border border-(--color-error)/20 rounded-lg text-(--color-error)">
          {error}
        </div>
      )}

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Personal Information</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 bg-(--brand-primary-light) rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-(--brand-primary)" />
                </div>
                <button
                  type="button"
                  aria-label="Change profile photo"
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-(--color-surface) border border-(--color-border) rounded-full flex items-center justify-center shadow-sm hover:bg-background transition-colors"
                >
                  <Camera className="h-4 w-4 text-(--color-text-secondary)" />
                </button>
              </div>
              <div>
                <p className="font-medium text-foreground">{formData.full_name || 'Your Name'}</p>
                <p className="text-sm text-(--color-text-muted)">{profile?.email}</p>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-(--color-text-disabled)" />
                <Input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter your full name"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-(--color-text-disabled)" />
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="pl-10 bg-background"
                />
              </div>
              <p className="text-xs text-(--color-text-muted)">
                Email cannot be changed. Contact support if you need to update it.
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-(--color-text-disabled)" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+44 7XXX XXXXXX"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Account Info */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-(--color-text-secondary) mb-3">Account Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-(--color-text-muted)">Member since</p>
                  <p className="font-medium text-foreground">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-(--color-text-muted)">Account ID</p>
                  <p className="font-medium text-foreground font-mono text-xs">
                    {profile?.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-(--color-error)/20">
        <CardHeader>
          <h2 className="text-lg font-semibold text-(--color-error)">Danger Zone</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Delete Account</p>
              <p className="text-sm text-(--color-text-muted)">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="outline" className="text-(--color-error) border-(--color-error)/20 hover:bg-(--color-error-bg)">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
