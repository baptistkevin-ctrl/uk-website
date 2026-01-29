import type { Metadata } from 'next'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Site configuration for SEO defaults
 */
export interface SiteConfig {
  name: string
  description: string
  url: string
  ogImage: string
  twitterHandle?: string
  locale?: string
  currency?: string
}

/**
 * Open Graph metadata configuration
 */
/**
 * Supported Open Graph types for Next.js metadata
 * Note: 'product' is handled via JSON-LD structured data instead
 */
export type OpenGraphType = 'website' | 'article' | 'profile'

export interface OpenGraphConfig {
  title: string
  description: string
  url?: string
  siteName?: string
  images?: OpenGraphImage[]
  locale?: string
  type?: OpenGraphType
}

export interface OpenGraphImage {
  url: string
  width?: number
  height?: number
  alt?: string
  type?: string
}

/**
 * Twitter Card metadata configuration
 */
export interface TwitterConfig {
  card?: 'summary' | 'summary_large_image' | 'app' | 'player'
  site?: string
  creator?: string
  title?: string
  description?: string
  image?: string
  imageAlt?: string
}

/**
 * Product data for structured data
 */
export interface ProductData {
  id: string
  name: string
  description: string
  slug: string
  image?: string
  images?: string[]
  price: number // Price in pence
  compareAtPrice?: number // Original price for sale items
  currency?: string
  sku?: string
  brand?: string
  category?: string
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder' | 'LimitedAvailability'
  condition?: 'NewCondition' | 'UsedCondition' | 'RefurbishedCondition'
  rating?: number
  reviewCount?: number
  seller?: {
    name: string
    url?: string
  }
}

/**
 * Organization data for structured data
 */
export interface OrganizationData {
  name: string
  url: string
  logo: string
  description?: string
  email?: string
  phone?: string
  address?: {
    streetAddress?: string
    addressLocality?: string // City
    addressRegion?: string // County/State
    postalCode?: string
    addressCountry?: string
  }
  sameAs?: string[] // Social media URLs
  foundingDate?: string
  founders?: string[]
  numberOfEmployees?: number | { min: number; max: number }
}

/**
 * Breadcrumb item for structured data
 */
export interface BreadcrumbItem {
  name: string
  url: string
}

/**
 * FAQ item for structured data
 */
export interface FAQItem {
  question: string
  answer: string
}

/**
 * Review data for structured data
 */
export interface ReviewData {
  author: string
  datePublished: string
  reviewBody?: string
  reviewRating: {
    ratingValue: number
    bestRating?: number
    worstRating?: number
  }
}

/**
 * Article data for structured data
 */
export interface ArticleData {
  headline: string
  description: string
  image?: string | string[]
  datePublished: string
  dateModified?: string
  author: {
    name: string
    url?: string
  }
  publisher?: {
    name: string
    logo?: string
  }
}

/**
 * Local business data for structured data
 */
export interface LocalBusinessData {
  name: string
  description?: string
  image?: string
  url?: string
  telephone?: string
  email?: string
  priceRange?: string
  address: {
    streetAddress: string
    addressLocality: string
    addressRegion?: string
    postalCode: string
    addressCountry: string
  }
  geo?: {
    latitude: number
    longitude: number
  }
  openingHours?: string[]
  sameAs?: string[]
}

// ============================================================================
// DEFAULT SITE CONFIGURATION
// ============================================================================

export const defaultSiteConfig: SiteConfig = {
  name: 'FreshMart',
  description: 'Shop for fresh groceries online. Quality products delivered to your door across the UK.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://freshmart.co.uk',
  ogImage: '/images/og-default.jpg',
  twitterHandle: '@freshmart',
  locale: 'en_GB',
  currency: 'GBP',
}

// ============================================================================
// METADATA GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate base metadata for a page
 */
