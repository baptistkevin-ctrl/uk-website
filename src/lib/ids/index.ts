/**
 * Solaris ID System — World-Class (#22)
 *
 * Prefixed, readable IDs instead of raw UUIDs.
 * Looking at a log, you instantly know "ord_xxx" is an order.
 */

import { randomBytes } from 'crypto'

const PREFIXES = {
  user: 'usr',
  order: 'ord',
  product: 'prd',
  vendor: 'vnd',
  invoice: 'inv',
  payment: 'pay',
  session: 'ses',
  coupon: 'cpn',
  review: 'rev',
  notification: 'ntf',
  file: 'fil',
  request: 'req',
  trace: 'trc',
  event: 'evt',
  job: 'job',
  promise: 'prm',
} as const

type EntityType = keyof typeof PREFIXES

export function generateId(entity: EntityType): string {
  const prefix = PREFIXES[entity]
  const random = randomBytes(12).toString('base64url')
  return `${prefix}_${random}`
}
