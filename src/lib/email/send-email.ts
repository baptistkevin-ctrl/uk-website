// Email sending utility for UK Grocery Store
// This module provides a simple interface for sending emails
// Can be easily swapped to use different email providers (Resend, SendGrid, etc.)

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// Default sender configuration
const DEFAULT_FROM = 'UK Grocery Store <noreply@ukgrocerystore.com>'
const DEFAULT_REPLY_TO = 'support@ukgrocerystore.com'

/**
 * Send an email using the configured email provider
 *
 * Currently configured for development (logs to console)
 * In production, uncomment the provider section you want to use
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const { to, subject, html, from = DEFAULT_FROM, replyTo = DEFAULT_REPLY_TO } = options

  // Development mode - log email details
  if (process.env.NODE_ENV === 'development') {
    console.log('=== EMAIL SENT (DEV MODE) ===')
    console.log('To:', Array.isArray(to) ? to.join(', ') : to)
    console.log('From:', from)
    console.log('Subject:', subject)
    console.log('Reply-To:', replyTo)
    console.log('HTML Length:', html.length, 'characters')
    console.log('=============================')

    return {
      success: true,
      messageId: `dev-${Date.now()}`
    }
  }

  try {
    // ============================================
    // RESEND PROVIDER (Recommended)
    // Uncomment to use Resend (https://resend.com)
    // npm install resend
    // ============================================
    /*
    const { Resend } = require('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      reply_to: replyTo,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
    */

    // ============================================
    // SENDGRID PROVIDER
    // Uncomment to use SendGrid (https://sendgrid.com)
    // npm install @sendgrid/mail
    // ============================================
    /*
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)

    const msg = {
      to: Array.isArray(to) ? to : [to],
      from,
      subject,
      html,
      replyTo,
    }

    const result = await sgMail.send(msg)
    return { success: true, messageId: result[0]?.headers['x-message-id'] }
    */

    // ============================================
    // NODEMAILER PROVIDER (SMTP)
    // Uncomment to use Nodemailer with SMTP
    // npm install nodemailer
    // ============================================
    /*
    const nodemailer = require('nodemailer')

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const info = await transporter.sendMail({
      from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      replyTo,
    })

    return { success: true, messageId: info.messageId }
    */

    // Default: Return success for now (emails not actually sent)
    console.warn('Email provider not configured. Email not sent.')
    return { success: true, messageId: `mock-${Date.now()}` }
  } catch (error) {
    console.error('Failed to send email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Send a batch of emails
 */
export async function sendBatchEmails(
  emails: EmailOptions[]
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = await Promise.all(emails.map(sendEmail))

  const sent = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const errors = results
    .filter(r => !r.success && r.error)
    .map(r => r.error!)

  return { sent, failed, errors }
}

// Pre-built email functions using templates
import { emailTemplates } from './templates'

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(email: string, customerName: string): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: 'Welcome to UK Grocery Store!',
    html: emailTemplates.welcome(customerName),
  })
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  email: string,
  order: Parameters<typeof emailTemplates.orderConfirmation>[0]
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: `Order Confirmed - #${order.order_number}`,
    html: emailTemplates.orderConfirmation(order),
  })
}

/**
 * Send shipping notification email
 */
export async function sendShippingNotificationEmail(
  email: string,
  customerName: string,
  orderNumber: string,
  trackingNumber: string,
  trackingUrl: string,
  estimatedDelivery: string
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: `Your Order #${orderNumber} Has Shipped!`,
    html: emailTemplates.shippingNotification(
      customerName,
      orderNumber,
      trackingNumber,
      trackingUrl,
      estimatedDelivery
    ),
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  customerName: string,
  resetUrl: string
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: 'Reset Your Password - UK Grocery Store',
    html: emailTemplates.passwordReset(customerName, resetUrl),
  })
}

/**
 * Send order status update email
 */
export async function sendOrderStatusUpdateEmail(
  email: string,
  customerName: string,
  orderNumber: string,
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled',
  message?: string
): Promise<EmailResult> {
  const statusSubjects = {
    processing: 'Your Order is Being Prepared',
    shipped: 'Your Order Has Shipped',
    delivered: 'Your Order Has Been Delivered',
    cancelled: 'Your Order Has Been Cancelled',
  }

  return sendEmail({
    to: email,
    subject: `${statusSubjects[status]} - #${orderNumber}`,
    html: emailTemplates.orderStatusUpdate(customerName, orderNumber, status, message),
  })
}

/**
 * Send review request email
 */
export async function sendReviewRequestEmail(
  email: string,
  customerName: string,
  orderNumber: string,
  productName: string,
  productImage: string | null,
  reviewUrl: string
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: 'How was your order? Leave a review!',
    html: emailTemplates.reviewRequest(
      customerName,
      orderNumber,
      productName,
      productImage,
      reviewUrl
    ),
  })
}

/**
 * Send vendor approval email
 */
export async function sendVendorApprovedEmail(
  email: string,
  vendorName: string,
  businessName: string,
  dashboardUrl: string
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: 'Your Vendor Application Has Been Approved!',
    html: emailTemplates.vendorApproved(vendorName, businessName, dashboardUrl),
  })
}

/**
 * Send back in stock notification email
 */
export async function sendBackInStockEmail(
  email: string,
  productName: string,
  productImage: string | null,
  productSlug: string,
  price: number
): Promise<EmailResult> {
  const productUrl = `https://ukgrocerystore.com/products/${productSlug}`
  return sendEmail({
    to: email,
    subject: `Good news! ${productName} is back in stock`,
    html: emailTemplates.backInStock(productName, productImage, productUrl, price),
  })
}

/**
 * Send low stock alert to admin
 */
export async function sendLowStockAlertEmail(
  email: string | string[],
  products: Array<{
    name: string
    stock_quantity: number
    low_stock_threshold: number
    slug: string
  }>
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: `Low Stock Alert: ${products.length} product${products.length > 1 ? 's' : ''} need restocking`,
    html: emailTemplates.lowStockAlert(products),
  })
}