export function generateMetadata({
  title,
  description,
  keywords,
  canonical,
  noIndex = false,
  noFollow = false,
  openGraph,
  twitter,
  siteConfig = defaultSiteConfig,
}: {
  title: string
  description: string
  keywords?: string[]
  canonical?: string
  noIndex?: boolean
  noFollow?: boolean
  openGraph?: Partial<OpenGraphConfig>
  twitter?: Partial<TwitterConfig>
  siteConfig?: SiteConfig
}): Metadata {
  const url = canonical || siteConfig.url

  const robotsDirectives: string[] = []
  if (noIndex) robotsDirectives.push('noindex')
  if (noFollow) robotsDirectives.push('nofollow')

  return {
    title,
    description,
    keywords: keywords?.join(', '),
    robots: robotsDirectives.length > 0 ? robotsDirectives.join(', ') : undefined,
    alternates: {
      canonical: canonical,
    },
    openGraph: {
      title: openGraph?.title || title,
      description: openGraph?.description || description,
      url: openGraph?.url || url,
      siteName: openGraph?.siteName || siteConfig.name,
      images: openGraph?.images || [
        {
          url: `${siteConfig.url}${siteConfig.ogImage}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: openGraph?.locale || siteConfig.locale,
      type: openGraph?.type || 'website',
    },
    twitter: {
      card: twitter?.card || 'summary_large_image',
      site: twitter?.site || siteConfig.twitterHandle,
      creator: twitter?.creator || siteConfig.twitterHandle,
      title: twitter?.title || title,
      description: twitter?.description || description,
      images: twitter?.image ? [twitter.image] : [`${siteConfig.url}${siteConfig.ogImage}`],
    },
    other: {
      'format-detection': 'telephone=no',
    },
  }
}

/**
 * Generate metadata specifically for product pages
 */
export function generateProductMetadata({
  product,
  siteConfig = defaultSiteConfig,
}: {
  product: ProductData
  siteConfig?: SiteConfig
}): Metadata {
  const priceFormatted = formatPrice(product.price, siteConfig.currency)
  const title = product.name
  const description = product.description.length > 160
    ? `${product.description.slice(0, 157)}...`
    : product.description

  return generateMetadata({
    title,
    description,
    keywords: [
      product.name,
      product.brand,
      product.category,
      'buy online',
      'UK delivery',
    ].filter(Boolean) as string[],
    canonical: `${siteConfig.url}/products/${product.slug}`,
    openGraph: {
      title: `${product.name} - ${priceFormatted}`,
      description,
      // Note: Use 'website' for OG type; product data is provided via JSON-LD structured data
      type: 'website',
      images: product.images?.map((img, index) => ({
        url: img.startsWith('http') ? img : `${siteConfig.url}${img}`,
        width: 1200,
        height: 1200,
        alt: `${product.name} - Image ${index + 1}`,
      })) || (product.image ? [{
        url: product.image.startsWith('http') ? product.image : `${siteConfig.url}${product.image}`,
        width: 1200,
        height: 1200,
        alt: product.name,
      }] : undefined),
    },
    siteConfig,
  })
}

/**
 * Generate metadata for category pages
 */
export function generateCategoryMetadata({
  name,
  slug,
  description,
  image,
  siteConfig = defaultSiteConfig,
}: {
  name: string
  slug: string
  description?: string
  image?: string
  siteConfig?: SiteConfig
}): Metadata {
  const title = `${name} | Shop Online`
  const desc = description || `Browse our selection of ${name.toLowerCase()}. Fresh quality products with fast UK delivery.`

  return generateMetadata({
    title,
    description: desc,
    keywords: [name, `buy ${name}`, `${name} online`, 'UK delivery', 'fresh groceries'],
    canonical: `${siteConfig.url}/categories/${slug}`,
    openGraph: {
      title,
      description: desc,
      images: image ? [{
        url: image.startsWith('http') ? image : `${siteConfig.url}${image}`,
        width: 1200,
        height: 630,
        alt: name,
      }] : undefined,
    },
    siteConfig,
  })
}

// ============================================================================
// JSON-LD STRUCTURED DATA GENERATORS
// ============================================================================

/**
 * Generate JSON-LD script tag for structured data
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 0),
      }}
    />
  )
}

/**
 * Generate Product structured data (Schema.org)
 */
export function generateProductSchema({
  product,
  siteConfig = defaultSiteConfig,
}: {
  product: ProductData
  siteConfig?: SiteConfig
}): Record<string, unknown> {
  const baseUrl = siteConfig.url
  const productUrl = `${baseUrl}/products/${product.slug}`
  const currency = siteConfig.currency || 'GBP'

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': productUrl,
    name: product.name,
    description: product.description,
    url: productUrl,
    sku: product.sku || product.id,
    image: product.images?.map(img =>
      img.startsWith('http') ? img : `${baseUrl}${img}`
    ) || (product.image ? [product.image.startsWith('http') ? product.image : `${baseUrl}${product.image}`] : []),
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: currency,
      price: (product.price / 100).toFixed(2),
      priceValidUntil: getNextYearDate(),
      availability: `https://schema.org/${product.availability || 'InStock'}`,
      itemCondition: `https://schema.org/${product.condition || 'NewCondition'}`,
      seller: product.seller ? {
        '@type': 'Organization',
        name: product.seller.name,
        url: product.seller.url,
      } : {
        '@type': 'Organization',
        name: siteConfig.name,
        url: baseUrl,
      },
    },
  }

  // Add brand if available
  if (product.brand) {
    schema.brand = {
      '@type': 'Brand',
      name: product.brand,
    }
  }

  // Add category if available
  if (product.category) {
    schema.category = product.category
  }

  // Add aggregate rating if available
  if (product.rating && product.reviewCount && product.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating.toFixed(1),
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  // Add sale price annotation if on sale
  if (product.compareAtPrice && product.compareAtPrice > product.price) {
    (schema.offers as Record<string, unknown>).priceSpecification = {
      '@type': 'PriceSpecification',
      price: (product.price / 100).toFixed(2),
      priceCurrency: currency,
      valueAddedTaxIncluded: true,
    }
  }

  return schema
}

/**
 * Generate Organization structured data (Schema.org)
 */
export function generateOrganizationSchema({
  organization,
}: {
  organization: OrganizationData
}): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${organization.url}/#organization`,
    name: organization.name,
    url: organization.url,
    logo: {
      '@type': 'ImageObject',
      url: organization.logo.startsWith('http') ? organization.logo : `${organization.url}${organization.logo}`,
      width: 512,
      height: 512,
    },
  }

  if (organization.description) {
    schema.description = organization.description
  }

  if (organization.email) {
    schema.email = organization.email
  }

  if (organization.phone) {
    schema.telephone = organization.phone
  }

  if (organization.address) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: organization.address.streetAddress,
      addressLocality: organization.address.addressLocality,
      addressRegion: organization.address.addressRegion,
      postalCode: organization.address.postalCode,
      addressCountry: organization.address.addressCountry || 'GB',
    }
  }

  if (organization.sameAs && organization.sameAs.length > 0) {
    schema.sameAs = organization.sameAs
  }

  if (organization.foundingDate) {
    schema.foundingDate = organization.foundingDate
  }

  if (organization.founders && organization.founders.length > 0) {
    schema.founder = organization.founders.map(name => ({
      '@type': 'Person',
      name,
    }))
  }

  if (organization.numberOfEmployees) {
    if (typeof organization.numberOfEmployees === 'number') {
      schema.numberOfEmployees = {
        '@type': 'QuantitativeValue',
        value: organization.numberOfEmployees,
      }
    } else {
      schema.numberOfEmployees = {
        '@type': 'QuantitativeValue',
        minValue: organization.numberOfEmployees.min,
        maxValue: organization.numberOfEmployees.max,
      }
    }
  }

  return schema
}

