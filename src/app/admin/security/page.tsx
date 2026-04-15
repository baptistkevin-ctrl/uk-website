'use client'

import { useState, useEffect } from 'react'
import {
  Shield, AlertTriangle, Lock, Eye, Activity, Users,
  Loader2, RefreshCw, CheckCircle, XCircle, Clock,
  Globe, Fingerprint, Bug, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SecurityDashboard {
  metrics: {
    loginAttempts: { success: number; failure: number }
    blockedRequests: number
    rateLimitHits: number
    injectionAttempts: number
    suspiciousActivities: number
  }
  recentEvents: {
    type: string
    severity: string
    ip: string
    userId?: string
    userEmail?: string
    description: string
    timestamp: string
  }[]
  alerts: {
    type: string
    message: string
    severity: string
  }[]
}

export default function SecurityPage() {
  const [data, setData] = useState<SecurityDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      const [dashRes, eventsRes, alertsRes] = await Promise.all([
        fetch('/api/admin/security?view=dashboard'),
        fetch('/api/admin/security?view=events&count=20'),
        fetch('/api/admin/security?view=alerts'),
      ])

      const dashboard = dashRes.ok ? await dashRes.json() : { metrics: { loginAttempts: { success: 0, failure: 0 }, blockedRequests: 0, rateLimitHits: 0, injectionAttempts: 0, suspiciousActivities: 0 } }
      const events = eventsRes.ok ? await eventsRes.json() : { events: [] }
      const alerts = alertsRes.ok ? await alertsRes.json() : { alerts: [] }

      setData({
        metrics: dashboard.metrics || dashboard,
        recentEvents: events.events || [],
        alerts: alerts.alerts || [],
      })
    } catch {
      setData(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-(--color-error) text-white'
      case 'high': return 'bg-(--color-error)/10 text-(--color-error)'
      case 'medium': return 'bg-(--color-warning)/10 text-(--color-warning)'
      case 'low': return 'bg-(--color-info)/10 text-(--color-info)'
      default: return 'bg-(--color-elevated) text-(--color-text-secondary)'
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login_success': return CheckCircle
      case 'login_failure': return XCircle
      case 'account_locked': return Lock
      case 'rate_limited': return Zap
      case 'injection_attempt': return Bug
      case 'ip_blocked': return Globe
      case 'suspicious_activity': return AlertTriangle
      case 'admin_action': return Shield
      default: return Activity
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-(--brand-primary)" />
            Security Dashboard
          </h1>
          <p className="text-(--color-text-muted) mt-1">Monitor threats, login activity, and platform security</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Security Alerts */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="space-y-3">
          {data.alerts.map((alert, i) => (
            <div key={i} className={`p-4 rounded-xl border flex items-start gap-3 ${
              alert.severity === 'critical' ? 'bg-(--color-error)/5 border-(--color-error)/20' :
              alert.severity === 'high' ? 'bg-(--color-warning)/5 border-(--color-warning)/20' :
              'bg-(--color-info)/5 border-(--color-info)/20'
            }`}>
              <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${
                alert.severity === 'critical' ? 'text-(--color-error)' :
                alert.severity === 'high' ? 'text-(--color-warning)' :
                'text-(--color-info)'
              }`} />
              <div>
                <p className="font-medium text-foreground text-sm">{alert.message}</p>
                <p className="text-xs text-(--color-text-muted) mt-0.5">Severity: {alert.severity}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center">
          <CheckCircle className="h-6 w-6 text-(--color-success) mx-auto mb-2" />
          <p className="text-2xl font-bold font-mono text-foreground">{data?.metrics.loginAttempts.success || 0}</p>
          <p className="text-xs text-(--color-text-muted)">Successful Logins</p>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center">
          <XCircle className="h-6 w-6 text-(--color-error) mx-auto mb-2" />
          <p className="text-2xl font-bold font-mono text-(--color-error)">{data?.metrics.loginAttempts.failure || 0}</p>
          <p className="text-xs text-(--color-text-muted)">Failed Logins</p>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center">
          <Globe className="h-6 w-6 text-(--color-warning) mx-auto mb-2" />
          <p className="text-2xl font-bold font-mono text-foreground">{data?.metrics.blockedRequests || 0}</p>
          <p className="text-xs text-(--color-text-muted)">Blocked Requests</p>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center">
          <Zap className="h-6 w-6 text-(--brand-amber) mx-auto mb-2" />
          <p className="text-2xl font-bold font-mono text-foreground">{data?.metrics.rateLimitHits || 0}</p>
          <p className="text-xs text-(--color-text-muted)">Rate Limited</p>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center">
          <Bug className="h-6 w-6 text-(--color-error) mx-auto mb-2" />
          <p className="text-2xl font-bold font-mono text-(--color-error)">{data?.metrics.injectionAttempts || 0}</p>
          <p className="text-xs text-(--color-text-muted)">Injection Attempts</p>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center">
          <AlertTriangle className="h-6 w-6 text-(--color-warning) mx-auto mb-2" />
          <p className="text-2xl font-bold font-mono text-foreground">{data?.metrics.suspiciousActivities || 0}</p>
          <p className="text-xs text-(--color-text-muted)">Suspicious Activity</p>
        </div>
      </div>

      {/* Security Features Status */}
      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Fingerprint className="h-5 w-5 text-(--color-text-muted)" />
          Security Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'HTTPS Enforced', enabled: true },
            { label: 'SQL Injection Protection', enabled: true },
            { label: 'XSS Prevention', enabled: true },
            { label: 'CSRF Protection', enabled: true },
            { label: 'Rate Limiting', enabled: true },
            { label: 'Account Lockout (5 attempts)', enabled: true },
            { label: 'Input Sanitization', enabled: true },
            { label: 'Audit Logging', enabled: true },
            { label: 'Secure Cookie Flags', enabled: true },
            { label: 'Path Traversal Protection', enabled: true },
            { label: 'Bot Detection', enabled: true },
            { label: 'Admin Role Verification', enabled: true },
          ].map((feature) => (
            <div key={feature.label} className="flex items-center gap-3 p-3 bg-background rounded-lg">
              {feature.enabled ? (
                <CheckCircle className="h-4 w-4 text-(--color-success) shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-(--color-text-disabled) shrink-0" />
              )}
              <span className={`text-sm ${feature.enabled ? 'text-foreground' : 'text-(--color-text-muted)'}`}>
                {feature.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Security Events */}
      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) overflow-hidden">
        <div className="px-6 py-4 border-b border-(--color-border) flex items-center justify-between">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-(--color-text-muted)" />
            Recent Security Events
          </h2>
          <Badge variant="secondary">{data?.recentEvents.length || 0} events</Badge>
        </div>
        {data?.recentEvents && data.recentEvents.length > 0 ? (
          <div className="divide-y divide-(--color-border) max-h-96 overflow-y-auto">
            {data.recentEvents.map((event, i) => {
              const Icon = getEventIcon(event.type)
              return (
                <div key={i} className="px-6 py-3 flex items-center gap-4 hover:bg-background transition-colors">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${getSeverityColor(event.severity)}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{event.description}</p>
                    <div className="flex items-center gap-3 text-xs text-(--color-text-muted) mt-0.5">
                      <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {event.ip}</span>
                      {event.userEmail && <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {event.userEmail}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge className={getSeverityColor(event.severity)}>{event.severity}</Badge>
                    <p className="text-[10px] text-(--color-text-disabled) mt-1">
                      <Clock className="h-3 w-3 inline mr-0.5" />
                      {new Date(event.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-10 text-center">
            <Shield className="h-10 w-10 mx-auto text-(--color-text-disabled) mb-3" />
            <p className="text-sm text-(--color-text-muted)">No security events recorded yet</p>
            <p className="text-xs text-(--color-text-disabled) mt-1">Events will appear here as they occur</p>
          </div>
        )}
      </div>
    </div>
  )
}
