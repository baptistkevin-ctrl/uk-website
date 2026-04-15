"use client"

import { useState, useEffect } from "react"
import { Modal } from "@/components/ui/Modal"
import { DietaryProfileSetup } from "@/components/dietary/DietaryProfileSetup"

const ONBOARDING_KEY = "dietary-onboarding-shown"

export function DietaryOnboardingModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const alreadyShown = localStorage.getItem(ONBOARDING_KEY)
    if (!alreadyShown) {
      const timer = setTimeout(() => setOpen(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  function handleDismiss() {
    setOpen(false)
    localStorage.setItem(ONBOARDING_KEY, "true")
  }

  function handleComplete() {
    handleDismiss()
  }

  return (
    <Modal
      open={open}
      onOpenChange={(value) => {
        if (!value) handleDismiss()
      }}
      title="Personalise Your Shopping"
      description="Set your dietary preferences so we can filter products and warn you about allergens."
      size="lg"
    >
      <DietaryProfileSetup onComplete={handleComplete} compact />

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={handleDismiss}
          className="text-sm font-medium text-(--color-text-muted) transition-colors hover:text-foreground"
        >
          Skip for now
        </button>
      </div>
    </Modal>
  )
}
