'use client'

import { useState, useEffect } from 'react'
import {
  UserCog,
  Search,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Shield,
  User,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  MoreVertical,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface Permission {
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
  export?: boolean
}

interface TeamMember {
  id: string
  user_id: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  role: string
  department: string | null
  job_title: string | null
  permissions: Record<string, Permission>
  status: string
  last_login_at: string | null
  invited_at: string | null
  created_at: string
}

const roleColors: Record<string, string> = {
  super_admin: 'bg-(--brand-amber)/10 text-(--brand-amber)',
  admin: 'bg-(--color-info-bg) text-(--color-info)',
  manager: 'bg-(--brand-primary-light) text-(--brand-primary)',
  supervisor: 'bg-(--color-success-bg) text-(--color-success)',
  support: 'bg-(--brand-amber-soft) text-(--brand-amber)',
  warehouse: 'bg-(--color-elevated) text-(--color-text-secondary)',
  staff: 'bg-(--color-elevated) text-foreground',
}

const statusIcons: Record<string, typeof CheckCircle> = {
  active: CheckCircle,
  inactive: XCircle,
  pending: Clock,
  suspended: AlertCircle,
}

const statusColors: Record<string, string> = {
  active: 'text-(--brand-primary)',
  inactive: 'text-(--color-text-disabled)',
  pending: 'text-(--brand-amber)',
  suspended: 'text-(--color-error)',
}

const defaultPermissions: Record<string, Permission> = {
  products: { view: true, create: false, edit: false, delete: false },
  orders: { view: true, create: false, edit: false, delete: false },
  customers: { view: true, create: false, edit: false, delete: false },
  categories: { view: true, create: false, edit: false, delete: false },
  vendors: { view: true, create: false, edit: false, delete: false },
  complaints: { view: true, create: false, edit: false, delete: false },
  finance: { view: false, create: false, edit: false, delete: false, export: false },
  reports: { view: false, create: false, edit: false, delete: false, export: false },
  settings: { view: false, create: false, edit: false, delete: false },
  team: { view: false, create: false, edit: false, delete: false },
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'staff',
    department: '',
    job_title: '',
    permissions: { ...defaultPermissions },
  })

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (roleFilter !== 'all') params.append('role', roleFilter)

      const response = await fetch(`/api/admin/team?${params}`)
      const data = await response.json()

      if (response.ok) {
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error)
      toast.error('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [statusFilter, roleFilter])

  useEffect(() => {
    const timer = setTimeout(() => fetchMembers(), 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleAdd = async () => {
    if (!form.first_name || !form.last_name || !form.email) {
      toast.error('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Team member invited successfully')
        setIsAddOpen(false)
        resetForm()
        fetchMembers()
      } else {
        toast.error(data.error || 'Failed to add team member')
      }
    } catch {
      toast.error('Failed to add team member')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedMember || !form.first_name || !form.last_name || !form.email) {
      toast.error('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/team/${selectedMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Team member updated successfully')
        setIsEditOpen(false)
        setSelectedMember(null)
        resetForm()
        fetchMembers()
      } else {
        toast.error(data.error || 'Failed to update team member')
      }
    } catch {
      toast.error('Failed to update team member')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedMember) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/team/${selectedMember.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Team member removed successfully')
        setIsDeleteOpen(false)
        setSelectedMember(null)
        fetchMembers()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to remove team member')
      }
    } catch {
      toast.error('Failed to remove team member')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (member: TeamMember, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/team/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success(`Team member ${newStatus === 'active' ? 'activated' : newStatus}`)
        fetchMembers()
      }
    } catch {
      toast.error('Failed to update status')
    }
  }

  const openEdit = (member: TeamMember) => {
    setSelectedMember(member)
    setForm({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone || '',
      role: member.role,
      department: member.department || '',
      job_title: member.job_title || '',
      permissions: member.permissions || defaultPermissions,
    })
    setIsEditOpen(true)
  }

  const openDelete = (member: TeamMember) => {
    setSelectedMember(member)
    setIsDeleteOpen(true)
  }

  const resetForm = () => {
    setForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'staff',
      department: '',
      job_title: '',
      permissions: defaultPermissions,
    })
  }

  const togglePermission = (entity: string, action: keyof Permission) => {
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [entity]: {
          ...prev.permissions[entity],
          [action]: !prev.permissions[entity]?.[action]
        }
      }
    }))
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 bg-(--color-info-bg) rounded-lg">
              <UserCog className="h-6 w-6 text-(--color-info)" />
            </div>
            Team Management
          </h1>
          <p className="text-(--color-text-secondary) mt-1">
            Manage staff members, departments, and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchMembers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => { resetForm(); setIsAddOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-(--brand-primary-light) rounded-lg">
                <User className="h-5 w-5 text-(--brand-primary)" />
              </div>
              <div>
                <p className="text-sm text-(--color-text-secondary)">Total Members</p>
                <p className="text-xl font-bold text-foreground">{members.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-(--color-info-bg) rounded-lg">
                <CheckCircle className="h-5 w-5 text-(--color-info)" />
              </div>
              <div>
                <p className="text-sm text-(--color-text-secondary)">Active</p>
                <p className="text-xl font-bold text-foreground">
                  {members.filter(m => m.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-(--brand-amber-soft) rounded-lg">
                <Clock className="h-5 w-5 text-(--brand-amber)" />
              </div>
              <div>
                <p className="text-sm text-(--color-text-secondary)">Pending</p>
                <p className="text-xl font-bold text-foreground">
                  {members.filter(m => m.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-(--color-info-bg) rounded-lg">
                <Shield className="h-5 w-5 text-(--color-info)" />
              </div>
              <div>
                <p className="text-sm text-(--color-text-secondary)">Admins</p>
                <p className="text-xl font-bold text-foreground">
                  {members.filter(m => ['admin', 'super_admin'].includes(m.role)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      {members.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-foreground mb-3">Departments</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(
                members.reduce((acc, m) => {
                  const dept = m.department || 'unassigned'
                  acc[dept] = (acc[dept] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              ).sort((a, b) => b[1] - a[1]).map(([dept, count]) => (
                <div key={dept} className="px-3 py-1.5 bg-background rounded-lg border border-(--color-border) text-xs">
                  <span className="font-medium text-foreground capitalize">{dept.replace(/_/g, ' ')}</span>
                  <span className="ml-1.5 text-(--color-text-muted)">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-text-disabled)" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="warehouse">Warehouse</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Team List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12">
              <UserCog className="h-16 w-16 text-(--color-text-disabled) mx-auto mb-4" />
              <p className="text-(--color-text-secondary)">No team members found</p>
              <Button className="mt-4" onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Member
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const StatusIcon = statusIcons[member.status] || AlertCircle
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-4 bg-background rounded-lg hover:bg-(--color-elevated) transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="bg-(--brand-primary-light) text-(--brand-primary)">
                        {getInitials(member.first_name, member.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {member.first_name} {member.last_name}
                        </p>
                        <Badge className={roleColors[member.role] || 'bg-(--color-elevated) text-foreground'}>
                          {member.role.replace('_', ' ')}
                        </Badge>
                        <StatusIcon className={`h-4 w-4 ${statusColors[member.status]}`} />
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-(--color-text-muted)">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </span>
                        {member.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </span>
                        )}
                        {member.department && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {member.department}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right hidden md:block">
                      {member.last_login_at ? (
                        <p className="text-sm text-(--color-text-secondary)">
                          Last login: {formatDistanceToNow(new Date(member.last_login_at), { addSuffix: true })}
                        </p>
                      ) : member.status === 'pending' ? (
                        <p className="text-sm text-(--brand-amber)">
                          Invited {formatDistanceToNow(new Date(member.invited_at || member.created_at), { addSuffix: true })}
                        </p>
                      ) : null}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(member)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {member.status !== 'active' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(member, 'active')}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        {member.status === 'active' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(member, 'suspended')}>
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Suspend
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-(--color-error)"
                          onClick={() => openDelete(member)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddOpen(false)
          setIsEditOpen(false)
          setSelectedMember(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              {isEditOpen ? 'Edit Team Member' : 'Add Team Member'}
            </DialogTitle>
            <DialogDescription>
              {isEditOpen ? 'Update team member details and permissions' : 'Invite a new team member to the admin panel'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input
                  value={form.first_name}
                  onChange={(e) => setForm(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="John"
                />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input
                  value={form.last_name}
                  onChange={(e) => setForm(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Doe"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+44 7123 456789"
                />
              </div>
              <div>
                <Label>Role *</Label>
                <Select value={form.role} onValueChange={(val) => setForm(prev => ({ ...prev, role: val }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin — Full platform access</SelectItem>
                    <SelectItem value="admin">Admin — Manage orders, vendors, customers</SelectItem>
                    <SelectItem value="manager">Manager — Department head access</SelectItem>
                    <SelectItem value="supervisor">Supervisor — Team lead with edit access</SelectItem>
                    <SelectItem value="support">Support Agent — Handle tickets & chat</SelectItem>
                    <SelectItem value="warehouse">Warehouse Staff — Orders & inventory only</SelectItem>
                    <SelectItem value="staff">Staff — View-only access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Department</Label>
                <Select value={form.department} onValueChange={(val) => setForm(prev => ({ ...prev, department: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="management">Management</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="customer_service">Customer Service</SelectItem>
                    <SelectItem value="warehouse">Warehouse & Logistics</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="finance">Finance & Accounting</SelectItem>
                    <SelectItem value="it">IT & Engineering</SelectItem>
                    <SelectItem value="hr">Human Resources</SelectItem>
                    <SelectItem value="legal">Legal & Compliance</SelectItem>
                    <SelectItem value="quality">Quality Control</SelectItem>
                    <SelectItem value="procurement">Procurement</SelectItem>
                    <SelectItem value="vendor_relations">Vendor Relations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Job Title</Label>
                <Input
                  value={form.job_title}
                  onChange={(e) => setForm(prev => ({ ...prev, job_title: e.target.value }))}
                  placeholder="e.g. Store Manager"
                />
              </div>
            </div>

            {/* Permissions */}
            <div>
              <Label className="text-base">Permissions</Label>
              <p className="text-sm text-(--color-text-muted) mb-4">Configure what this team member can access</p>

              <div className="space-y-3">
                {Object.entries(form.permissions).map(([entity, perms]) => (
                  <div key={entity} className="flex items-center gap-4 p-3 bg-background rounded-lg">
                    <span className="w-24 font-medium capitalize">{entity}</span>
                    <div className="flex items-center gap-4 flex-wrap">
                      {Object.entries(perms).map(([action, enabled]) => (
                        <label key={action} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={enabled as boolean}
                            onCheckedChange={() => togglePermission(entity, action as keyof Permission)}
                          />
                          <span className="text-sm capitalize">{action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddOpen(false)
              setIsEditOpen(false)
              setSelectedMember(null)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button
              onClick={isEditOpen ? handleEdit : handleAdd}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditOpen ? 'Update Member' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-(--color-error)">
              <Trash2 className="h-5 w-5" />
              Remove Team Member
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedMember?.first_name} {selectedMember?.last_name} from the team?
              This action cannot be undone.
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
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
