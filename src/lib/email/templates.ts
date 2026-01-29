// Email templates for UK Grocery Store
// These templates return HTML strings that can be sent via any email provider

interface OrderItem {
  name: string
  quantity: number
  price_pence: number
  image_url?: string | null
}

interface OrderDetails {
  order_number: string
  customer_name: string
  customer_email: string
  items: OrderItem[]
  subtotal_pence: number
  delivery_pence: number
  discount_pence?: number
  total_pence: number
  delivery_address: {
    line1: string
    line2?: string
    city: string
    postcode: string
  }
  estimated_delivery?: string
}

// Helper function to format price
const formatPrice = (pence: number) => {
  return `£${(pence / 100).toFixed(2)}`
}

// Base email wrapper with consistent styling
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UK Grocery Store</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                UK Grocery Store
              </h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 12px 0; font-size: 14px; color: #64748b;">
                      Need help? <a href="https://ukgrocerystore.com/help" style="color: #059669; text-decoration: none;">Visit our Help Center</a>
                    </p>
                    <p style="margin: 0 0 12px 0; font-size: 12px; color: #94a3b8;">
                      UK Grocery Store Ltd, 123 Commerce Street, London, EC1A 1BB
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                      <a href="https://ukgrocerystore.com/unsubscribe" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a>
                      &nbsp;|&nbsp;
                      <a href="https://ukgrocerystore.com/privacy" style="color: #94a3b8; text-decoration: underline;">Privacy Policy</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

// Button component
const button = (text: string, url: string, color: 'primary' | 'secondary' = 'primary') => {
  const bgColor = color === 'primary' ? '#059669' : '#f8fafc'
  const textColor = color === 'primary' ? '#ffffff' : '#334155'
  const border = color === 'secondary' ? '1px solid #e2e8f0' : 'none'

  return `
    <a href="${url}" style="display: inline-block; padding: 14px 28px; background-color: ${bgColor}; color: ${textColor}; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 8px; border: ${border};">
      ${text}
    </a>
  `
}

// Order items table
const orderItemsTable = (items: OrderItem[]) => `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin: 24px 0;">
    ${items.map(item => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td width="60" style="vertical-align: top;">
                ${item.image_url
                  ? `<img src="${item.image_url}" alt="${item.name}" width="48" height="48" style="border-radius: 8px; object-fit: cover;">`
                  : `<div style="width: 48px; height: 48px; background-color: #f1f5f9; border-radius: 8px;"></div>`
                }
              </td>
              <td style="padding-left: 12px; vertical-align: top;">
                <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500; color: #1e293b;">${item.name}</p>
                <p style="margin: 0; font-size: 13px; color: #64748b;">Qty: ${item.quantity}</p>
              </td>
              <td width="80" style="text-align: right; vertical-align: top;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">${formatPrice(item.price_pence * item.quantity)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `).join('')}
  </table>
`

// 1. Welcome Email
export const welcomeEmail = (customerName: string) => emailWrapper(`
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="width: 64px; height: 64px; background-color: #d1fae5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
      <span style="font-size: 32px;">👋</span>
    </div>
    <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #1e293b;">Welcome to UK Grocery Store!</h2>
    <p style="margin: 0; font-size: 16px; color: #64748b;">Hi ${customerName}, we're excited to have you with us.</p>
  </div>

  <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
    Thank you for creating an account. You now have access to:
  </p>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 24px;">
    <tr>
      <td style="padding: 16px; background-color: #f0fdf4; border-radius: 12px; margin-bottom: 12px;">
        <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #166534;">🛒 Easy Shopping</p>
        <p style="margin: 0; font-size: 13px; color: #15803d;">Browse thousands of quality grocery products</p>
      </td>
    </tr>
    <tr><td height="12"></td></tr>
    <tr>
      <td style="padding: 16px; background-color: #eff6ff; border-radius: 12px; margin-bottom: 12px;">
        <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #1e40af;">📦 Order Tracking</p>
        <p style="margin: 0; font-size: 13px; color: #1d4ed8;">Track your orders in real-time</p>
      </td>
    </tr>
    <tr><td height="12"></td></tr>
    <tr>
      <td style="padding: 16px; background-color: #fef3c7; border-radius: 12px;">
        <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #92400e;">💰 Exclusive Deals</p>
        <p style="margin: 0; font-size: 13px; color: #b45309;">Get access to member-only discounts</p>
      </td>
    </tr>
  </table>

  <div style="text-align: center;">
    ${button('Start Shopping', 'https://ukgrocerystore.com')}
  </div>
