'use client'

import { useState, useEffect } from 'react'
import {
  History,
  Search,
  Filter,
  Calendar,
  User,
  Package,
  ShoppingCart,
  Settings,
  Tag,
  Users,
  Store,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  Clock,
  Activity,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDistanceToNow, format } from 'date-fns'

interface AuditLog {
  id: string
  user_id: string | null
  user_email: string | null
  user_role: string | null
  action: string
  entity_type: string
  entity_id: string | null
  entity_name: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  changes: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  request_method: string | null
  request_path: string | null
  metadata: Record<string, unknown> | null
  notes: string | null
  created_at: string
}

const actionColors: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  login: 'bg-purple-100 text-purple-700',
  logout: 'bg-slate-100 text-slate-700',
  export: 'bg-amber-100 text-amber-700',
  import: 'bg-cyan-100 text-cyan-700',
  bulk_update: 'bg-orange-100 text-orange-700',
}

const entityIcons: Record<string, typeof Package> = {
  product: Package,
  order: ShoppingCart,
  category: Tag,
  user: User,
  customer: Users,
  vendor: Store,
  settings: Settings,
  invoice: FileText,
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })

      if (search) params.append('search', search)
      if (actionFilter !== 'all') params.append('action', actionFilter)
      if (entityFilter !== 'all') params.append('entity_type', entityFilter)

      const response = await fetch(`/api/admin/audit-logs?${params}`)
      const data = await response.json()

      if (response.status === 403) {
        setAccessDenied(true)
        return
      }

      if (response.ok) {
        setLogs(data.logs || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotal(data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, actionFilter, entityFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchLogs()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const viewDetails = (log: AuditLog) => {
    setSelectedLog(log)
    setDetailsOpen(true)
  }

  const exportLogs = async () => {
    const params = new URLSearchParams({
      limit: '10000',
    })
    if (actionFilter !== 'all') params.append('action', actionFilter)
    if (entityFilter !== 'all') params.append('entity_type', entityFilter)

    const response = await fetch(`/api/admin/audit-logs?${params}`)
    const data = await response.json()

    if (response.ok && data.logs) {
      const csv = [
        ['Date', 'User', 'Role', 'Action', 'Entity Type', 'Entity Name', 'Entity ID'].join(','),
        ...data.logs.map((log: AuditLog) => [
          format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
          log.user_email || 'System',
          log.user_role || '-',
          log.action,
          log.entity_type,
          log.entity_name || '-',
          log.entity_id || '-',
        ].join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  const getEntityIcon = (entityType: string) => {
    const Icon = entityIcons[entityType] || FileText
    return <Icon className="h-4 w-4" />
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 bg-red-100 rounded-full mb-4">
          <History className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-600">Activity logs are restricted to Super Admins only.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <History className="h-6 w-6 text-purple-600" />
            </div>
            Activity Logs
          </h1>
          <p className="text-slate-600 mt-1">
            Track all admin actions and changes across the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Activity className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Actions</p>
                <p className="text-xl font-bold text-slate-900">{total.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Product Changes</p>
                <p className="text-xl font-bold text-slate-900">
                  {logs.filter(l => l.entity_type === 'product').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Order Actions</p>
                <p className="text-xl font-bold text-slate-900">
                  {logs.filter(l => l.entity_type === 'order').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Last Activity</p>
                <p className="text-sm font-medium text-slate-900">
                  {logs[0] ? formatDistanceToNow(new Date(logs[0].created_at), { addSuffix: true }) : 'No activity'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by user email or entity name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="export">Export</SelectItem>
                <SelectItem value="import">Import</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="order">Orders</SelectItem>
                <SelectItem value="category">Categories</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="vendor">Vendors</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No activity logs found</p>
              <p className="text-sm text-slate-500 mt-1">
                Activity will appear here as actions are performed
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => viewDetails(log)}
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    {getEntityIcon(log.entity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={actionColors[log.action] || 'bg-slate-100 text-slate-700'}>
                        {log.action}
                      </Badge>
                      <span className="text-slate-900 font-medium">
                        {log.entity_type}
                      </span>
                      {log.entity_name && (
                        <span className="text-slate-600 truncate">
                          - {log.entity_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                      <User className="h-3 w-3" />
                      <span>{log.user_email || 'System'}</span>
                      {log.user_role && (
                        <Badge variant="outline" className="text-xs py-0">
                          {log.user_role}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(log.created_at), 'MMM d, HH:mm')}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-slate-600">
                Page {page} of {totalPages} ({total} total logs)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Activity Details
            </DialogTitle>
            <DialogDescription>
              Full details of this activity log entry
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Action</p>
                  <Badge className={actionColors[selectedLog.action] || 'bg-slate-100 text-slate-700'}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Entity</p>
                  <p className="font-medium capitalize">{selectedLog.entity_type}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Entity Name</p>
                  <p className="font-medium">{selectedLog.entity_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Entity ID</p>
                  <p className="font-mono text-sm">{selectedLog.entity_id || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">User</p>
                  <p className="font-medium">{selectedLog.user_email || 'System'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Role</p>
                  <p className="font-medium capitalize">{selectedLog.user_role || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Timestamp</p>
                  <p className="font-medium">
                    {format(new Date(selectedLog.created_at), 'PPpp')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">IP Address</p>
                  <p className="font-mono text-sm">{selectedLog.ip_address || '-'}</p>
                </div>
              </div>

              {/* Old Values */}
              {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Previous Values</p>
                  <pre className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm overflow-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {/* New Values */}
              {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">New Values</p>
                  <pre className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm overflow-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}

              {/* Metadata */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Additional Metadata</p>
                  <pre className="bg-slate-50 border rounded-lg p-4 text-sm overflow-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Notes */}
              {selectedLog.notes && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Notes</p>
                  <p className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    {selectedLog.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
