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
