/**
 * Composable Permissions — Solaris World-Class (#25)
 *
 * Build complex permission rules from simple blocks.
 * Read like English: "can edit if owner or admin and resource is active"
 */

import { ForbiddenError } from '@/lib/utils/errors'

export type PermissionContext = {
  user: { id: string; role: string; vendorId?: string }
  resource?: { id: string; ownerId?: string; vendorId?: string; status?: string }
}

type Permission = (ctx: PermissionContext) => boolean | Promise<boolean>

// --- ATOMIC PERMISSIONS (building blocks) ---

export const isAuthenticated: Permission = (ctx) => !!ctx.user.id

export const isAdmin: Permission = (ctx) => ctx.user.role === 'admin'

export const isVendor: Permission = (ctx) => ctx.user.role === 'vendor'

export const isOwner: Permission = (ctx) =>
  !!ctx.resource?.ownerId && ctx.resource.ownerId === ctx.user.id

export const isVendorOwner: Permission = (ctx) =>
  !!ctx.user.vendorId && ctx.user.vendorId === ctx.resource?.vendorId

export const isResourceActive: Permission = (ctx) =>
  ctx.resource?.status !== 'deleted' && ctx.resource?.status !== 'archived'

// --- COMBINATORS ---

export function all(...perms: Permission[]): Permission {
  return async (ctx) => {
    for (const perm of perms) {
      if (!(await perm(ctx))) return false
    }
    return true
  }
}

export function any(...perms: Permission[]): Permission {
  return async (ctx) => {
    for (const perm of perms) {
      if (await perm(ctx)) return true
    }
    return false
  }
}

export function not(perm: Permission): Permission {
  return async (ctx) => !(await perm(ctx))
}

// --- COMPOSED RULES ---

/** Can edit if owner or vendor owner or admin, and resource is active */
export const canEdit = all(
  isAuthenticated,
  any(isOwner, isVendorOwner, isAdmin),
  isResourceActive
)

/** Can delete if admin and resource is active */
export const canDelete = all(isAuthenticated, isAdmin, isResourceActive)

/** Can view if authenticated and (owner or vendor owner or admin) */
export const canView = all(
  isAuthenticated,
  any(isOwner, isVendorOwner, isAdmin)
)

/** Can manage vendor resources if vendor owner or admin */
export const canManageVendor = all(
  isAuthenticated,
  any(isVendorOwner, isAdmin)
)

// --- ENFORCEMENT ---

export async function checkPermission(
  permission: Permission,
  ctx: PermissionContext
): Promise<void> {
  const allowed = await permission(ctx)
  if (!allowed) {
    throw new ForbiddenError('You do not have permission for this action')
  }
}
