/**
 * Feature Flag System — Solaris World-Class (#29)
 *
 * Deploy code to production without exposing it to users.
 * Roll out gradually — 1% → 10% → 50% → 100%.
 * Roll back instantly by flipping a flag.
 */

interface FeatureFlag {
  name: string
  enabled: boolean
  rolloutPercentage: number
  allowedUserIds?: string[]
  allowedRoles?: string[]
  description: string
}

const FLAGS: Record<string, FeatureFlag> = {
  'ai-product-descriptions': {
    name: 'ai-product-descriptions',
    enabled: false,
    rolloutPercentage: 0,
    allowedRoles: ['admin'],
    description: 'AI-generated product descriptions',
  },
  'new-checkout-flow': {
    name: 'new-checkout-flow',
    enabled: false,
    rolloutPercentage: 0,
    description: 'Redesigned checkout with fewer steps',
  },
  'real-time-tracking': {
    name: 'real-time-tracking',
    enabled: false,
    rolloutPercentage: 0,
    description: 'Live delivery tracking on map',
  },
  'live-chat-v2': {
    name: 'live-chat-v2',
    enabled: true,
    rolloutPercentage: 100,
    description: 'Improved live chat widget',
  },
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function isFeatureEnabled(
  flagName: string,
  user?: { id: string; role: string }
): boolean {
  const flag = FLAGS[flagName]
  if (!flag || !flag.enabled) return false

  // Check if user is explicitly allowed
  if (user && flag.allowedUserIds?.includes(user.id)) return true

  // Check if user's role is allowed
  if (user && flag.allowedRoles?.includes(user.role)) return true

  // Gradual rollout: hash userId for consistent percentage
  if (user && flag.rolloutPercentage > 0) {
    const hash = simpleHash(user.id + flagName)
    const userPercentage = hash % 100
    return userPercentage < flag.rolloutPercentage
  }

  return flag.rolloutPercentage === 100
}

export function getAllFlags(): Record<string, { enabled: boolean; rollout: number }> {
  const result: Record<string, { enabled: boolean; rollout: number }> = {}
  for (const [key, flag] of Object.entries(FLAGS)) {
    result[key] = { enabled: flag.enabled, rollout: flag.rolloutPercentage }
  }
  return result
}