`)

// 2. Order Confirmation Email
export const orderConfirmationEmail = (order: OrderDetails) => emailWrapper(`
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="width: 64px; height: 64px; background-color: #d1fae5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
      <span style="font-size: 32px;">✓</span>
    </div>
    <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #1e293b;">Order Confirmed!</h2>
    <p style="margin: 0; font-size: 16px; color: #64748b;">Thank you for your order, ${order.customer_name}</p>
  </div>

  <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td>
          <p style="margin: 0; font-size: 13px; color: #64748b;">Order Number</p>
          <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 700; color: #1e293b; font-family: monospace;">${order.order_number}</p>
        </td>
        <td style="text-align: right;">
          <p style="margin: 0; font-size: 13px; color: #64748b;">Order Date</p>
          <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 500; color: #1e293b;">${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </td>
      </tr>
    </table>
  </div>

  <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #1e293b;">Order Summary</h3>

  ${orderItemsTable(order.items)}

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 24px;">
    <tr>
      <td style="padding: 8px 0; font-size: 14px; color: #64748b;">Subtotal</td>
      <td style="padding: 8px 0; text-align: right; font-size: 14px; color: #1e293b;">${formatPrice(order.subtotal_pence)}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-size: 14px; color: #64748b;">Delivery</td>
      <td style="padding: 8px 0; text-align: right; font-size: 14px; color: #1e293b;">${order.delivery_pence === 0 ? 'FREE' : formatPrice(order.delivery_pence)}</td>
    </tr>
    ${order.discount_pence ? `
    <tr>
      <td style="padding: 8px 0; font-size: 14px; color: #059669;">Discount</td>
      <td style="padding: 8px 0; text-align: right; font-size: 14px; color: #059669;">-${formatPrice(order.discount_pence)}</td>
    </tr>
    ` : ''}
    <tr>
      <td style="padding: 16px 0 8px 0; font-size: 16px; font-weight: 700; color: #1e293b; border-top: 2px solid #e2e8f0;">Total</td>
      <td style="padding: 16px 0 8px 0; text-align: right; font-size: 18px; font-weight: 700; color: #059669; border-top: 2px solid #e2e8f0;">${formatPrice(order.total_pence)}</td>
    </tr>
  </table>

  <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1e293b;">Delivery Address</h3>
  <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #475569;">
      ${order.delivery_address.line1}<br>
      ${order.delivery_address.line2 ? `${order.delivery_address.line2}<br>` : ''}
      ${order.delivery_address.city}<br>
      ${order.delivery_address.postcode}
    </p>
    ${order.estimated_delivery ? `
      <p style="margin: 12px 0 0 0; font-size: 13px; color: #059669; font-weight: 500;">
        Estimated delivery: ${order.estimated_delivery}
      </p>
    ` : ''}
  </div>

  <div style="text-align: center;">
    ${button('Track Your Order', `https://ukgrocerystore.com/account/orders/${order.order_number}`)}
  </div>
`)

// 3. Shipping Notification Email
export const shippingNotificationEmail = (
  customerName: string,
  orderNumber: string,
  trackingNumber: string,
  trackingUrl: string,
  estimatedDelivery: string
) => emailWrapper(`
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="width: 64px; height: 64px; background-color: #dbeafe; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
      <span style="font-size: 32px;">📦</span>
    </div>
    <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #1e293b;">Your Order is On Its Way!</h2>
    <p style="margin: 0; font-size: 16px; color: #64748b;">Great news, ${customerName}! Your order has been shipped.</p>
  </div>

  <div style="background-color: #eff6ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td>
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;">Order Number</p>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1e293b; font-family: monospace;">${orderNumber}</p>
        </td>
      </tr>
      <tr><td height="16"></td></tr>
      <tr>
        <td>
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;">Tracking Number</p>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1d4ed8; font-family: monospace;">${trackingNumber}</p>
        </td>
      </tr>
      <tr><td height="16"></td></tr>
      <tr>
        <td>
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;">Estimated Delivery</p>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #059669;">${estimatedDelivery}</p>
        </td>
      </tr>
    </table>
  </div>

  <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
    You can track your package using the button below. We'll send you another email when your order is delivered.
  </p>

  <div style="text-align: center;">
    ${button('Track Package', trackingUrl)}
  </div>
`)

// 4. Password Reset Email
export const passwordResetEmail = (customerName: string, resetUrl: string) => emailWrapper(`
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="width: 64px; height: 64px; background-color: #fef3c7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
      <span style="font-size: 32px;">🔐</span>
    </div>
    <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #1e293b;">Reset Your Password</h2>
    <p style="margin: 0; font-size: 16px; color: #64748b;">Hi ${customerName}, we received a password reset request.</p>
  </div>

  <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
    Click the button below to reset your password. This link will expire in 1 hour for security reasons.
  </p>

  <div style="text-align: center; margin-bottom: 24px;">
    ${button('Reset Password', resetUrl)}
  </div>

  <div style="background-color: #fef2f2; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 13px; color: #991b1b;">
      <strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email or contact support if you have concerns.
    </p>
  </div>

  <p style="margin: 0; font-size: 13px; color: #94a3b8; text-align: center;">
    This link will expire in 1 hour.
  </p>
