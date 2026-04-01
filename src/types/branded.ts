/**
 * Solaris Branded Types
 *
 * Prevent accidentally passing the wrong ID type.
 * A UserId and OrderId are both strings, but TypeScript
 * will error if you mix them up.
 *
 * Usage:
 *   function getOrder(id: OrderId): Promise<Order> { ... }
 *   getOrder(userId)  // TypeScript ERROR — can't pass UserId as OrderId
 *   getOrder(orderId) // OK
 *
 * Creating branded values:
 *   const userId = 'abc-123' as UserId
 *   const orderId = toOrderId('def-456')
 */

// Brand symbol — makes each type unique at the type level
declare const __brand: unique symbol
type Brand<T, B extends string> = T & { readonly [__brand]: B }

// Core entity IDs
export type UserId = Brand<string, 'UserId'>
export type ProductId = Brand<string, 'ProductId'>
export type OrderId = Brand<string, 'OrderId'>
export type VendorId = Brand<string, 'VendorId'>
export type CategoryId = Brand<string, 'CategoryId'>
export type CouponId = Brand<string, 'CouponId'>

// Money — always in pence, never float
export type Pence = Brand<number, 'Pence'>

// Helper functions to create branded values from raw strings
// Use these at system boundaries (API input, DB output)
export function toUserId(id: string): UserId { return id as UserId }
export function toProductId(id: string): ProductId { return id as ProductId }
export function toOrderId(id: string): OrderId { return id as OrderId }
export function toVendorId(id: string): VendorId { return id as VendorId }
export function toCategoryId(id: string): CategoryId { return id as CategoryId }
export function toCouponId(id: string): CouponId { return id as CouponId }
export function toPence(amount: number): Pence { return amount as Pence }
