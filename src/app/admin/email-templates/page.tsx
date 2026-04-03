'use client'

import { useState, useEffect } from 'react'
import {
  Mail,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Copy,
  Code,
  FileText,
  ShoppingCart,
  User,
  Bell,
  Send,
  Check,
  X,
  Loader2,
  RefreshCw,
  Lock,
  Tag,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface EmailTemplate {
  id: string
  name: string
  slug: string
  description: string | null
  category: string
  subject: string
  body_html: string
  body_text: string | null
  available_variables: string[]
  is_active: boolean
  is_system: boolean
  last_sent_at: string | null
  send_count: number
  created_at: string
  updated_at: string
}

const categoryIcons: Record<string, typeof Mail> = {
  order: ShoppingCart,
  account: User,
  notification: Bell,
  marketing: Send,
}

const categoryColors: Record<string, string> = {
  order: 'bg-blue-100 text-blue-700',
  account: 'bg-purple-100 text-purple-700',
  notification: 'bg-amber-100 text-amber-700',
  marketing: 'bg-emerald-100 text-emerald-700',
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [saving, setSaving] = useState(false)
  const [previewTab, setPreviewTab] = useState('html')

  // Form state
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'order',
    subject: '',
    body_html: '',
    body_text: '',
    available_variables: [] as string[],
    is_active: true,
  })
  const [newVariable, setNewVariable] = useState('')

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)

      const response = await fetch(`/api/admin/email-templates?${params}`)
      const data = await response.json()

      if (response.ok) {
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Failed to fetch email templates:', error)
      toast.error('Failed to load email templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [categoryFilter])

  useEffect(() => {
    const timer = setTimeout(() => fetchTemplates(), 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleSave = async () => {
    if (!form.name || !form.slug || !form.subject || !form.body_html) {
      toast.error('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const url = selectedTemplate
        ? `/api/admin/email-templates/${selectedTemplate.id}`
        : '/api/admin/email-templates'
      const method = selectedTemplate ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(selectedTemplate ? 'Template updated successfully' : 'Template created successfully')
        setIsEditOpen(false)
        setSelectedTemplate(null)
        resetForm()
        fetchTemplates()
      } else {
        toast.error(data.error || 'Failed to save template')
      }
    } catch {
      toast.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedTemplate) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/email-templates/${selectedTemplate.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Template deleted successfully')
        setIsDeleteOpen(false)
        setSelectedTemplate(null)
        fetchTemplates()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete template')
      }
    } catch {
      toast.error('Failed to delete template')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (template: EmailTemplate) => {
    try {
      const response = await fetch(`/api/admin/email-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !template.is_active }),
      })

      if (response.ok) {
        toast.success(`Template ${!template.is_active ? 'activated' : 'deactivated'}`)
        fetchTemplates()
      }
    } catch {
      toast.error('Failed to update template status')
    }
  }

  const openEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setForm({
      name: template.name,
      slug: template.slug,
      description: template.description || '',
      category: template.category,
      subject: template.subject,
      body_html: template.body_html,
      body_text: template.body_text || '',
      available_variables: template.available_variables || [],
      is_active: template.is_active,
    })
    setIsEditOpen(true)
  }

  const openPreview = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setIsPreviewOpen(true)
  }

  const openDelete = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setIsDeleteOpen(true)
  }

  const resetForm = () => {
    setForm({
      name: '',
      slug: '',
      description: '',
      category: 'order',
      subject: '',
      body_html: '',
      body_text: '',
      available_variables: [],
      is_active: true,
    })
    setNewVariable('')
  }

  const addVariable = () => {
    if (newVariable && !form.available_variables.includes(newVariable)) {
      setForm(prev => ({
        ...prev,
        available_variables: [...prev.available_variables, newVariable]
      }))
      setNewVariable('')
    }
  }

  const removeVariable = (variable: string) => {
    setForm(prev => ({
      ...prev,
      available_variables: prev.available_variables.filter(v => v !== variable)
    }))
  }

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`)
    toast.success('Variable copied to clipboard')
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Mail className="h-6 w-6 text-emerald-600" />
            </div>
            Email Templates
          </h1>
          <p className="text-slate-600 mt-1">
            Manage email templates for orders, notifications, and marketing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchTemplates} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => { resetForm(); setSelectedTemplate(null); setIsEditOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['order', 'account', 'notification', 'marketing'].map((cat) => {
          const Icon = categoryIcons[cat] || Mail
          const count = templates.filter(t => t.category === cat).length
          return (
            <Card key={cat}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${categoryColors[cat]?.replace('text-', 'bg-').replace('-700', '-100')}`}>
                    <Icon className={`h-5 w-5 ${categoryColors[cat]?.split(' ')[1]}`} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 capitalize">{cat}</p>
                    <p className="text-xl font-bold text-slate-900">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="order">Order</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="notification">Notification</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No email templates found</p>
              <Button className="mt-4" onClick={() => setIsEditOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Template
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => {
                const CategoryIcon = categoryIcons[template.category] || Mail
                return (
                  <div
                    key={template.id}
                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${categoryColors[template.category] || 'bg-slate-100 text-slate-700'}`}>
                      <CategoryIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{template.name}</p>
                        {template.is_system && (
                          <Badge variant="outline" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            System
                          </Badge>
                        )}
                        {!template.is_active && (
                          <Badge variant="outline" className="text-red-600 border-red-200">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 truncate">{template.subject}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={categoryColors[template.category] || 'bg-slate-100 text-slate-700'}>
                          {template.category}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          Sent {template.send_count} times
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={() => toggleActive(template)}
                      />
                      <Button variant="ghost" size="sm" onClick={() => openPreview(template)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(template)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {!template.is_system && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => openDelete(template)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsEditOpen(false)
          setSelectedTemplate(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {selectedTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate ? 'Update the email template content' : 'Create a new email template'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    setForm(prev => ({
                      ...prev,
                      name: e.target.value,
                      slug: !selectedTemplate ? generateSlug(e.target.value) : prev.slug
                    }))
                  }}
                  placeholder="Order Confirmation"
                />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="order-confirmation"
                  disabled={selectedTemplate?.is_system}
                />
              </div>
              <div>
                <Label>Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(val) => setForm(prev => ({ ...prev, category: val }))}
                  disabled={selectedTemplate?.is_system}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Sent when an order is confirmed"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <Label>Subject Line *</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Your FreshMart Order #{{order_number}} is Confirmed!"
              />
            </div>

            {/* Variables */}
            <div>
              <Label>Available Variables</Label>
              <p className="text-sm text-slate-500 mb-2">
                Variables that can be used in subject and body with {'{{variable_name}}'} syntax
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.available_variables.map((variable) => (
                  <Badge
                    key={variable}
                    variant="secondary"
                    className="px-3 py-1 cursor-pointer hover:bg-slate-200"
                  >
                    <Code className="h-3 w-3 mr-1" />
                    {`{{${variable}}}`}
                    <button
                      className="ml-2 hover:text-emerald-600"
                      onClick={() => copyVariable(variable)}
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <button
                      className="ml-1 hover:text-red-600"
                      onClick={() => removeVariable(variable)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newVariable}
                  onChange={(e) => setNewVariable(e.target.value.replace(/[^a-z0-9_]/gi, '_').toLowerCase())}
                  placeholder="variable_name"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                />
                <Button type="button" variant="outline" onClick={addVariable}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            {/* Body */}
            <Tabs defaultValue="html" className="w-full">
              <TabsList>
                <TabsTrigger value="html">
                  <Code className="h-4 w-4 mr-2" />
                  HTML Body
                </TabsTrigger>
                <TabsTrigger value="text">
                  <FileText className="h-4 w-4 mr-2" />
                  Plain Text
                </TabsTrigger>
              </TabsList>
              <TabsContent value="html">
                <Textarea
                  value={form.body_html}
                  onChange={(e) => setForm(prev => ({ ...prev, body_html: e.target.value }))}
                  placeholder="<h1>Hello {{customer_name}}</h1><p>Your order has been confirmed...</p>"
                  className="min-h-[300px] font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="text">
                <Textarea
                  value={form.body_text}
                  onChange={(e) => setForm(prev => ({ ...prev, body_text: e.target.value }))}
                  placeholder="Hello {{customer_name}}, Your order has been confirmed..."
                  className="min-h-[300px]"
                />
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditOpen(false)
              setSelectedTemplate(null)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview: {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Subject</p>
                <p className="font-medium">{selectedTemplate.subject}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500 mb-2">Available Variables</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.available_variables?.map((v) => (
                    <Badge key={v} variant="secondary">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              </div>

              <Tabs value={previewTab} onValueChange={setPreviewTab}>
                <TabsList>
                  <TabsTrigger value="html">HTML Preview</TabsTrigger>
                  <TabsTrigger value="code">HTML Code</TabsTrigger>
                  <TabsTrigger value="text">Plain Text</TabsTrigger>
                </TabsList>
                <TabsContent value="html">
                  <div
                    className="p-4 bg-white border rounded-lg min-h-[300px]"
                    dangerouslySetInnerHTML={{ __html: selectedTemplate.body_html }}
                  />
                </TabsContent>
                <TabsContent value="code">
                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-sm overflow-auto min-h-[300px]">
                    {selectedTemplate.body_html}
                  </pre>
                </TabsContent>
                <TabsContent value="text">
                  <pre className="p-4 bg-slate-50 rounded-lg text-sm whitespace-pre-wrap min-h-[300px]">
                    {selectedTemplate.body_text || 'No plain text version available'}
                  </pre>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Template
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTemplate?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
