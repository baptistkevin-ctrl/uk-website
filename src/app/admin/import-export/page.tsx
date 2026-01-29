'use client'

import { useState, useEffect } from 'react'
import {
  Upload,
  Download,
  FileSpreadsheet,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  FileText,
  ArrowRight,
  History,
  File,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface ImportExportJob {
  id: string
  job_type: string
  entity_type: string
  status: string
  file_name: string | null
  file_format: string | null
  total_rows: number
  processed_rows: number
  success_count: number
  error_count: number
  errors: { message: string; row?: number }[]
  warnings: { message: string; row?: number }[]
  result_summary: Record<string, unknown> | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

const entityIcons: Record<string, typeof Package> = {
  products: Package,
  orders: ShoppingCart,
  customers: Users,
  categories: FolderTree,
}

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  processing: Loader2,
  completed: CheckCircle,
  failed: XCircle,
}

const statusColors: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
}

export default function ImportExportPage() {
  const [jobs, setJobs] = useState<ImportExportJob[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<string | null>(null)
  const [tab, setTab] = useState('export')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/admin/import-export?${params}`)
      const data = await response.json()

      if (response.ok) {
        setJobs(data.jobs || [])
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [typeFilter, statusFilter])

  const handleExport = async (entityType: string) => {
    setExporting(entityType)
    try {
      const response = await fetch('/api/admin/import-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_type: 'export',
          entity_type: entityType,
          file_format: 'csv',
        }),
      })

      const data = await response.json()

      if (response.ok && data.data) {
        // Create and download file
        const blob = new Blob([data.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.filename || `${entityType}-export.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        toast.success(`${entityType} exported successfully`)
        fetchJobs()
      } else {
        toast.error(data.error || 'Export failed')
      }
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(null)
    }
  }

  const exportOptions = [
    {
      entity: 'products',
      title: 'Products',
      description: 'Export all products with details',
      icon: Package,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      entity: 'orders',
      title: 'Orders',
      description: 'Export order history',
      icon: ShoppingCart,
      color: 'bg-emerald-100 text-emerald-700',
    },
    {
      entity: 'customers',
      title: 'Customers',
      description: 'Export customer list',
      icon: Users,
      color: 'bg-purple-100 text-purple-700',
    },
    {
      entity: 'categories',
      title: 'Categories',
      description: 'Export category structure',
      icon: FolderTree,
      color: 'bg-amber-100 text-amber-700',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Upload className="h-6 w-6 text-cyan-600" />
            </div>
            Import / Export
          </h1>
          <p className="text-slate-600 mt-1">
            Import and export data in bulk
          </p>
        </div>
        <Button variant="outline" onClick={fetchJobs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </TabsTrigger>
          <TabsTrigger value="import">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>
                Download your data as CSV files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exportOptions.map((option) => (
                  <div
                    key={option.entity}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className={`p-3 rounded-lg ${option.color}`}>
                      <option.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">{option.title}</h3>
                      <p className="text-sm text-slate-500">{option.description}</p>
                    </div>
                    <Button
                      onClick={() => handleExport(option.entity)}
                      disabled={exporting !== null}
                    >
                      {exporting === option.entity ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Data</CardTitle>
              <CardDescription>
                Upload CSV files to import data in bulk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <FileSpreadsheet className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-medium text-slate-900 mb-2">Import Feature Coming Soon</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Drag and drop your CSV file here, or click to browse
                </p>
                <Button variant="outline" disabled>
                  <Upload className="h-4 w-4 mr-2" />
                  Select File
                </Button>
              </div>

              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">Import Guidelines</h4>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-emerald-600" />
                    Use the exported CSV as a template for imports
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-emerald-600" />
                    Ensure all required fields are filled
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-emerald-600" />
                    Maximum file size: 10MB
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-emerald-600" />
                    Supported format: CSV (comma-separated)
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="import">Import</SelectItem>
                    <SelectItem value="export">Export</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Jobs List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No import/export jobs yet</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Export some data to see history here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => {
                    const EntityIcon = entityIcons[job.entity_type] || FileText
                    const StatusIcon = statusIcons[job.status] || Clock
                    const progress = job.total_rows > 0
                      ? Math.round((job.processed_rows / job.total_rows) * 100)
                      : 0

                    return (
                      <div
                        key={job.id}
                        className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg"
                      >
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <EntityIcon className="h-5 w-5 text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {job.job_type}
                            </Badge>
                            <span className="font-medium text-slate-900 capitalize">
                              {job.entity_type}
                            </span>
                            <Badge className={statusColors[job.status] || 'bg-slate-100 text-slate-700'}>
                              <StatusIcon className={`h-3 w-3 mr-1 ${job.status === 'processing' ? 'animate-spin' : ''}`} />
                              {job.status}
                            </Badge>
                          </div>
                          {job.status === 'processing' && (
                            <div className="mt-2">
                              <Progress value={progress} className="h-2" />
                              <p className="text-xs text-slate-500 mt-1">
                                {job.processed_rows} / {job.total_rows} rows ({progress}%)
                              </p>
                            </div>
                          )}
                          {job.status === 'completed' && (
                            <p className="text-sm text-slate-500 mt-1">
                              {job.success_count} rows processed successfully
                              {job.error_count > 0 && ` • ${job.error_count} errors`}
                            </p>
                          )}
                          {job.status === 'failed' && job.errors && job.errors.length > 0 && (
                            <p className="text-sm text-red-600 mt-1">
                              {job.errors[0]?.message}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-slate-600">
                            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                          </p>
                          {job.completed_at && (
                            <p className="text-xs text-slate-400">
                              Completed {format(new Date(job.completed_at), 'HH:mm')}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Completed</p>
                <p className="text-xl font-bold text-slate-900">
                  {jobs.filter(j => j.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Download className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Exports</p>
                <p className="text-xl font-bold text-slate-900">
                  {jobs.filter(j => j.job_type === 'export').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Upload className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Imports</p>
                <p className="text-xl font-bold text-slate-900">
                  {jobs.filter(j => j.job_type === 'import').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Failed</p>
                <p className="text-xl font-bold text-slate-900">
                  {jobs.filter(j => j.status === 'failed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
