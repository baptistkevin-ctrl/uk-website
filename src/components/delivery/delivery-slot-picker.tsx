'use client'

import { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  MapPin,
  Truck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Check,
  Zap
} from 'lucide-react'
import { format, addDays, isSameDay, parseISO, isToday, isTomorrow } from 'date-fns'

interface DeliveryZone {
  id: string
  name: string
  base_fee_pence: number
  free_delivery_threshold_pence: number | null
  min_order_pence: number
}

interface DeliverySlot {
  slot_id: string
  delivery_date: string
  start_time: string
  end_time: string
  price_pence: number
  is_express: boolean
  available_capacity: number
  is_nearly_full: boolean
}

interface DeliverySlotPickerProps {
  postcode: string
  orderTotalPence?: number
  onSlotSelected: (slot: DeliverySlot, zone: DeliveryZone, reservationId: string) => void
  onPostcodeChange?: () => void
  selectedSlotId?: string
}

export function DeliverySlotPicker({
  postcode,
  orderTotalPence = 0,
  onSlotSelected,
  onPostcodeChange,
  selectedSlotId
}: DeliverySlotPickerProps) {
  const [zone, setZone] = useState<DeliveryZone | null>(null)
  const [slots, setSlots] = useState<DeliverySlot[]>([])
  const [slotsByDate, setSlotsByDate] = useState<Record<string, DeliverySlot[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<DeliverySlot | null>(null)
  const [reserving, setReserving] = useState(false)
  const [reservationExpiry, setReservationExpiry] = useState<Date | null>(null)

  // Available dates for the date picker
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [dateOffset, setDateOffset] = useState(0)
  const datesPerView = 7

  // Fetch delivery slots
  useEffect(() => {
    if (!postcode) return

    const fetchSlots = async () => {
      setLoading(true)
      setError('')

      try {
        const res = await fetch(`/api/delivery/slots?postcode=${encodeURIComponent(postcode)}&days=14`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to check delivery availability')
          setZone(null)
          setSlots([])
          return
        }

        setZone(data.zone)
        setSlots(data.slots || [])
        setSlotsByDate(data.slotsByDate || {})

        // Set available dates
        const dates = Object.keys(data.slotsByDate || {}).sort()
        setAvailableDates(dates)

        // Auto-select first date if none selected
        if (dates.length > 0 && !selectedDate) {
          setSelectedDate(dates[0])
        }
      } catch (err) {
        setError('Failed to check delivery availability')
      } finally {
        setLoading(false)
      }
    }

    fetchSlots()
  }, [postcode])

  // Generate session ID for reservations
  const getSessionId = () => {
    let sessionId = localStorage.getItem('checkout_session_id')
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
      localStorage.setItem('checkout_session_id', sessionId)
    }
    return sessionId
  }

  // Reserve slot
  const reserveSlot = async (slot: DeliverySlot) => {
    if (!zone) return

    setReserving(true)
    try {
      const res = await fetch('/api/delivery/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: slot.slot_id,
          session_id: getSessionId()
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to reserve slot')
        return
      }

      setSelectedSlot(slot)
      setReservationExpiry(new Date(data.expires_at))
      onSlotSelected(slot, zone, data.reservation_id)
    } catch (err) {
      setError('Failed to reserve slot')
    } finally {
      setReserving(false)
    }
  }

  // Reservation countdown timer
  useEffect(() => {
    if (!reservationExpiry) return

    const interval = setInterval(() => {
      if (new Date() >= reservationExpiry) {
        setSelectedSlot(null)
        setReservationExpiry(null)
        setError('Your slot reservation has expired. Please select a new slot.')
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [reservationExpiry])

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'pm' : 'am'
    const hour12 = hour % 12 || 12
    return `${hour12}${minutes !== '00' ? ':' + minutes : ''}${ampm}`
  }

  const formatDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'EEE d MMM')
  }

  const getDeliveryFee = () => {
    if (!zone) return 0
    if (zone.free_delivery_threshold_pence && orderTotalPence >= zone.free_delivery_threshold_pence) {
      return 0
    }
    return zone.base_fee_pence
  }

  const getAmountForFreeDelivery = () => {
    if (!zone?.free_delivery_threshold_pence) return null
    return Math.max(0, zone.free_delivery_threshold_pence - orderTotalPence)
  }

  const displayedDates = availableDates.slice(dateOffset, dateOffset + datesPerView)

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-green-600" />
          <span className="text-gray-600">Checking delivery availability...</span>
        </div>
      </div>
    )
  }

  if (error && !zone) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
        {onPostcodeChange && (
          <button
            onClick={onPostcodeChange}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            Change delivery address
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Choose Delivery Slot</h3>
              <p className="text-sm text-gray-500">
                <MapPin className="h-3 w-3 inline mr-1" />
                Delivering to {postcode} ({zone?.name})
              </p>
            </div>
          </div>
          {onPostcodeChange && (
            <button
              onClick={onPostcodeChange}
              className="text-sm text-green-600 hover:text-green-700"
            >
              Change
            </button>
          )}
        </div>

        {/* Delivery fee info */}
        {zone && (
          <div className="mt-3 p-3 bg-white rounded-lg border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Delivery fee:</span>
              <span className="font-medium">
                {getDeliveryFee() === 0 ? (
                  <span className="text-green-600">FREE</span>
                ) : (
                  `£${(getDeliveryFee() / 100).toFixed(2)}`
                )}
              </span>
            </div>
            {getAmountForFreeDelivery() !== null && getAmountForFreeDelivery()! > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Add £{(getAmountForFreeDelivery()! / 100).toFixed(2)} more for free delivery
              </p>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-100">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Reservation timer */}
      {reservationExpiry && (
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
          <p className="text-sm text-amber-700 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Slot reserved for{' '}
            <CountdownTimer expiresAt={reservationExpiry} />
          </p>
        </div>
      )}

      {/* Date Selection */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            Select Date
          </h4>
          <div className="flex gap-1">
            <button
              onClick={() => setDateOffset(Math.max(0, dateOffset - datesPerView))}
              disabled={dateOffset === 0}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setDateOffset(Math.min(availableDates.length - datesPerView, dateOffset + datesPerView))}
              disabled={dateOffset >= availableDates.length - datesPerView}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {displayedDates.map((dateStr) => {
            const date = parseISO(dateStr)
            const isSelected = selectedDate === dateStr
            const slotsForDate = slotsByDate[dateStr] || []
            const hasSlots = slotsForDate.length > 0

            return (
              <button
                key={dateStr}
                onClick={() => hasSlots && setSelectedDate(dateStr)}
                disabled={!hasSlots}
                className={`p-2 rounded-lg text-center transition-all ${
                  isSelected
                    ? 'bg-green-600 text-white'
                    : hasSlots
                    ? 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                    : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                }`}
              >
                <div className="text-xs font-medium">
                  {format(date, 'EEE')}
                </div>
                <div className="text-lg font-bold">
                  {format(date, 'd')}
                </div>
                <div className="text-xs">
                  {format(date, 'MMM')}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="px-6 py-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-gray-400" />
            Select Time - {formatDateLabel(selectedDate)}
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(slotsByDate[selectedDate] || []).map((slot) => {
              const isSelected = selectedSlot?.slot_id === slot.slot_id || selectedSlotId === slot.slot_id
              const isDisabled = slot.available_capacity <= 0

              return (
                <button
                  key={slot.slot_id}
                  onClick={() => !isDisabled && reserveSlot(slot)}
                  disabled={isDisabled || reserving}
                  className={`relative p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                      : isDisabled
                      ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                  }`}
                >
                  {/* Express badge */}
                  {slot.is_express && (
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-amber-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Express
                    </span>
                  )}

                  {/* Nearly full badge */}
                  {slot.is_nearly_full && !isDisabled && (
                    <span className="absolute -top-2 left-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-medium rounded-full">
                      Almost full
                    </span>
                  )}

                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
                      {isDisabled
                        ? 'Fully booked'
                        : `${slot.available_capacity} slots left`}
                    </span>
                    {slot.price_pence > 0 && (
                      <span className="text-sm font-medium text-amber-600">
                        +£{(slot.price_pence / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {(slotsByDate[selectedDate] || []).length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No delivery slots available for this date
            </p>
          )}
        </div>
      )}

      {/* Loading overlay for reservation */}
      {reserving && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        </div>
      )}
    </div>
  )
}

// Countdown timer component
function CountdownTimer({ expiresAt }: { expiresAt: Date }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const diff = expiresAt.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft('0:00')
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  return <span className="font-mono font-medium">{timeLeft}</span>
}