/**
 * Generate BreadcrumbList structured data (Schema.org)
 */
export function generateBreadcrumbSchema({
  items,
  siteConfig = defaultSiteConfig,
}: {
  items: BreadcrumbItem[]
  siteConfig?: SiteConfig
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteConfig.url}${item.url}`,
    })),
  }
}

/**
 * Generate WebSite structured data with SearchAction (Schema.org)
 */
export function generateWebsiteSchema({
  siteConfig = defaultSiteConfig,
}: {
  siteConfig?: SiteConfig
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteConfig.url}/#website`,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: {
      '@id': `${siteConfig.url}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: siteConfig.locale?.replace('_', '-') || 'en-GB',
  }
}

/**
 * Generate FAQPage structured data (Schema.org)
 */
export function generateFAQSchema({
  items,
}: {
  items: FAQItem[]
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

/**
 * Generate Article structured data (Schema.org)
 */
export function generateArticleSchema({
  article,
  siteConfig = defaultSiteConfig,
}: {
  article: ArticleData
  siteConfig?: SiteConfig
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    image: article.image,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      '@type': 'Person',
      name: article.author.name,
      url: article.author.url,
    },
    publisher: {
      '@type': 'Organization',
      name: article.publisher?.name || siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: article.publisher?.logo || `${siteConfig.url}/images/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': siteConfig.url,
    },
  }
}

