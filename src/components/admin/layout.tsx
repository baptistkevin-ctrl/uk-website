'use client'

interface AdminLayoutProps {
  children: React.ReactNode
}

// Simple wrapper component - actual layout is handled by the Next.js layout
export function AdminLayout({ children }: AdminLayoutProps) {
  return <>{children}</>
}
