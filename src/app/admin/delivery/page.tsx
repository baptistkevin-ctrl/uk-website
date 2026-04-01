'use client'

import { useState, useEffect } from 'react'
import {
  Truck,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  ToggleLeft,
  ToggleRight,
  Users,
  PoundSterling,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DeliverySlot {
  id: string
  date: string
  start_time: string
  end_time: string
  max_orders: number
  current_orders: number
  delivery_fee_pence: number
  is_available: boolean
  created_at: string
}

interface SlotFormData {
  date: string
  start_time: string
  end_time: string
  max_orders: number
  delivery_fee_pence: number
  is_available: boolean
}

const TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00'
]

export default function AdminDeliveryPage() {
  const [slots, setSlots] = useState<DeliverySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSlot, setEditingSlot] = useState<DeliverySlot | null>(null)
  const [formData, setFormData] = useState<SlotFormData>({
    date: '',
    start_time: '09:00',
    end_time: '11:00',
    max_orders: 20,
    delivery_fee_pence: 399,
    is_available: true,
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff)
    monday.setHours(0, 0, 0, 0)
    return monday
  })

  const fetchSlots = async () => {
    setLoading(true)
    try {
      const startDate = currentWeekStart.toISOString().split('T')[0]
      const endDate = new Date(currentWeekStart)
      endDate.setDate(endDate.getDate() + 6)
      const endDateStr = endDate.toISOString().split('T')[0]

      const response = await fetch(`/api/admin/delivery-slots?startDate=${startDate}&endDate=${endDateStr}`)
      const data = await response.json()

      if (Array.isArray(data)) {
        setSlots(data)
      }
    } catch (error) {
      console.error('Failed to fetch slots:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSlots()
  }, [currentWeekStart])

  const handleAddNew = () => {
    setEditingSlot(null)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setFormData({
      date: tomorrow.toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '11:00',
      max_orders: 20,
      delivery_fee_pence: 399,
      is_available: true,
    })
    setShowModal(true)
  }

  const handleEdit = (slot: DeliverySlot) => {
    setEditingSlot(slot)
    setFormData({
      date: slot.date,
      start_time: slot.start_time.slice(0, 5),
      end_time: slot.end_time.slice(0, 5),
      max_orders: slot.max_orders,
      delivery_fee_pence: slot.delivery_fee_pence,
      is_available: slot.is_available,
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        ...formData,
        start_time: formData.start_time + ':00',
        end_time: formData.end_time + ':00',
      }

      if (editingSlot) {
        const response = await fetch('/api/admin/delivery-slots', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingSlot.id, ...payload }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to update slot')
        }
      } else {
        const response = await fetch('/api/admin/delivery-slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to create slot')
        }
      }

      setShowModal(false)
      fetchSlots()
    } catch (error) {
      console.error('Save error:', error)
      alert(error instanceof Error ? error.message : 'Failed to save slot')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery slot?')) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/admin/delivery-slots?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete slot')
      }

      await fetchSlots()
    } catch (error) {
      console.error('Delete error:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete slot')
    } finally {
      setDeleting(null)
    }
  }

  const toggleAvailability = async (slot: DeliverySlot) => {
    try {
      const response = await fetch('/api/admin/delivery-slots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: slot.id, is_available: !slot.is_available }),
      })

      if (response.ok) {
        fetchSlots()
      }
    } catch (error) {
      console.error('Toggle error:', error)
    }
  }

  const generateWeekSlots = async () => {
    if (!confirm('Generate delivery slots for the current week? This will create 2-hour slots from 8am to 10pm.')) {
      return
    }

    setSaving(true)
    const times = [
      { start: '08:00', end: '10:00' },
      { start: '10:00', end: '12:00' },
      { start: '12:00', end: '14:00' },
      { start: '14:00', end: '16:00' },
      { start: '16:00', end: '18:00' },
      { start: '18:00', end: '20:00' },
      { start: '20:00', end: '22:00' },
    ]

    try {
      for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart)
        date.setDate(date.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]

        for (const time of times) {
          await fetch('/api/admin/delivery-slots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: dateStr,
              start_time: time.start + ':00',
              end_time: time.end + ':00',
              max_orders: 20,
              delivery_fee_pence: 399,
              is_available: true,
            }),
          }).catch(() => {}) // Ignore duplicate errors
        }
      }

      fetchSlots()
    } catch (error) {
      console.error('Generate error:', error)
    } finally {
      setSaving(false)
    }
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeekStart(newDate)
  }

  const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`

  const getDaysOfWeek = () => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(date.getDate() + i)
      days.push(date)
    }
    return days
  }

  const getSlotsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return slots.filter(slot => slot.date === dateStr)
  }

  const days = getDaysOfWeek()
  const isCurrentWeek = days.some(d => d.toDateString() === new Date().toDateString())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="h-7 w-7 text-emerald-600" />
            Delivery Slots
          </h1>
          <p className="text-gray-500 mt-1">Manage delivery time slots and availability</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={generateWeekSlots} variant="outline" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Generate Week
          </Button>
          <Button onClick={handleAddNew} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Slot
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentWeekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} -
              {' '}{new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
            {isCurrentWeek && <p className="text-sm text-emerald-600">Current Week</p>}
          </div>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Slots</p>
              <p className="text-2xl font-bold text-gray-900">{slots.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Available</p>
              <p className="text-2xl font-bold text-blue-600">
                {slots.filter(s => s.is_available).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-orange-600">
                {slots.reduce((sum, s) => sum + s.current_orders, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <PoundSterling className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Fee</p>
              <p className="text-2xl font-bold text-purple-600">
                {slots.length > 0
                  ? formatPrice(Math.round(slots.reduce((sum, s) => sum + s.delivery_fee_pence, 0) / slots.length))
                  : '£0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {days.map((day) => {
            const daySlots = getSlotsForDay(day)
            const isToday = day.toDateString() === new Date().toDateString()
            const isPast = day < new Date(new Date().setHours(0, 0, 0, 0))

            return (
              <div
                key={day.toISOString()}
                className={`bg-white rounded-xl border ${isToday ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-gray-200'} overflow-hidden`}
              >
                <div className={`px-4 py-3 ${isToday ? 'bg-emerald-50' : 'bg-gray-50'} border-b border-gray-200`}>
                  <p className={`text-sm font-medium ${isToday ? 'text-emerald-600' : isPast ? 'text-gray-400' : 'text-gray-600'}`}>
                    {day.toLocaleDateString('en-GB', { weekday: 'short' })}
                  </p>
                  <p className={`text-lg font-bold ${isToday ? 'text-emerald-700' : isPast ? 'text-gray-400' : 'text-gray-900'}`}>
                    {day.getDate()}
                  </p>
                </div>
                <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
                  {daySlots.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No slots</p>
                  ) : (
                    daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className={`p-2 rounded-lg text-xs ${
                          !slot.is_available
                            ? 'bg-gray-100 text-gray-500'
                            : slot.current_orders >= slot.max_orders
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">
                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(slot)}
                              className="p-1 hover:bg-white/50 rounded"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(slot.id)}
                              disabled={deleting === slot.id}
                              className="p-1 hover:bg-white/50 rounded text-red-500"
                            >
                              {deleting === slot.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{slot.current_orders}/{slot.max_orders} orders</span>
                          <span>{formatPrice(slot.delivery_fee_pence)}</span>
                        </div>
                        <button
                          onClick={() => toggleAvailability(slot)}
                          className="mt-1 w-full flex items-center justify-center gap-1 text-xs"
                        >
                          {slot.is_available ? (
                            <>
                              <ToggleRight className="h-3 w-3" /> Available
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-3 w-3" /> Unavailable
                            </>
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingSlot ? 'Edit Slot' : 'Add Delivery Slot'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time *</Label>
                  <select
                    id="start_time"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    {TIME_OPTIONS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="end_time">End Time *</Label>
                  <select
                    id="end_time"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    {TIME_OPTIONS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="max_orders">Max Orders</Label>
                <Input
                  id="max_orders"
                  type="number"
                  value={formData.max_orders}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_orders: parseInt(e.target.value) || 20 }))}
                  min={1}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="delivery_fee_pence">Delivery Fee (pence)</Label>
                <Input
                  id="delivery_fee_pence"
                  type="number"
                  value={formData.delivery_fee_pence}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_fee_pence: parseInt(e.target.value) || 0 }))}
                  min={0}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Display: {formatPrice(formData.delivery_fee_pence)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="is_available"
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <Label htmlFor="is_available" className="cursor-pointer">
                  Available for booking
                </Label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingSlot ? 'Update' : 'Create'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
