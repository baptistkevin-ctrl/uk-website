import { describe, it, expect } from 'vitest'
import {
  uuidSchema,
  emailSchema,
  phoneSchema,
  urlSchema,
  slugSchema,
  priceSchema,
  paginationSchema,
  searchQuerySchema,
  productCreateSchema,
  productUpdateSchema,
  orderItemSchema,
  orderCreateSchema,
  orderStatusSchema,
  orderUpdateSchema,
  reviewCreateSchema,
  reviewUpdateSchema,
  userProfileSchema,
  passwordSchema,
  authSchema,
  signUpSchema,
  categorySchema,
  vendorApplicationSchema,
  couponSchema,
  contactMessageSchema,
  newsletterSubscribeSchema,
  validateData,
  parseQueryParams,
  formatZodErrors,
} from '@/lib/validation/schemas'

describe('Validation Schemas', () => {
  describe('Common Validators', () => {
    describe('uuidSchema', () => {
      it('accepts valid UUIDs', () => {
        expect(uuidSchema.safeParse('123e4567-e89b-12d3-a456-426614174000').success).toBe(true)
        expect(uuidSchema.safeParse('00000000-0000-0000-0000-000000000000').success).toBe(true)
      })

      it('rejects invalid UUIDs', () => {
        expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false)
        expect(uuidSchema.safeParse('123').success).toBe(false)
        expect(uuidSchema.safeParse('').success).toBe(false)
      })
    })

    describe('emailSchema', () => {
      it('accepts valid emails and transforms to lowercase', () => {
        const result = emailSchema.safeParse('Test@Example.COM')
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe('test@example.com')
        }
      })

      it('transforms to lowercase', () => {
        // Note: Zod validates before transform, so the transform only applies after validation passes
        // Emails with leading/trailing spaces will fail email validation
        const result = emailSchema.safeParse('USER@EXAMPLE.COM')
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe('user@example.com')
        }
      })

      it('rejects invalid emails', () => {
        expect(emailSchema.safeParse('not-an-email').success).toBe(false)
        expect(emailSchema.safeParse('missing@domain').success).toBe(false)
        expect(emailSchema.safeParse('@nodomain.com').success).toBe(false)
      })

      it('rejects emails that are too long', () => {
        const longEmail = 'a'.repeat(250) + '@test.com'
        expect(emailSchema.safeParse(longEmail).success).toBe(false)
      })
    })

    describe('phoneSchema', () => {
      it('accepts valid phone numbers', () => {
        expect(phoneSchema.safeParse('+44 7911 123456').success).toBe(true)
        expect(phoneSchema.safeParse('07911123456').success).toBe(true)
        expect(phoneSchema.safeParse('(020) 7946 0958').success).toBe(true)
      })

      it('accepts empty strings and optional values', () => {
        expect(phoneSchema.safeParse('').success).toBe(true)
        expect(phoneSchema.safeParse(undefined).success).toBe(true)
      })

      it('rejects invalid phone numbers', () => {
        expect(phoneSchema.safeParse('abc').success).toBe(false)
        expect(phoneSchema.safeParse('phone: 123').success).toBe(false)
      })
    })

    describe('urlSchema', () => {
      it('accepts valid URLs', () => {
        expect(urlSchema.safeParse('https://example.com').success).toBe(true)
        expect(urlSchema.safeParse('http://test.co.uk/path').success).toBe(true)
      })

      it('accepts empty strings and optional values', () => {
        expect(urlSchema.safeParse('').success).toBe(true)
        expect(urlSchema.safeParse(undefined).success).toBe(true)
      })

      it('rejects invalid URLs', () => {
        expect(urlSchema.safeParse('not-a-url').success).toBe(false)
        expect(urlSchema.safeParse('://missing-protocol.com').success).toBe(false)
        // Note: Zod's url() accepts any valid URL format including ftp://
      })
    })

    describe('slugSchema', () => {
      it('accepts valid slugs', () => {
        expect(slugSchema.safeParse('product-name').success).toBe(true)
        expect(slugSchema.safeParse('category123').success).toBe(true)
        expect(slugSchema.safeParse('a-very-long-slug-name').success).toBe(true)
      })

      it('rejects invalid slugs', () => {
        expect(slugSchema.safeParse('UPPERCASE').success).toBe(false)
        expect(slugSchema.safeParse('has spaces').success).toBe(false)
        expect(slugSchema.safeParse('special@chars').success).toBe(false)
        expect(slugSchema.safeParse('a').success).toBe(false) // too short
      })
    })

    describe('priceSchema', () => {
      it('accepts valid prices in pence', () => {
        expect(priceSchema.safeParse(0).success).toBe(true)
        expect(priceSchema.safeParse(999).success).toBe(true)
        expect(priceSchema.safeParse(10000).success).toBe(true)
      })

      it('rejects negative prices', () => {
        expect(priceSchema.safeParse(-100).success).toBe(false)
      })

      it('rejects non-integer prices', () => {
        expect(priceSchema.safeParse(9.99).success).toBe(false)
      })

      it('rejects prices that are too large', () => {
        expect(priceSchema.safeParse(9999999999).success).toBe(false)
      })
    })
  })

  describe('Pagination', () => {
    describe('paginationSchema', () => {
      it('accepts valid pagination params', () => {
        const result = paginationSchema.safeParse({ page: 1, limit: 20 })
        expect(result.success).toBe(true)
      })

      it('coerces string values', () => {
        const result = paginationSchema.safeParse({ page: '5', limit: '10' })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.page).toBe(5)
          expect(result.data.limit).toBe(10)
        }
      })

      it('applies default values', () => {
        const result = paginationSchema.safeParse({})
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.page).toBe(1)
          expect(result.data.limit).toBe(20)
          expect(result.data.order).toBe('desc')
        }
      })

      it('rejects invalid page numbers', () => {
        expect(paginationSchema.safeParse({ page: 0 }).success).toBe(false)
        expect(paginationSchema.safeParse({ page: -1 }).success).toBe(false)
        expect(paginationSchema.safeParse({ page: 1001 }).success).toBe(false)
      })

      it('rejects invalid limit values', () => {
        expect(paginationSchema.safeParse({ limit: 0 }).success).toBe(false)
        expect(paginationSchema.safeParse({ limit: 101 }).success).toBe(false)
      })
    })
  })

  describe('Product Schemas', () => {
    describe('productCreateSchema', () => {
      const validProduct = {
        name: 'Organic Bananas',
        slug: 'organic-bananas',
        price_pence: 150,
        stock_quantity: 100,
      }

      it('accepts valid product data', () => {
        const result = productCreateSchema.safeParse(validProduct)
        expect(result.success).toBe(true)
      })

      it('rejects missing required fields', () => {
        expect(productCreateSchema.safeParse({}).success).toBe(false)
        expect(productCreateSchema.safeParse({ name: 'Test' }).success).toBe(false)
      })

      it('validates name length', () => {
        expect(productCreateSchema.safeParse({ ...validProduct, name: '' }).success).toBe(false)
        expect(productCreateSchema.safeParse({ ...validProduct, name: 'a'.repeat(201) }).success).toBe(false)
      })

      it('validates price constraints', () => {
        expect(productCreateSchema.safeParse({ ...validProduct, price_pence: -100 }).success).toBe(false)
        expect(productCreateSchema.safeParse({ ...validProduct, price_pence: 3.99 }).success).toBe(false)
      })

      it('accepts optional dietary preferences', () => {
        const result = productCreateSchema.safeParse({
          ...validProduct,
          is_vegan: true,
          is_vegetarian: true,
          is_gluten_free: false,
          is_organic: true,
        })
        expect(result.success).toBe(true)
      })

      it('validates images array', () => {
        const result = productCreateSchema.safeParse({
          ...validProduct,
          images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
        })
        expect(result.success).toBe(true)
      })
    })

    describe('productUpdateSchema', () => {
      it('allows partial updates', () => {
        expect(productUpdateSchema.safeParse({ name: 'New Name' }).success).toBe(true)
        expect(productUpdateSchema.safeParse({ price_pence: 299 }).success).toBe(true)
        expect(productUpdateSchema.safeParse({}).success).toBe(true)
      })
    })
  })

  describe('Order Schemas', () => {
    describe('orderItemSchema', () => {
      it('accepts valid order items', () => {
        const result = orderItemSchema.safeParse({
          product_id: '123e4567-e89b-12d3-a456-426614174000',
          quantity: 2,
          price_pence: 399,
          name: 'Product Name',
        })
        expect(result.success).toBe(true)
      })

      it('validates quantity bounds', () => {
        const baseItem = {
          product_id: '123e4567-e89b-12d3-a456-426614174000',
          price_pence: 399,
          name: 'Product',
        }
        expect(orderItemSchema.safeParse({ ...baseItem, quantity: 0 }).success).toBe(false)
        expect(orderItemSchema.safeParse({ ...baseItem, quantity: 100 }).success).toBe(false)
        expect(orderItemSchema.safeParse({ ...baseItem, quantity: 50 }).success).toBe(true)
      })
    })

    describe('orderCreateSchema', () => {
      const validOrder = {
        items: [{
          product_id: '123e4567-e89b-12d3-a456-426614174000',
          quantity: 1,
          price_pence: 399,
          name: 'Test Product',
        }],
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        delivery_address: '123 Test Street, London',
        delivery_city: 'London',
        delivery_postcode: 'SW1A 1AA',
        subtotal_pence: 399,
        total_pence: 399,
      }

      it('accepts valid order data', () => {
        const result = orderCreateSchema.safeParse(validOrder)
        expect(result.success).toBe(true)
      })

      it('requires at least one item', () => {
        expect(orderCreateSchema.safeParse({ ...validOrder, items: [] }).success).toBe(false)
      })

      it('validates customer info', () => {
        expect(orderCreateSchema.safeParse({ ...validOrder, customer_name: 'J' }).success).toBe(false)
        expect(orderCreateSchema.safeParse({ ...validOrder, customer_email: 'invalid' }).success).toBe(false)
      })

      it('validates address fields', () => {
        expect(orderCreateSchema.safeParse({ ...validOrder, delivery_address: 'short' }).success).toBe(false)
        expect(orderCreateSchema.safeParse({ ...validOrder, delivery_city: 'X' }).success).toBe(false)
      })
    })

    describe('orderStatusSchema', () => {
      it('accepts valid status values', () => {
        const validStatuses = ['pending', 'confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'refunded']
        validStatuses.forEach(status => {
          expect(orderStatusSchema.safeParse(status).success).toBe(true)
        })
      })

      it('rejects invalid status values', () => {
        expect(orderStatusSchema.safeParse('invalid').success).toBe(false)
        expect(orderStatusSchema.safeParse('PENDING').success).toBe(false)
      })
    })
  })

  describe('Review Schemas', () => {
    describe('reviewCreateSchema', () => {
      it('accepts valid review data', () => {
        const result = reviewCreateSchema.safeParse({
          product_id: '123e4567-e89b-12d3-a456-426614174000',
          rating: 5,
          title: 'Great product!',
          content: 'I really enjoyed this product.',
        })
        expect(result.success).toBe(true)
      })

      it('validates rating bounds', () => {
        const baseReview = {
          product_id: '123e4567-e89b-12d3-a456-426614174000',
        }
        expect(reviewCreateSchema.safeParse({ ...baseReview, rating: 0 }).success).toBe(false)
        expect(reviewCreateSchema.safeParse({ ...baseReview, rating: 6 }).success).toBe(false)
        expect(reviewCreateSchema.safeParse({ ...baseReview, rating: 3 }).success).toBe(true)
      })

      it('allows optional title and content', () => {
        const result = reviewCreateSchema.safeParse({
          product_id: '123e4567-e89b-12d3-a456-426614174000',
          rating: 4,
        })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('User Schemas', () => {
    describe('passwordSchema', () => {
      it('accepts valid passwords', () => {
        expect(passwordSchema.safeParse('SecurePass1').success).toBe(true)
        expect(passwordSchema.safeParse('MyP@ssw0rd').success).toBe(true)
      })

      it('requires minimum 8 characters', () => {
        expect(passwordSchema.safeParse('Short1').success).toBe(false)
      })

      it('requires uppercase letter', () => {
        expect(passwordSchema.safeParse('lowercase1').success).toBe(false)
      })

      it('requires lowercase letter', () => {
        expect(passwordSchema.safeParse('UPPERCASE1').success).toBe(false)
      })

      it('requires a number', () => {
        expect(passwordSchema.safeParse('NoNumberHere').success).toBe(false)
      })
    })

    describe('authSchema', () => {
      it('accepts valid auth credentials', () => {
        const result = authSchema.safeParse({
          email: 'test@example.com',
          password: 'SecurePass1',
        })
        expect(result.success).toBe(true)
      })
    })

    describe('signUpSchema', () => {
      it('requires full_name in addition to auth fields', () => {
        const result = signUpSchema.safeParse({
          email: 'test@example.com',
          password: 'SecurePass1',
          full_name: 'John Doe',
        })
        expect(result.success).toBe(true)
      })

      it('rejects short names', () => {
        const result = signUpSchema.safeParse({
          email: 'test@example.com',
          password: 'SecurePass1',
          full_name: 'J',
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('Category Schema', () => {
    it('accepts valid category data', () => {
      const result = categorySchema.safeParse({
        name: 'Fresh Produce',
        slug: 'fresh-produce',
      })
      expect(result.success).toBe(true)
    })

    it('allows nullable parent_id', () => {
      const result = categorySchema.safeParse({
        name: 'Subcategory',
        slug: 'subcategory',
        parent_id: null,
      })
      expect(result.success).toBe(true)
    })

    it('validates display_order', () => {
      const result = categorySchema.safeParse({
        name: 'Test',
        slug: 'test',
        display_order: -1,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('Vendor Application Schema', () => {
    const validApplication = {
      business_name: 'Fresh Farm Produce',
      business_type: 'Farm',
      contact_name: 'John Smith',
      contact_email: 'john@freshfarm.co.uk',
      contact_phone: '+44 7911 123456',
      address: '123 Farm Road',
      city: 'London',
      postcode: 'SW1A 1AA',
    }

    it('accepts valid vendor applications', () => {
      const result = vendorApplicationSchema.safeParse(validApplication)
      expect(result.success).toBe(true)
    })

    it('validates required fields', () => {
      expect(vendorApplicationSchema.safeParse({}).success).toBe(false)
    })
  })

  describe('Coupon Schema', () => {
    const validCoupon = {
      code: 'SAVE10',
      discount_type: 'percentage',
      discount_value: 10,
    }

    it('accepts valid coupon data', () => {
      const result = couponSchema.safeParse(validCoupon)
      expect(result.success).toBe(true)
    })

    it('transforms code to uppercase', () => {
      const result = couponSchema.safeParse({ ...validCoupon, code: 'save10' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.code).toBe('SAVE10')
      }
    })

    it('validates discount_type enum', () => {
      expect(couponSchema.safeParse({ ...validCoupon, discount_type: 'invalid' }).success).toBe(false)
    })
  })

  describe('Contact Message Schema', () => {
    it('accepts valid contact messages', () => {
      const result = contactMessageSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Question about delivery',
        message: 'I have a question about my order delivery times.',
      })
      expect(result.success).toBe(true)
    })

    it('validates minimum lengths', () => {
      expect(contactMessageSchema.safeParse({
        name: 'J',
        email: 'j@e.co',
        subject: 'Hi',
        message: 'Short',
      }).success).toBe(false)
    })
  })

  describe('Newsletter Schema', () => {
    it('accepts valid subscription', () => {
      const result = newsletterSubscribeSchema.safeParse({
        email: 'subscriber@example.com',
      })
      expect(result.success).toBe(true)
    })

    it('allows optional name', () => {
      const result = newsletterSubscribeSchema.safeParse({
        email: 'subscriber@example.com',
        name: 'John',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('Helper Functions', () => {
    describe('validateData', () => {
      it('returns success with data for valid input', () => {
        const result = validateData(emailSchema, 'test@example.com')
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe('test@example.com')
        }
      })

      it('returns errors for invalid input', () => {
        const result = validateData(emailSchema, 'invalid')
        expect(result.success).toBe(false)
      })
    })

    describe('parseQueryParams', () => {
      it('parses valid query params', () => {
        const params = new URLSearchParams('page=2&limit=10&sort=name&order=asc')
        const result = parseQueryParams(params)
        expect(result.page).toBe(2)
        expect(result.limit).toBe(10)
        expect(result.sort).toBe('name')
        expect(result.order).toBe('asc')
      })

      it('returns defaults for invalid params', () => {
        const params = new URLSearchParams('page=invalid')
        const result = parseQueryParams(params)
        expect(result.page).toBe(1)
        expect(result.limit).toBe(20)
      })
    })

    describe('formatZodErrors', () => {
      it('formats Zod errors correctly', () => {
        const result = emailSchema.safeParse('invalid')
        if (!result.success) {
          const formatted = formatZodErrors(result.error)
          expect(formatted).toHaveProperty('root')
        }
      })
    })
  })
})
