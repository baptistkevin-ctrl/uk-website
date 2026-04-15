'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Search,
  Filter,
  Loader2,
  Users,
  Shield,
  ShieldCheck,
  Store,
  User,
  Ban,
  CheckCircle,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  X,
  Mail,
  Phone,
  ShoppingBag,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Crown,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: 'customer' | 'vendor' | 'admin'
  is_banned: boolean
  created_at: string
  updated_at: string
  order_count: number
}

interface UserDetail extends UserProfile {
  total_spent: number
  review_count: number
  addresses: Array<{
    id: string
    label: string
    address_line_1: string
    city: string
    postcode: string
    is_default: boolean
  }>
  orders: Array<{
    id: string
    order_number: string
    total_pence: number
    status: string
    created_at: string
  }>
}

const roleColors: Record<string, string> = {
  customer: 'bg-(--color-info-bg) text-(--color-info)',
  vendor: 'bg-(--color-info-bg) text-(--color-info)',
  admin: 'bg-(--brand-amber-soft) text-(--brand-amber)',
  super_admin: 'bg-(--color-error-bg) text-(--color-error)',
}

const roleIcons: Record<string, typeof User> = {
  customer: User,
  vendor: Store,
  admin: Crown,
  super_admin: ShieldCheck,
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '',
    role: '',
    is_banned: false,
  })

  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (searchQuery) params.append('search', searchQuery)
      if (roleFilter) params.append('role', roleFilter)
      if (statusFilter) params.append('status', statusFilter)

      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      if (data.users) {
        setUsers(data.users)
        setTotalPages(data.totalPages || 1)
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [page, roleFilter, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const viewUserDetail = async (userId: string) => {
    setLoadingDetail(true)
    setShowDetailModal(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      const data = await res.json()
      setSelectedUser(data)
    } catch (error) {
      console.error('Error fetching user detail:', error)
    }
    setLoadingDetail(false)
  }

  const openEditUserModal = (user: UserProfile) => {
    setEditingUser(user)
    setEditForm({
      full_name: user.full_name || '',
      role: user.role,
      is_banned: user.is_banned || false,
    })
    setShowEditModal(true)
    setOpenMenu(null)
  }

  const handleSaveUser = async () => {
    if (!editingUser) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        setShowEditModal(false)
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Failed to update user')
    }
    setSaving(false)
  }

  const toggleBan = async (user: UserProfile) => {
    const action = user.is_banned ? 'unban' : 'ban'
    if (!confirm(`Are you sure you want to ${action} this user?`)) return

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_banned: !user.is_banned }),
      })
      if (res.ok) {
        setUsers(users.map(u =>
          u.id === user.id ? { ...u, is_banned: !u.is_banned } : u
        ))
      } else {
        const data = await res.json()
        alert(data.error || `Failed to ${action} user`)
      }
    } catch (error) {
      console.error('Error toggling ban:', error)
    }
    setOpenMenu(null)
  }

  const deleteUser = async (user: UserProfile) => {
    if (!confirm(`Are you sure you want to delete ${user.email}? This action cannot be undone.`)) return

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok) {
        if (data.anonymized) {
          alert(data.message)
        }
        fetchUsers()
      } else {
        alert(data.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    }
    setOpenMenu(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-(--color-text-muted) mt-1">{total} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-(--color-surface) rounded-2xl border border-(--color-border) p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-(--color-text-disabled)" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
              className="px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
            >
              <option value="">All Roles</option>
              <option value="customer">Customers</option>
              <option value="vendor">Vendors</option>
              <option value="admin">Admins</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2.5 bg-(--brand-primary) text-white rounded-xl font-medium hover:bg-(--brand-primary-hover) transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="bg-(--color-surface) rounded-2xl p-12 text-center border border-(--color-border)">
          <Users className="w-16 h-16 text-(--color-text-disabled) mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No users found</h3>
          <p className="text-(--color-text-muted)">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="bg-(--color-surface) rounded-2xl border border-(--color-border) overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-(--color-border)">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">Orders</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">Joined</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border)">
                {users.map((user) => {
                  const RoleIcon = roleIcons[user.role] || User
                  return (
                    <tr key={user.id} className="hover:bg-background transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <Image
                              src={user.avatar_url}
                              alt={user.full_name || 'User'}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-(--color-elevated) flex items-center justify-center">
                              <User className="w-5 h-5 text-(--color-text-disabled)" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-foreground">{user.full_name || 'No name'}</p>
                            <p className="text-sm text-(--color-text-muted)">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                          <RoleIcon className="w-3.5 h-3.5" />
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-(--color-text-secondary)">{user.order_count}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-(--color-text-secondary)">{formatDate(user.created_at)}</span>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_banned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-(--color-error-bg) text-(--color-error)">
                            <Ban className="w-3 h-3" />
                            Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-(--brand-primary-light) text-(--brand-primary)">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => viewUserDetail(user.id)}
                            className="p-2 text-(--color-text-muted) hover:text-(--color-info) hover:bg-(--color-info-bg) rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                              className="p-2 text-(--color-text-muted) hover:text-foreground hover:bg-(--color-elevated) rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {openMenu === user.id && (
                              <div className="absolute right-0 mt-1 w-48 bg-(--color-surface) rounded-xl shadow-lg border border-(--color-border) py-1 z-10">
                                <button
                                  onClick={() => openEditUserModal(user)}
                                  className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-background flex items-center gap-2"
                                >
                                  <Pencil className="w-4 h-4" />
                                  Edit User
                                </button>
                                <button
                                  onClick={() => toggleBan(user)}
                                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                                    user.is_banned
                                      ? 'text-(--brand-primary) hover:bg-(--brand-primary-light)'
                                      : 'text-(--brand-amber) hover:bg-(--brand-amber-soft)'
                                  }`}
                                >
                                  {user.is_banned ? (
                                    <>
                                      <CheckCircle className="w-4 h-4" />
                                      Unban User
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="w-4 h-4" />
                                      Ban User
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => deleteUser(user)}
                                  className="w-full px-4 py-2 text-left text-sm text-(--color-error) hover:bg-(--color-error-bg) flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete User
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-(--color-border)">
              <p className="text-sm text-(--color-text-muted)">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 px-4 py-2.5 text-sm font-medium text-(--color-text-secondary) bg-(--color-elevated) rounded-lg hover:bg-(--color-border) disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-1 px-4 py-2.5 text-sm font-medium text-(--color-text-secondary) bg-(--color-elevated) rounded-lg hover:bg-(--color-border) disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-(--color-surface) rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-(--color-border)">
              <h2 className="text-xl font-bold text-foreground">User Details</h2>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedUser(null) }}
                className="p-2 text-(--color-text-disabled) hover:text-(--color-text-secondary) rounded-lg hover:bg-(--color-elevated)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-(--brand-primary) mx-auto" />
              </div>
            ) : selectedUser && (
              <div className="p-6 space-y-6">
                {/* User Info */}
                <div className="flex items-start gap-4">
                  {selectedUser.avatar_url ? (
                    <Image
                      src={selectedUser.avatar_url}
                      alt={selectedUser.full_name || 'User'}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-(--color-elevated) flex items-center justify-center">
                      <User className="w-10 h-10 text-(--color-text-disabled)" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground">{selectedUser.full_name || 'No name'}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[selectedUser.role]}`}>
                        {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                      </span>
                      {selectedUser.is_banned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-(--color-error-bg) text-(--color-error)">
                          <Ban className="w-3 h-3" />
                          Banned
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-background rounded-xl">
                    <Mail className="w-5 h-5 text-(--color-text-disabled)" />
                    <div>
                      <p className="text-xs text-(--color-text-muted)">Email</p>
                      <p className="text-sm font-medium text-foreground">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-background rounded-xl">
                    <Phone className="w-5 h-5 text-(--color-text-disabled)" />
                    <div>
                      <p className="text-xs text-(--color-text-muted)">Phone</p>
                      <p className="text-sm font-medium text-foreground">{selectedUser.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-(--color-info-bg) rounded-xl text-center">
                    <ShoppingBag className="w-6 h-6 text-(--color-info) mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-900">{selectedUser.order_count}</p>
                    <p className="text-xs text-(--color-info)">Orders</p>
                  </div>
                  <div className="p-4 bg-(--brand-primary-light) rounded-xl text-center">
                    <span className="text-2xl font-bold text-(--brand-primary) block">
                      {formatPrice(selectedUser.total_spent)}
                    </span>
                    <p className="text-xs text-(--brand-primary) mt-1">Total Spent</p>
                  </div>
                  <div className="p-4 bg-(--brand-amber-soft) rounded-xl text-center">
                    <Calendar className="w-6 h-6 text-(--brand-amber) mx-auto mb-2" />
                    <p className="text-sm font-bold text-amber-900">{formatDate(selectedUser.created_at)}</p>
                    <p className="text-xs text-(--brand-amber)">Joined</p>
                  </div>
                </div>

                {/* Recent Orders */}
                {selectedUser.orders && selectedUser.orders.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Recent Orders</h4>
                    <div className="space-y-2">
                      {selectedUser.orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                          <div>
                            <p className="font-medium text-foreground">#{order.order_number}</p>
                            <p className="text-sm text-(--color-text-muted)">{formatDate(order.created_at)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">{formatPrice(order.total_pence)}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              order.status === 'delivered' ? 'bg-(--brand-primary-light) text-(--brand-primary)' :
                              order.status === 'cancelled' ? 'bg-(--color-error-bg) text-(--color-error)' :
                              'bg-(--color-info-bg) text-(--color-info)'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Addresses */}
                {selectedUser.addresses && selectedUser.addresses.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Addresses</h4>
                    <div className="space-y-2">
                      {selectedUser.addresses.map((address) => (
                        <div key={address.id} className="p-3 bg-background rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">{address.label}</span>
                            {address.is_default && (
                              <span className="text-xs px-2 py-0.5 bg-(--brand-primary-light) text-(--brand-primary) rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-(--color-text-secondary)">
                            {address.address_line_1}, {address.city}, {address.postcode}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-(--color-surface) rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-(--color-border)">
              <h2 className="text-xl font-bold text-foreground">Edit User</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-(--color-text-disabled) hover:text-(--color-text-secondary) rounded-lg hover:bg-(--color-elevated)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="w-full px-4 py-2.5 border border-(--color-border) rounded-xl bg-background text-(--color-text-muted)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                >
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center gap-3 p-4 bg-(--color-error-bg) rounded-xl">
                <input
                  type="checkbox"
                  id="is_banned"
                  checked={editForm.is_banned}
                  onChange={(e) => setEditForm({ ...editForm, is_banned: e.target.checked })}
                  className="w-4 h-4 text-(--color-error) border-(--color-border) rounded focus:ring-(--color-error)"
                />
                <label htmlFor="is_banned" className="text-sm font-medium text-(--color-error)">
                  Ban this user
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 p-6 border-t border-(--color-border) bg-background rounded-b-2xl">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2.5 border border-(--color-border) rounded-xl text-foreground font-medium hover:bg-(--color-elevated) transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-(--brand-primary) text-white rounded-xl font-medium hover:bg-(--brand-primary-hover) transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {openMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setOpenMenu(null)}
        />
      )}
    </div>
  )
}
