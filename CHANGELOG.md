# Changelog

All notable changes to the UK Grocery Store project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-04-02

### Added
- Initial release of the UK Grocery Store marketplace platform.
- Solaris architecture patterns: Result types, branded types, state machine, service layer, and repository layer.
- Admin dashboard with full management capabilities (orders, products, users, coupons, vendors, hero slides, delivery slots, newsletters, support tickets, gift cards, invoices, chatbot, live support).
- Vendor marketplace with Stripe Connect onboarding, product management, order fulfillment, reviews, deals, coupons, payouts, and settings.
- Stripe Checkout Sessions for customer payments with webhook-driven order creation.
- Stripe Connect transfers with configurable commission rates for vendor payouts.
- Product management with soft-delete (`is_active`), vendor approval workflow, dietary/allergen flags, nutritional info, multi-image support, and full-text search.
- Order management with status tracking (pending, confirmed, processing, ready_for_delivery, out_for_delivery, delivered, cancelled), delivery slot scheduling, and guest order tracking.
- Product search with faceted filtering (category, brand, price range, dietary, stock, sale), sorting (relevance, price, rating, newest, popular), and pagination.
- Product reviews with verified purchase badges, star ratings, image uploads, helpful/not-helpful voting, and admin moderation workflow.
- Coupon system with percentage, fixed amount, and free shipping discount types; per-user limits, minimum order thresholds, vendor-scoped coupons, and RPC-based validation with row-level locking.
- Delivery slot booking with capacity management and configurable fees.
- Customer accounts with profile management, multiple delivery addresses, order history, wishlists, recently viewed products, stock alerts, and loyalty points.
- Flash deals with time-based pricing, quantity limits, and featured banners.
- Multibuy offers for promotional bundles.
- Hero slides for homepage banner management.
- Newsletter subscription system.
- Support ticket system with categories and admin resolution.
- Live chat and chatbot with intent management and FAQ support.
- Gift card creation and redemption.
- Referral system for customer acquisition.
- Loyalty points program.
- Notification preferences and delivery.
- Invoice generation and download.
- Abandoned cart recovery via cron automation.
- Stock alert notifications via cron.
- Audit logging for admin actions.
- Rate limiting on search, reviews, order tracking, and coupon validation endpoints.
- Input sanitization (XSS prevention) on all user-submitted text fields.
- Row-Level Security (RLS) policies on all database tables.
- Sentry error monitoring and tracking via instrumentation.
- Server-side caching with tag-based invalidation.
- Responsive storefront with TailwindCSS 4.
- Error boundaries for all route groups (shop, account, admin, vendor).
- Health check and monitoring endpoints.

[Unreleased]: https://github.com/baptistkevin-ctrl/uk-website/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/baptistkevin-ctrl/uk-website/releases/tag/v1.0.0
