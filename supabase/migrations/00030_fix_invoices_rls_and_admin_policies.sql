-- =====================================================================
-- Migration 00029: Fix invoices RLS + convert all stale role='admin'
-- policies to use public.is_admin() for super_admin support
-- =====================================================================
-- is_admin() was introduced in 00021 and returns TRUE for both
-- 'admin' and 'super_admin' roles. Many older migrations still use
-- the raw role = 'admin' check, which locks out super_admin users.
-- This migration fixes every remaining instance.
-- =====================================================================

BEGIN;

-- =====================================================================
-- PART 1: Enable RLS on invoices table and add policies
-- =====================================================================

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Users can view own invoices" ON public.invoices
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all invoices" ON public.invoices;
CREATE POLICY "Admins can manage all invoices" ON public.invoices
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Service role full access invoices" ON public.invoices;
CREATE POLICY "Service role full access invoices" ON public.invoices
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================================
-- PART 2: Fix ALL remaining stale role='admin' RLS policies
-- =====================================================================

-- -----------------------------------------------------------------
-- 00001_initial_schema.sql — products
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE USING (public.is_admin());

-- 00001 — categories
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (public.is_admin());

-- 00001 — product_categories
DROP POLICY IF EXISTS "Admins can manage product categories" ON public.product_categories;
CREATE POLICY "Admins can manage product categories" ON public.product_categories
  FOR ALL USING (public.is_admin());

-- 00001 — profiles (admin view all)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- 00001 — orders (admin view) — NOTE: "Admins can update orders" already fixed in 00026
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (public.is_admin());

-- 00001 — order_items — already fixed in 00026, skip
-- 00001 — delivery_slots — already fixed in 00026, skip

-- -----------------------------------------------------------------
-- 00002_hero_slides.sql
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage hero slides" ON public.hero_slides;
CREATE POLICY "Admins can manage hero slides" ON public.hero_slides
  FOR ALL USING (public.is_admin());

-- -----------------------------------------------------------------
-- 00003_store_settings.sql
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage settings" ON public.store_settings;
CREATE POLICY "Admins can manage settings" ON public.store_settings
  FOR ALL USING (public.is_admin());

-- -----------------------------------------------------------------
-- 00004_multibuy_offers.sql
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage offers" ON public.multibuy_offers;
CREATE POLICY "Admins can manage offers" ON public.multibuy_offers
  FOR ALL USING (public.is_admin());

-- -----------------------------------------------------------------
-- 00007_vendors_multivendor.sql
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage all vendors" ON public.vendors;
CREATE POLICY "Admins can manage all vendors" ON public.vendors
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage applications" ON public.vendor_applications;
CREATE POLICY "Admins can manage applications" ON public.vendor_applications
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all vendor orders" ON public.vendor_orders;
CREATE POLICY "Admins can manage all vendor orders" ON public.vendor_orders
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage payouts" ON public.vendor_payouts;
CREATE POLICY "Admins can manage payouts" ON public.vendor_payouts
  FOR ALL USING (public.is_admin());

-- -----------------------------------------------------------------
-- 00008_marketplace_features.sql
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.product_reviews;
CREATE POLICY "Admins can manage all reviews" ON public.product_reviews
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage deals" ON public.flash_deals;
CREATE POLICY "Admins can manage deals" ON public.flash_deals
  FOR ALL USING (public.is_admin());

-- -----------------------------------------------------------------
-- 00009_coupons_system.sql
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (public.is_admin());

-- -----------------------------------------------------------------
-- 00010_referral_system.sql
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage all referral codes" ON public.referral_codes;
CREATE POLICY "Admins can manage all referral codes" ON public.referral_codes
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all referrals" ON public.referrals;
CREATE POLICY "Admins can manage all referrals" ON public.referrals
  FOR ALL USING (public.is_admin());

-- credit_transactions already fixed in 00026, skip

-- -----------------------------------------------------------------
-- 00010a_profile_enhancements.sql
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- -----------------------------------------------------------------
-- 00011_loyalty_system.sql
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage loyalty tiers" ON public.loyalty_tiers;
CREATE POLICY "Admins can manage loyalty tiers" ON public.loyalty_tiers
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage loyalty accounts" ON public.loyalty_accounts;
CREATE POLICY "Admins can manage loyalty accounts" ON public.loyalty_accounts
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage points transactions" ON public.points_transactions;
CREATE POLICY "Admins can manage points transactions" ON public.points_transactions
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage redemption rules" ON public.points_redemption_rules;
CREATE POLICY "Admins can manage redemption rules" ON public.points_redemption_rules
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage earning rules" ON public.points_earning_rules;
CREATE POLICY "Admins can manage earning rules" ON public.points_earning_rules
  FOR ALL USING (public.is_admin());

