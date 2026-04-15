'use client'

import { useState, useEffect } from 'react'
import {
  Truck, Clock, Save, Loader2, CheckCircle, MapPin, MessageSquare
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning', time: '7:00 - 10:00', icon: '🌅' },
  { id: 'midday', label: 'Midday', time: '10:00 - 13:00', icon: '☀️' },
  { id: 'afternoon', label: 'Afternoon', time: '13:00 - 16:00', icon: '🌤️' },
  { id: 'evening', label: 'Evening', time: '16:00 - 20:00', icon: '🌆' },
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function DeliveryPreferencesPage() {
  const [preferredSlot, setPreferredSlot] = useState<string>('afternoon')
  const [preferredDays, setPreferredDays] = useState<string[]>(['Saturday'])
  const [instructions, setInstructions] = useState('')
  const [leaveAtDoor, setLeaveAtDoor] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPrefs() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('delivery_preferences')
          .eq('id', user.id)
          .single()

        if (profile?.delivery_preferences) {
          const prefs = profile.delivery_preferences as Record<string, unknown>
          if (prefs.preferred_slot) setPreferredSlot(prefs.preferred_slot as string)
          if (Array.isArray(prefs.preferred_days)) setPreferredDays(prefs.preferred_days as string[])
          if (prefs.instructions) setInstructions(prefs.instructions as string)
          if (prefs.leave_at_door) setLeaveAtDoor(prefs.leave_at_door as boolean)
        }
      } catch {
        // Default values used
      } finally {
        setLoading(false)
      }
    }
    loadPrefs()
  }, [])

  const toggleDay = (day: string) => {
    setPreferredDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('profiles').update({
        delivery_preferences: {
          preferred_slot: preferredSlot,
          preferred_days: preferredDays,
          instructions,
          leave_at_door: leaveAtDoor,
        }
      }).eq('id', user.id)

      toast.success('Delivery preferences saved!')
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Truck className="h-6 w-6 text-(--brand-primary)" />
          Delivery Preferences
        </h1>
        <p className="text-(--color-text-muted) mt-1">Save your preferred delivery options for faster checkout</p>
      </div>

      {/* Preferred Time Slot */}
      <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-(--color-text-secondary)" />
          <h2 className="font-semibold text-foreground">Preferred Time Slot</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TIME_SLOTS.map(slot => (
            <button
              key={slot.id}
              onClick={() => setPreferredSlot(slot.id)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                preferredSlot === slot.id
                  ? 'border-(--brand-primary) bg-(--brand-primary)/5'
                  : 'border-(--color-border) hover:border-(--brand-primary)/40'
              }`}
            >
              <span className="text-2xl">{slot.icon}</span>
              <p className="font-semibold text-foreground text-sm mt-2">{slot.label}</p>
              <p className="text-xs text-(--color-text-muted)">{slot.time}</p>
              {preferredSlot === slot.id && (
                <CheckCircle className="h-4 w-4 text-(--brand-primary) mx-auto mt-2" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Days */}
      <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-(--color-text-secondary)" />
          <h2 className="font-semibold text-foreground">Preferred Delivery Days</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                preferredDays.includes(day)
                  ? 'bg-(--brand-primary) text-white'
                  : 'bg-background border border-(--color-border) text-(--color-text-secondary) hover:border-(--brand-primary)'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery Instructions */}
      <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-(--color-text-secondary)" />
          <h2 className="font-semibold text-foreground">Delivery Instructions</h2>
        </div>
        <textarea
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          rows={3}
          placeholder="e.g., Ring doorbell twice, leave in porch, etc."
          className="w-full px-4 py-3 border border-(--color-border) rounded-lg text-sm bg-background text-foreground placeholder:text-(--color-text-muted) focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary) outline-none"
        />

        <label className="flex items-center gap-3 mt-4 cursor-pointer">
          <input
            type="checkbox"
            checked={leaveAtDoor}
            onChange={e => setLeaveAtDoor(e.target.checked)}
            className="w-4 h-4 text-(--brand-primary) border-(--color-border) rounded"
          />
          <div>
            <p className="text-sm font-medium text-foreground">Leave at door if not home</p>
            <p className="text-xs text-(--color-text-muted)">Driver will leave your order in a safe place</p>
          </div>
        </label>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-(--brand-primary) hover:bg-(--brand-primary-hover) px-8"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Save Preferences</>
          )}
        </Button>
      </div>
    </div>
  )
}
