'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
} from 'lucide-react'

const shopLinks = [
  { label: 'Fresh Produce', href: '/categories/fresh-produce' },
  { label: 'Meat & Fish', href: '/categories/meat-fish' },
  { label: 'Dairy & Eggs', href: '/categories/dairy-eggs' },
  { label: 'Bakery', href: '/categories/bakery' },
  { label: 'Pantry', href: '/categories/pantry' },
  { label: 'Drinks', href: '/categories/drinks' },
  { label: 'Frozen', href: '/categories/frozen' },
  { label: 'Deals', href: '/deals' },
]

const serviceLinks = [
  { label: 'My Account', href: '/account' },
  { label: 'Order Tracking', href: '/account/orders' },
  { label: 'Delivery Info', href: '/delivery' },
  { label: 'Returns & Refunds', href: '/returns' },
  { label: 'FAQs', href: '/faq' },
]

const companyLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Help Centre', href: '/help' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Become a Seller', href: '/sell' },
]

const trustBadges = [
  { icon: ShieldCheck, text: 'Secure Payments' },
  { icon: Truck, text: 'Free Delivery Over \u00a340' },
  { icon: RotateCcw, text: 'Easy Returns' },
  { icon: Star, text: '4.8\u2605 Rated' },
]

const socialLinks = [
  { icon: Facebook, label: 'Facebook', href: 'https://facebook.com' },
  { icon: Twitter, label: 'Twitter', href: 'https://x.com' },
  { icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
  { icon: Mail, label: 'TikTok', href: 'https://tiktok.com' },
]

const legalLinks = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Cookies', href: '/cookies' },
]

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold uppercase tracking-wider text-white/60 mb-4">
        {title}
      </h4>
      <ul className="space-y-0.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-white/70 hover:text-white transition-colors inline-block py-1.5"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function NewsletterForm() {
  const [email, setEmail] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEmail('')
  }

  return (
    <div>
      <h4 className="text-sm font-semibold uppercase tracking-wider text-white/60 mb-4">
        Newsletter
      </h4>
      <p className="text-sm text-white/70 mb-4">
        Get weekly deals and recipes straight to your inbox.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="footer-newsletter-email" className="absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]">
          Email address
        </label>
        <input
          id="footer-newsletter-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          required
          className="flex-1 min-w-0 rounded-lg bg-(--color-surface)/10 border border-white/15 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/30 transition-colors"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-(--brand-amber) px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 transition-all cursor-pointer"
        >
          Subscribe
        </button>
      </form>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        {/* Logo + Description */}
        <div className="mb-12">
          <Link href="/" className="inline-block">
            <span className="font-display text-2xl font-semibold text-white">
              UK Grocery
            </span>
          </Link>
          <p className="mt-3 text-sm text-white/60 max-w-sm">
            Fresh groceries delivered across the UK.
            <br />
            Free delivery over {'\u00a3'}40.
          </p>
        </div>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <FooterColumn title="Shop" links={shopLinks} />
          <FooterColumn title="Customer Service" links={serviceLinks} />
          <FooterColumn title="Company" links={companyLinks} />
          <NewsletterForm />
        </div>

        {/* Trust Badges */}
        <div className="border-t border-white/10 pt-8 mt-12">
          <div className="flex flex-wrap gap-8 justify-center lg:justify-start">
            {trustBadges.map((badge) => (
              <div key={badge.text} className="flex items-center gap-2 text-white/70">
                <badge.icon className="h-5 w-5 text-(--brand-primary)" />
                <span className="text-sm">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods + App Downloads */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-8">
          {/* Payment Icons */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 mr-2">We accept</span>
            {['Visa', 'Mastercard', 'Amex', 'Apple Pay', 'Google Pay'].map((method) => (
              <div
                key={method}
                className="h-8 px-2.5 rounded bg-white/10 border border-white/10 flex items-center justify-center"
              >
                <span className="text-[10px] font-semibold text-white/60">{method}</span>
              </div>
            ))}
          </div>

          {/* App Download */}
          <div className="flex items-center gap-2">
            <a
              href="#"
              className="h-10 px-4 rounded-lg bg-white/10 border border-white/10 flex items-center gap-2 hover:bg-white/15 transition-colors"
            >
              <svg className="h-5 w-5 text-white/70" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              <div>
                <p className="text-[8px] text-white/50 leading-none">Download on the</p>
                <p className="text-xs font-semibold text-white/80 leading-tight">App Store</p>
              </div>
            </a>
            <a
              href="#"
              className="h-10 px-4 rounded-lg bg-white/10 border border-white/10 flex items-center gap-2 hover:bg-white/15 transition-colors"
            >
              <svg className="h-5 w-5 text-white/70" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.991l-2.302 2.302-8.634-8.635z"/></svg>
              <div>
                <p className="text-[8px] text-white/50 leading-none">Get it on</p>
                <p className="text-xs font-semibold text-white/80 leading-tight">Google Play</p>
              </div>
            </a>
          </div>
        </div>

        {/* Social Icons */}
        <div className="flex gap-3 mt-8 justify-center lg:justify-start">
          {socialLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-surface)/10 hover:bg-(--color-surface)/20 transition-colors"
            >
              <social.icon className="h-4 w-4" />
            </a>
          ))}
        </div>

        {/* Legal Bar */}
        <div className="border-t border-white/10 pt-6 mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/50">
              &copy; {new Date().getFullYear()} UK Grocery Store. All rights reserved.
            </p>
            <div className="flex gap-6">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <p className="text-center sm:text-left text-xs text-white/30 mt-4">
            Built by Solaris Empire Inc
          </p>
        </div>
      </div>
    </footer>
  )
}