-- -----------------------------------------------------------------
-- 00012_ticket_support_system.sql
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage tickets" ON public.support_tickets;
CREATE POLICY "Admins can manage tickets" ON public.support_tickets
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage ticket messages" ON public.ticket_messages;
CREATE POLICY "Admins can manage ticket messages" ON public.ticket_messages
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage categories" ON public.ticket_categories;
CREATE POLICY "Admins can manage categories" ON public.ticket_categories
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage canned responses" ON public.canned_responses;
CREATE POLICY "Admins can manage canned responses" ON public.canned_responses
  FOR ALL USING (public.is_admin());

-- This policy also grants vendor access, so preserve that
DROP POLICY IF EXISTS "Admins can view canned responses" ON public.canned_responses;
CREATE POLICY "Admins can view canned responses" ON public.canned_responses
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'vendor')
  );

DROP POLICY IF EXISTS "Admins can manage tags" ON public.ticket_tags;
CREATE POLICY "Admins can manage tags" ON public.ticket_tags
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage tag assignments" ON public.ticket_tag_assignments;
CREATE POLICY "Admins can manage tag assignments" ON public.ticket_tag_assignments
  FOR ALL USING (public.is_admin());

-- -----------------------------------------------------------------
-- 00013_newsletter_system.sql
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can manage subscribers" ON public.newsletter_subscribers
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.newsletter_campaigns;
CREATE POLICY "Admins can manage campaigns" ON public.newsletter_campaigns
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage templates" ON public.email_templates;
CREATE POLICY "Admins can manage templates" ON public.email_templates
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view send logs" ON public.campaign_send_logs;
CREATE POLICY "Admins can view send logs" ON public.campaign_send_logs
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage links" ON public.campaign_links;
CREATE POLICY "Admins can manage links" ON public.campaign_links
  FOR ALL USING (public.is_admin());

-- -----------------------------------------------------------------
-- 00014_notifications_system.sql
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications" ON public.notifications
  FOR ALL USING (public.is_admin());

-- -----------------------------------------------------------------
-- 00015_recently_viewed.sql
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all view history" ON public.product_view_history;
CREATE POLICY "Admins can view all view history" ON public.product_view_history
  FOR SELECT USING (public.is_admin());

-- -----------------------------------------------------------------
-- 00016_delivery_slots.sql
-- (The delivery_slots policy from 00001 was already fixed in 00026.
--  These are the additional tables from 00016.)
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage zones" ON public.delivery_zones;
CREATE POLICY "Admins can manage zones" ON public.delivery_zones
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage templates" ON public.delivery_slot_templates;
CREATE POLICY "Admins can manage templates" ON public.delivery_slot_templates
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage slots" ON public.delivery_slots;
CREATE POLICY "Admins can manage slots" ON public.delivery_slots
  FOR ALL USING (public.is_admin());

-- -----------------------------------------------------------------
-- 00017_live_chat.sql
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage quick replies" ON public.chat_quick_replies;
CREATE POLICY "Admins can manage quick replies" ON public.chat_quick_replies
  FOR ALL USING (public.is_admin());

-- -----------------------------------------------------------------
-- 00018_chatbot_system.sql
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage chatbot intents" ON public.chatbot_intents;
CREATE POLICY "Admins manage chatbot intents" ON public.chatbot_intents
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage training phrases" ON public.chatbot_training_phrases;
CREATE POLICY "Admins manage training phrases" ON public.chatbot_training_phrases
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage chatbot responses" ON public.chatbot_responses;
CREATE POLICY "Admins manage chatbot responses" ON public.chatbot_responses
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage chatbot FAQs" ON public.chatbot_faqs;
CREATE POLICY "Admins manage chatbot FAQs" ON public.chatbot_faqs
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage chatbot settings" ON public.chatbot_settings;
CREATE POLICY "Admins manage chatbot settings" ON public.chatbot_settings
  FOR ALL USING (public.is_admin());

-- -----------------------------------------------------------------
-- 00020_admin_features.sql — these use role IN ('admin','super_admin')
-- which works but is inconsistent. Normalise to is_admin().
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "site_settings_write" ON public.site_settings;
CREATE POLICY "site_settings_write" ON public.site_settings
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "audit_logs_admin_read" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_read" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "team_members_read" ON public.team_members;
CREATE POLICY "team_members_read" ON public.team_members
  FOR SELECT USING (public.is_admin());

-- team_members_write stays super_admin-only (intentional restriction)

DROP POLICY IF EXISTS "email_templates_read" ON public.email_templates;
CREATE POLICY "email_templates_read" ON public.email_templates
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "email_templates_write" ON public.email_templates;
CREATE POLICY "email_templates_write" ON public.email_templates
  FOR ALL USING (public.is_admin());

COMMIT;