`)

// 5. Order Status Update Email
export const orderStatusUpdateEmail = (
  customerName: string,
  orderNumber: string,
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled',
  message?: string
) => {
  const statusConfig = {
    processing: {
      icon: '⚙️',
      title: 'Order Being Prepared',
      description: 'Your order is being carefully prepared and packed.',
      color: '#3b82f6',
      bgColor: '#dbeafe'
    },
    shipped: {
      icon: '🚚',
      title: 'Order Shipped',
      description: 'Your order is on its way to you.',
      color: '#8b5cf6',
      bgColor: '#ede9fe'
    },
    delivered: {
      icon: '✅',
      title: 'Order Delivered',
      description: 'Your order has been successfully delivered.',
      color: '#059669',
      bgColor: '#d1fae5'
    },
    cancelled: {
      icon: '❌',
      title: 'Order Cancelled',
      description: 'Your order has been cancelled.',
      color: '#dc2626',
      bgColor: '#fee2e2'
    }
  }

  const config = statusConfig[status]

  return emailWrapper(`
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background-color: ${config.bgColor}; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <span style="font-size: 32px;">${config.icon}</span>
      </div>
      <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #1e293b;">${config.title}</h2>
      <p style="margin: 0; font-size: 16px; color: #64748b;">${config.description}</p>
    </div>

    <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;">Order Number</p>
      <p style="margin: 0; font-size: 18px; font-weight: 700; color: #1e293b; font-family: monospace;">${orderNumber}</p>
    </div>

    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
      Hi ${customerName}, ${message || config.description}
    </p>

    <div style="text-align: center;">
      ${button('View Order Details', `https://ukgrocerystore.com/account/orders/${orderNumber}`)}
    </div>
  `)
}

// 6. Review Request Email
export const reviewRequestEmail = (
  customerName: string,
  orderNumber: string,
  productName: string,
  productImage: string | null,
  reviewUrl: string
) => emailWrapper(`
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="width: 64px; height: 64px; background-color: #fef3c7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
      <span style="font-size: 32px;">⭐</span>
    </div>
    <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #1e293b;">How Was Your Order?</h2>
    <p style="margin: 0; font-size: 16px; color: #64748b;">Hi ${customerName}, we'd love to hear your feedback!</p>
  </div>

  <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td width="80" style="vertical-align: top;">
          ${productImage
            ? `<img src="${productImage}" alt="${productName}" width="64" height="64" style="border-radius: 8px; object-fit: cover;">`
            : `<div style="width: 64px; height: 64px; background-color: #e2e8f0; border-radius: 8px;"></div>`
          }
        </td>
        <td style="padding-left: 16px; vertical-align: top;">
          <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #1e293b;">${productName}</p>
          <p style="margin: 0; font-size: 13px; color: #64748b;">Order #${orderNumber}</p>
        </td>
      </tr>
    </table>
  </div>

  <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
    Your review helps other customers make informed decisions and helps our vendors improve their products.
  </p>

  <div style="text-align: center; margin-bottom: 24px;">
    <p style="margin: 0 0 12px 0; font-size: 32px;">
      ⭐ ⭐ ⭐ ⭐ ⭐
    </p>
    ${button('Write a Review', reviewUrl)}
  </div>

  <p style="margin: 0; font-size: 13px; color: #94a3b8; text-align: center;">
    It only takes a minute and helps our community!
  </p>
`)

// 7. Vendor Application Approved Email
export const vendorApprovedEmail = (vendorName: string, businessName: string, dashboardUrl: string) => emailWrapper(`
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="width: 64px; height: 64px; background-color: #d1fae5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
      <span style="font-size: 32px;">🎉</span>
    </div>
    <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #1e293b;">Welcome to UK Grocery Store!</h2>
    <p style="margin: 0; font-size: 16px; color: #64748b;">Your vendor application has been approved.</p>
  </div>

  <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
    Congratulations ${vendorName}! We're excited to welcome <strong>${businessName}</strong> to our marketplace.
  </p>

  <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #1e293b;">Next Steps</h3>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 24px;">
    <tr>
      <td style="padding: 16px; background-color: #f0fdf4; border-radius: 12px; margin-bottom: 12px;">
        <p style="margin: 0; font-size: 14px; color: #166534;">
          <strong>1.</strong> Set up your store profile and add your logo
        </p>
      </td>
    </tr>
    <tr><td height="12"></td></tr>
    <tr>
      <td style="padding: 16px; background-color: #f0fdf4; border-radius: 12px; margin-bottom: 12px;">
        <p style="margin: 0; font-size: 14px; color: #166534;">
          <strong>2.</strong> Add your products with descriptions and images
        </p>
      </td>
    </tr>
    <tr><td height="12"></td></tr>
    <tr>
      <td style="padding: 16px; background-color: #f0fdf4; border-radius: 12px;">
        <p style="margin: 0; font-size: 14px; color: #166534;">
          <strong>3.</strong> Set up your payment details to receive earnings
        </p>
      </td>
    </tr>
  </table>

  <div style="text-align: center;">
    ${button('Go to Vendor Dashboard', dashboardUrl)}
  </div>
