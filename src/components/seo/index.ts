/**
 * SEO Components and Utilities
 *
 * This module provides comprehensive SEO support for Next.js 16 App Router including:
 * - Dynamic metadata generation
 * - Open Graph tags
 * - Twitter Card tags
 * - JSON-LD structured data (Schema.org)
 * - Canonical URL support
 * - Helper functions for various schema types
 *
 * @example Basic metadata generation
 * ```tsx
 * import { generateMetadata } from '@/components/seo'
 *
 * export const metadata = generateMetadata({
 *   title: 'Page Title',
 *   description: 'Page description',
 *   canonical: 'https://example.com/page',
 * })
 * ```
 *
 * @example Product page with JSON-LD
 * ```tsx
 * import { generateProductMetadata, ProductJsonLd, BreadcrumbJsonLd } from '@/components/seo'
 *
 * export const metadata = generateProductMetadata({ product })
 *
 * export default function ProductPage() {
 *   return (
 *     <>
 *       <ProductJsonLd product={product} />
 *       <BreadcrumbJsonLd items={breadcrumbs} />
 *       {/* Page content *\/}
 *     </>
 *   )
 * }
 * ```
 */

// Type exports
export type {
  SiteConfig,
  OpenGraphType,
  OpenGraphConfig,
  OpenGraphImage,
  TwitterConfig,
  ProductData,
  OrganizationData,
  BreadcrumbItem,
  FAQItem,
  ReviewData,
  ArticleData,
  LocalBusinessData,
} from './meta-tags'

// Configuration exports
export {
  defaultSiteConfig,
  defaultOrganization,
} from './meta-tags'

// Metadata generation functions
export {
  generateMetadata,
  generateProductMetadata,
  generateCategoryMetadata,
} from './meta-tags'

// Schema generation functions
export {
  generateProductSchema,
  generateOrganizationSchema,
  generateBreadcrumbSchema,
  generateWebsiteSchema,
  generateFAQSchema,
  generateArticleSchema,
  generateLocalBusinessSchema,
  generateReviewSchema,
  generateProductListSchema,
} from './meta-tags'

// JSON-LD React components
export {
  JsonLd,
  ProductJsonLd,
  OrganizationJsonLd,
  BreadcrumbJsonLd,
  WebsiteJsonLd,
  FAQJsonLd,
  ArticleJsonLd,
  LocalBusinessJsonLd,
  ProductListJsonLd,
} from './meta-tags'

// Utility functions
export {
  formatPrice,
  truncateText,
  getCanonicalUrl,
  stripHtml,
  createOgImageUrl,
  dbProductToSeoProduct,
} from './meta-tags'
