'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PrintInvoiceButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="print:hidden"
    >
      <Printer className="h-4 w-4 mr-1.5" />
      Print Invoice
    </Button>
  )
}