`)

// 8. Back In Stock Alert Email
export const backInStockEmail = (
  productName: string,
  productImage: string | null,
  productUrl: string,
  price: number
) => emailWrapper(`
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="width: 64px; height: 64px; background-color: #d1fae5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
      <span style="font-size: 32px;">🔔</span>
    </div>
    <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #1e293b;">Good News!</h2>
    <p style="margin: 0; font-size: 16px; color: #64748b;">An item you wanted is back in stock.</p>
  </div>

  <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td width="100" style="vertical-align: top;">
          ${productImage
            ? `<img src="${productImage}" alt="${productName}" width="80" height="80" style="border-radius: 8px; object-fit: cover;">`
            : `<div style="width: 80px; height: 80px; background-color: #e2e8f0; border-radius: 8px;"></div>`
          }
        </td>
        <td style="padding-left: 16px; vertical-align: top;">
          <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1e293b;">${productName}</p>
          <p style="margin: 0 0 4px 0; font-size: 14px; color: #059669; font-weight: 600;">✓ Back in Stock</p>
          <p style="margin: 0; font-size: 20px; font-weight: 700; color: #1e293b;">${formatPrice(price)}</p>
        </td>
      </tr>
    </table>
  </div>

  <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
    Hurry! This item is popular and may sell out quickly. Click below to add it to your cart before it's gone.
  </p>

  <div style="text-align: center; margin-bottom: 24px;">
    ${button('Shop Now', productUrl)}
  </div>

  <p style="margin: 0; font-size: 13px; color: #94a3b8; text-align: center;">
    You received this email because you signed up for back-in-stock alerts.<br>
    <a href="https://ukgrocerystore.com/account/notifications" style="color: #059669; text-decoration: none;">Manage your alerts</a>
  </p>
`)

// 9. Low Stock Admin Alert Email
export const lowStockAlertEmail = (
  products: Array<{
    name: string
    stock_quantity: number
    low_stock_threshold: number
    slug: string
  }>
) => emailWrapper(`
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="width: 64px; height: 64px; background-color: #fee2e2; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
      <span style="font-size: 32px;">⚠️</span>
    </div>
    <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #1e293b;">Low Stock Alert</h2>
    <p style="margin: 0; font-size: 16px; color: #64748b;">${products.length} product${products.length > 1 ? 's' : ''} need${products.length === 1 ? 's' : ''} restocking</p>
  </div>

  <div style="background-color: #fef2f2; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 14px; color: #991b1b;">
      <strong>Action Required:</strong> The following products are running low on stock and may need to be reordered.
    </p>
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">Product</td>
      <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0; text-align: center;">Stock</td>
      <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0; text-align: center;">Threshold</td>
    </tr>
    ${products.map((product, index) => `
      <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 12px 16px; font-size: 14px; color: #1e293b; border-bottom: 1px solid #e2e8f0;">
          <a href="https://ukgrocerystore.com/admin/products/${product.slug}" style="color: #059669; text-decoration: none; font-weight: 500;">${product.name}</a>
        </td>
        <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: ${product.stock_quantity === 0 ? '#dc2626' : '#f59e0b'}; text-align: center; border-bottom: 1px solid #e2e8f0;">
          ${product.stock_quantity === 0 ? 'OUT OF STOCK' : product.stock_quantity}
        </td>
        <td style="padding: 12px 16px; font-size: 14px; color: #64748b; text-align: center; border-bottom: 1px solid #e2e8f0;">
          ${product.low_stock_threshold}
        </td>
      </tr>
    `).join('')}
  </table>

  <div style="text-align: center;">
    ${button('Manage Inventory', 'https://ukgrocerystore.com/admin/products?filter=low_stock')}
  </div>
`)

// Export all templates
export const emailTemplates = {
  welcome: welcomeEmail,
  orderConfirmation: orderConfirmationEmail,
  shippingNotification: shippingNotificationEmail,
  passwordReset: passwordResetEmail,
  orderStatusUpdate: orderStatusUpdateEmail,
  reviewRequest: reviewRequestEmail,
  vendorApproved: vendorApprovedEmail,
  backInStock: backInStockEmail,
  lowStockAlert: lowStockAlertEmail,
}