/**
 * Generate LocalBusiness structured data (Schema.org)
 */
export function generateLocalBusinessSchema({
  business,
}: {
  business: LocalBusinessData
}): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address.streetAddress,
      addressLocality: business.address.addressLocality,
      addressRegion: business.address.addressRegion,
      postalCode: business.address.postalCode,
      addressCountry: business.address.addressCountry,
    },
  }

  if (business.description) schema.description = business.description
  if (business.image) schema.image = business.image
  if (business.url) schema.url = business.url
  if (business.telephone) schema.telephone = business.telephone
  if (business.email) schema.email = business.email
  if (business.priceRange) schema.priceRange = business.priceRange

  if (business.geo) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: business.geo.latitude,
      longitude: business.geo.longitude,
    }
  }

  if (business.openingHours && business.openingHours.length > 0) {
    schema.openingHours = business.openingHours
  }

  if (business.sameAs && business.sameAs.length > 0) {
    schema.sameAs = business.sameAs
  }

  return schema
}

/**
 * Generate Review structured data (Schema.org)
 */
export function generateReviewSchema({
  review,
  itemReviewed,
}: {
  review: ReviewData
  itemReviewed: {
    type: 'Product' | 'LocalBusiness' | 'Organization'
    name: string
  }
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author,
    },
    datePublished: review.datePublished,
    reviewBody: review.reviewBody,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.reviewRating.ratingValue,
      bestRating: review.reviewRating.bestRating || 5,
      worstRating: review.reviewRating.worstRating || 1,
    },
    itemReviewed: {
      '@type': itemReviewed.type,
      name: itemReviewed.name,
    },
  }
}

/**
 * Generate ItemList structured data for product listings (Schema.org)
 */
export function generateProductListSchema({
  products,
  listName,
  siteConfig = defaultSiteConfig,
}: {
  products: ProductData[]
  listName?: string
  siteConfig?: SiteConfig
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        '@id': `${siteConfig.url}/products/${product.slug}`,
        name: product.name,
        url: `${siteConfig.url}/products/${product.slug}`,
        image: product.image?.startsWith('http')
          ? product.image
          : `${siteConfig.url}${product.image}`,
        offers: {
          '@type': 'Offer',
          price: (product.price / 100).toFixed(2),
          priceCurrency: siteConfig.currency || 'GBP',
          availability: `https://schema.org/${product.availability || 'InStock'}`,
        },
      },
    })),
  }
}

// ============================================================================
// REACT COMPONENTS FOR JSON-LD
// ============================================================================

/**
 * Product JSON-LD Component
 */
export function ProductJsonLd({
  product,
  siteConfig,
}: {
  product: ProductData
  siteConfig?: SiteConfig
}) {
  const schema = generateProductSchema({ product, siteConfig })
  return <JsonLd data={schema} />
}

/**
 * Organization JSON-LD Component
 */
export function OrganizationJsonLd({
  organization,
}: {
  organization: OrganizationData
}) {
  const schema = generateOrganizationSchema({ organization })
  return <JsonLd data={schema} />
}

/**
 * Breadcrumb JSON-LD Component
 */
export function BreadcrumbJsonLd({
  items,
  siteConfig,
}: {
  items: BreadcrumbItem[]
  siteConfig?: SiteConfig
}) {
  const schema = generateBreadcrumbSchema({ items, siteConfig })
  return <JsonLd data={schema} />
}

/**
 * Website JSON-LD Component
 */
