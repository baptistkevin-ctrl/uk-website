'use client'

import { useState, useEffect } from 'react'
import {
  Mail,
  Users,
  Send,
  FileText,
  Plus,
  Search,
  Loader2,
  Eye,
  Trash2,
  Calendar,
  BarChart3,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Campaign {
  id: string
  subject: string
  status: string
  sent_count: number
  open_count: number
  click_count: number
  created_at: string
  scheduled_at: string | null
  sent_at: string | null
}

interface Subscriber {
  id: string
  email: string
  is_active: boolean
  subscribed_at: string
}

interface Stats {
  totalSubscribers: number
  activeSubscribers: number
  totalCampaigns: number
  recentCampaigns: Campaign[]
}

export default function NewsletterPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')

  // New campaign form
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [campaignSubject, setCampaignSubject] = useState('')
  const [campaignBody, setCampaignBody] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [statsRes, subscribersRes] = await Promise.all([
        fetch('/api/admin/newsletter?type=stats'),
        fetch('/api/admin/newsletter?type=subscribers&limit=50'),
      ])
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats({
          totalSubscribers: data.stats?.total_subscribers || 0,
          activeSubscribers: data.stats?.active_subscribers || 0,
          totalCampaigns: data.stats?.total_campaigns || 0,
          recentCampaigns: data.recentCampaigns || [],
        })
      }
      if (subscribersRes.ok) {
        const data = await subscribersRes.json()
        setSubscribers(data.subscribers || [])
      }
    } catch (error) {
      console.error('Failed to fetch newsletter data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCampaign() {
    if (!campaignSubject.trim() || !campaignBody.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignSubject,
          subject: campaignSubject,
          content_html: campaignBody,
        }),
      })
      if (res.ok) {
        setShowNewCampaign(false)
        setCampaignSubject('')
        setCampaignBody('')
        fetchData()
      }
    } catch (error) {
      console.error('Failed to create campaign:', error)
    } finally {
      setSending(false)
    }
  }

  async function handleSendCampaign(campaignId: string) {
    if (!confirm('Send this campaign to all active subscribers?')) return
    try {
      await fetch('/api/admin/newsletter', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, action: 'send' }),
      })
      fetchData()
    } catch (error) {
      console.error('Failed to send campaign:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  const filteredSubscribers = subscribers.filter(
    (s) => !searchQuery || s.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Newsletter</h1>
          <p className="text-(--color-text-muted)">Manage campaigns and subscribers</p>
        </div>
        <Button onClick={() => setShowNewCampaign(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-(--color-info-bg) rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-(--color-info)" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalSubscribers || 0}</p>
                <p className="text-xs text-(--color-text-muted)">Total Subscribers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-(--brand-primary-light) rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-(--brand-primary)" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.activeSubscribers || 0}</p>
                <p className="text-xs text-(--color-text-muted)">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-(--color-info-bg) rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-(--color-info)" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalCampaigns || 0}</p>
                <p className="text-xs text-(--color-text-muted)">Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-(--brand-amber-soft) rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-(--brand-amber)" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats?.recentCampaigns?.[0]?.open_count || 0}
                </p>
                <p className="text-xs text-(--color-text-muted)">Last Campaign Opens</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Campaign Form */}
      {showNewCampaign && (
        <Card className="border-(--brand-primary)/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Create Campaign
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Subject Line</Label>
              <Input
                value={campaignSubject}
                onChange={(e) => setCampaignSubject(e.target.value)}
                placeholder="This week's deals..."
              />
            </div>
            <div>
              <Label>Email Body (HTML)</Label>
              <textarea
                className="w-full min-h-50 rounded-lg border border-(--color-border) p-3 text-sm font-mono"
                value={campaignBody}
                onChange={(e) => setCampaignBody(e.target.value)}
                placeholder="<h1>Fresh Deals This Week</h1><p>Check out our latest offers...</p>"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleCreateCampaign} disabled={sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                Save Draft
              </Button>
              <Button variant="outline" onClick={() => setShowNewCampaign(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Campaigns</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {stats?.recentCampaigns && stats.recentCampaigns.length > 0 ? (
            <div className="space-y-3">
              {stats.recentCampaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{campaign.subject}</h3>
                          <Badge
                            variant={
                              campaign.status === 'sent' ? 'default' :
                              campaign.status === 'draft' ? 'secondary' :
                              'outline'
                            }
                          >
                            {campaign.status === 'sent' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {campaign.status === 'draft' && <Clock className="h-3 w-3 mr-1" />}
                            {campaign.status === 'scheduled' && <Calendar className="h-3 w-3 mr-1" />}
                            {campaign.status}
                          </Badge>
                        </div>
                        <div className="flex gap-4 text-sm text-(--color-text-muted)">
                          <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                          {campaign.sent_count > 0 && <span>{campaign.sent_count} sent</span>}
                          {campaign.open_count > 0 && <span>{campaign.open_count} opens</span>}
                          {campaign.click_count > 0 && <span>{campaign.click_count} clicks</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {campaign.status === 'draft' && (
                          <Button size="sm" onClick={() => handleSendCampaign(campaign.id)}>
                            <Send className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-(--color-text-muted)">
                <Mail className="h-12 w-12 mx-auto mb-3 text-(--color-text-disabled)" />
                <p>No campaigns yet. Create your first campaign above.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-text-disabled)" />
            <Input
              placeholder="Search subscribers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background">
                <tr>
                  <th className="text-left p-3 font-medium text-(--color-text-secondary)">Email</th>
                  <th className="text-left p-3 font-medium text-(--color-text-secondary)">Status</th>
                  <th className="text-left p-3 font-medium text-(--color-text-secondary)">Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscribers.map((sub) => (
                  <tr key={sub.id} className="border-t">
                    <td className="p-3">{sub.email}</td>
                    <td className="p-3">
                      <Badge variant={sub.is_active ? 'default' : 'secondary'}>
                        {sub.is_active ? 'Active' : 'Unsubscribed'}
                      </Badge>
                    </td>
                    <td className="p-3 text-(--color-text-muted)">
                      {new Date(sub.subscribed_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {filteredSubscribers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-(--color-text-muted)">
                      No subscribers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
