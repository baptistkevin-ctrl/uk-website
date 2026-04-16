'use client'

import { usePathname } from 'next/navigation'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { CookieConsent } from '@/components/layout/CookieConsent'
import { OrganizationSchema } from '@/components/seo/OrganizationSchema'
import { WebsiteSchema } from '@/components/seo/WebsiteSchema'

/**
 * Components that should ONLY render on public shop pages.
 * Hidden on /admin and /vendor dashboards — those are separate interfaces.
 */
export function ShopOnlyShell() {
  const pathname = usePathname()

  if (pathname.startsWith('/admin') || pathname.startsWith('/vendor')) {
    return null
  }

  return (
    <>
      <MobileBottomNav />
      <CookieConsent />
      <OrganizationSchema />
      <WebsiteSchema />
    </>
  )
}