export function WebsiteJsonLd({
  siteConfig,
}: {
  siteConfig?: SiteConfig
}) {
  const schema = generateWebsiteSchema({ siteConfig })
  return <JsonLd data={schema} />
}

/**
 * FAQ JSON-LD Component
 */
export function FAQJsonLd({
  items,
}: {
  items: FAQItem[]
}) {
  const schema = generateFAQSchema({ items })
  return <JsonLd data={schema} />
}

/**
 * Article JSON-LD Component
 */
export function ArticleJsonLd({
  article,
  siteConfig,
}: {
  article: ArticleData
  siteConfig?: SiteConfig
}) {
  const schema = generateArticleSchema({ article, siteConfig })
  return <JsonLd data={schema} />
}

/**
 * LocalBusiness JSON-LD Component
 */
export function LocalBusinessJsonLd({
  business,
}: {
  business: LocalBusinessData
}) {
  const schema = generateLocalBusinessSchema({ business })
  return <JsonLd data={schema} />
}

/**
 * ProductList JSON-LD Component
 */
export function ProductListJsonLd({
  products,
  listName,
  siteConfig,
}: {
  products: ProductData[]
  listName?: string
  siteConfig?: SiteConfig
}) {
  const schema = generateProductListSchema({ products, listName, siteConfig })
  return <JsonLd data={schema} />
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format price from pence to GBP string
 */
export function formatPrice(pence: number, currency = 'GBP'): string {
  const pounds = pence / 100
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(pounds)
}

/**
 * Get date one year from now (for priceValidUntil)
 */
function getNextYearDate(): string {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString().split('T')[0]
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3)}...`
}

/**
 * Generate canonical URL from path
 */
export function getCanonicalUrl(path: string, siteConfig = defaultSiteConfig): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${siteConfig.url}${cleanPath}`
}

/**
 * Strip HTML tags from string (for descriptions)
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

/**
 * Create Open Graph image URL with dimensions
 */
export function createOgImageUrl({
  title,
  description,
  baseUrl,
}: {
  title: string
  description?: string
  baseUrl?: string
}): string {
  const params = new URLSearchParams({
    title,
    ...(description && { description }),
  })
  const base = baseUrl || defaultSiteConfig.url
  return `${base}/api/og?${params.toString()}`
}

/**
 * Convert database Product to ProductData for SEO
 */
export function dbProductToSeoProduct(dbProduct: {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  images: string[] | null
  price_pence: number
  compare_at_price_pence: number | null
  sku: string | null
  brand: string | null
  stock_quantity: number
  avg_rating: number
  review_count: number
}, category?: string): ProductData {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    slug: dbProduct.slug,
    description: dbProduct.description || '',
    image: dbProduct.image_url || undefined,
    images: dbProduct.images || undefined,
    price: dbProduct.price_pence,
    compareAtPrice: dbProduct.compare_at_price_pence || undefined,
    sku: dbProduct.sku || undefined,
    brand: dbProduct.brand || undefined,
    category,
    availability: dbProduct.stock_quantity > 0 ? 'InStock' : 'OutOfStock',
    rating: dbProduct.avg_rating > 0 ? dbProduct.avg_rating : undefined,
    reviewCount: dbProduct.review_count > 0 ? dbProduct.review_count : undefined,
  }
}

// ============================================================================
// DEFAULT ORGANIZATION DATA (can be customized per site)
// ============================================================================

export const defaultOrganization: OrganizationData = {
  name: 'FreshMart',
  url: defaultSiteConfig.url,
  logo: '/images/logo.png',
  description: 'UK online grocery store delivering fresh quality products to your door.',
  email: 'support@freshmart.co.uk',
  phone: '+44 (0)800 123 4567',
  address: {
    streetAddress: '123 Fresh Street',
    addressLocality: 'London',
    addressRegion: 'Greater London',
    postalCode: 'EC1A 1BB',
    addressCountry: 'GB',
  },
  sameAs: [
    'https://www.facebook.com/freshmart',
    'https://twitter.com/freshmart',
    'https://www.instagram.com/freshmart',
    'https://www.linkedin.com/company/freshmart',
  ],
}
