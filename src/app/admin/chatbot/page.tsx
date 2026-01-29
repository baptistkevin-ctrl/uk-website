'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/layout'
import {
  Bot,
  MessageSquare,
  Settings,
  BookOpen,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  AlertCircle,
  Check,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
  Zap
} from 'lucide-react'

interface Intent {
  id: string
  intent_name: string
  description: string | null
  response_text: string
  response_type: string
  quick_replies: { text: string; value: string }[] | null
  is_active: boolean
  training_phrases: TrainingPhrase[]
}

interface TrainingPhrase {
  id: string
  phrase: string
  created_at: string
}

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  keywords: string[]
  is_active: boolean
  view_count: number
  helpful_count: number
  order_index: number
}

interface ChatbotSettings {
  is_enabled: boolean
  bot_name: string
  welcome_message: string
  bot_avatar: string
  typing_delay_ms: number
  fallback_threshold: number
  handoff_keywords: string[]
}

interface ConversationStats {
  total_conversations: number
  bot_handled: number
  handoff_rate: number
  avg_confidence: number
  top_intents: { intent: string; count: number }[]
}

export default function AdminChatbotPage() {
  const [activeTab, setActiveTab] = useState<'intents' | 'faqs' | 'settings' | 'analytics'>('intents')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Data
  const [intents, setIntents] = useState<Intent[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [settings, setSettings] = useState<ChatbotSettings>({
    is_enabled: true,
    bot_name: 'FreshBot',
    welcome_message: "Hi! I'm FreshBot, your virtual assistant. How can I help you today?",
    bot_avatar: '/images/bot-avatar.png',
    typing_delay_ms: 1000,
    fallback_threshold: 0.3,
    handoff_keywords: ['agent', 'human', 'person', 'speak to someone']
  })
  const [stats, setStats] = useState<ConversationStats | null>(null)

  // Edit states
  const [editingIntent, setEditingIntent] = useState<Intent | null>(null)
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [expandedIntents, setExpandedIntents] = useState<Set<string>>(new Set())

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  // New training phrase
  const [newPhrase, setNewPhrase] = useState('')
  const [addingPhraseToIntent, setAddingPhraseToIntent] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [intentsRes, faqsRes, settingsRes, statsRes] = await Promise.all([
        fetch('/api/admin/chatbot/intents'),
        fetch('/api/admin/chatbot/faqs'),
        fetch('/api/admin/chatbot/settings'),
        fetch('/api/admin/chatbot/analytics')
      ])

      if (intentsRes.ok) {
        const data = await intentsRes.json()
        setIntents(data.intents || [])
      }
      if (faqsRes.ok) {
        const data = await faqsRes.json()
        setFaqs(data.faqs || [])
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings(data.settings || settings)
      }
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch chatbot data:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/chatbot/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (res.ok) {
        alert('Settings saved successfully!')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const toggleIntentActive = async (intent: Intent) => {
    try {
      await fetch(`/api/admin/chatbot/intents/${intent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !intent.is_active })
      })
      setIntents(prev =>
        prev.map(i => i.id === intent.id ? { ...i, is_active: !i.is_active } : i)
      )
    } catch (error) {
      console.error('Failed to toggle intent:', error)
    }
  }

  const addTrainingPhrase = async (intentId: string) => {
    if (!newPhrase.trim()) return

    try {
      const res = await fetch(`/api/admin/chatbot/intents/${intentId}/phrases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase: newPhrase })
      })

      if (res.ok) {
        const data = await res.json()
        setIntents(prev =>
          prev.map(i => {
            if (i.id === intentId) {
              return {
                ...i,
                training_phrases: [...i.training_phrases, data.phrase]
              }
            }
            return i
          })
        )
        setNewPhrase('')
        setAddingPhraseToIntent(null)
      }
    } catch (error) {
      console.error('Failed to add phrase:', error)
    }
  }

  const deleteTrainingPhrase = async (intentId: string, phraseId: string) => {
    if (!confirm('Delete this training phrase?')) return

    try {
      await fetch(`/api/admin/chatbot/intents/${intentId}/phrases/${phraseId}`, {
        method: 'DELETE'
      })

      setIntents(prev =>
        prev.map(i => {
          if (i.id === intentId) {
            return {
              ...i,
              training_phrases: i.training_phrases.filter(p => p.id !== phraseId)
            }
          }
          return i
        })
      )
    } catch (error) {
      console.error('Failed to delete phrase:', error)
    }
  }

  const saveFaq = async () => {
    if (!editingFaq) return

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/chatbot/faqs/${editingFaq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingFaq)
      })

      if (res.ok) {
        setFaqs(prev =>
          prev.map(f => f.id === editingFaq.id ? editingFaq : f)
        )
        setEditingFaq(null)
      }
    } catch (error) {
      console.error('Failed to save FAQ:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleFaqActive = async (faq: FAQ) => {
    try {
      await fetch(`/api/admin/chatbot/faqs/${faq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !faq.is_active })
      })
      setFaqs(prev =>
        prev.map(f => f.id === faq.id ? { ...f, is_active: !f.is_active } : f)
      )
    } catch (error) {
      console.error('Failed to toggle FAQ:', error)
    }
  }

  const filteredIntents = intents.filter(intent =>
    intent.intent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    intent.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleExpanded = (intentId: string) => {
    setExpandedIntents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(intentId)) {
        newSet.delete(intentId)
      } else {
        newSet.add(intentId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bot className="h-7 w-7 text-emerald-600" />
              Chatbot Management
            </h1>
            <p className="text-gray-500 mt-1">
              Configure your AI chatbot, manage intents, FAQs, and settings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              settings.is_enabled
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {settings.is_enabled ? 'Bot Active' : 'Bot Disabled'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-4">
            {[
              { id: 'intents', label: 'Intents', icon: MessageSquare },
              { id: 'faqs', label: 'FAQs', icon: HelpCircle },
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Intents Tab */}
          {activeTab === 'intents' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search intents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredIntents.map(intent => (
                  <div
                    key={intent.id}
                    className={`border rounded-lg overflow-hidden ${
                      intent.is_active ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleExpanded(intent.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {expandedIntents.has(intent.id) ? (
                              <ChevronUp className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                          <div>
                            <h3 className="font-medium text-gray-900">{intent.intent_name}</h3>
                            <p className="text-sm text-gray-500">{intent.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {intent.training_phrases.length} phrases
                          </span>
                          <button
                            onClick={() => toggleIntentActive(intent)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              intent.is_active
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                          >
                            {intent.is_active ? (
                              <ToggleRight className="h-5 w-5" />
                            ) : (
                              <ToggleLeft className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Response Preview */}
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-700">Response:</span>{' '}
                          {intent.response_text.length > 150
                            ? intent.response_text.substring(0, 150) + '...'
                            : intent.response_text}
                        </p>
                        {intent.quick_replies && intent.quick_replies.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {intent.quick_replies.map((qr, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600"
                              >
                                {qr.text}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded Training Phrases */}
                    {expandedIntents.has(intent.id) && (
                      <div className="border-t bg-gray-50 p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Training Phrases</h4>
                        <div className="space-y-2">
                          {intent.training_phrases.map(phrase => (
                            <div
                              key={phrase.id}
                              className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-100"
                            >
                              <span className="text-sm text-gray-600">{phrase.phrase}</span>
                              <button
                                onClick={() => deleteTrainingPhrase(intent.id, phrase.id)}
                                className="p-1 text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}

                          {addingPhraseToIntent === intent.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={newPhrase}
                                onChange={(e) => setNewPhrase(e.target.value)}
                                placeholder="Enter new training phrase..."
                                className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500"
                                autoFocus
                              />
                              <button
                                onClick={() => addTrainingPhrase(intent.id)}
                                className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setAddingPhraseToIntent(null)
                                  setNewPhrase('')
                                }}
                                className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAddingPhraseToIntent(intent.id)}
                              className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                            >
                              <Plus className="h-4 w-4" />
                              Add phrase
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs Tab */}
          {activeTab === 'faqs' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search FAQs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredFaqs.map(faq => (
                  <div
                    key={faq.id}
                    className={`border rounded-lg p-4 ${
                      faq.is_active ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    {editingFaq?.id === faq.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Question
                          </label>
                          <input
                            type="text"
                            value={editingFaq.question}
                            onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Answer
                          </label>
                          <textarea
                            value={editingFaq.answer}
                            onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                            rows={4}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Category
                            </label>
                            <input
                              type="text"
                              value={editingFaq.category}
                              onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Keywords (comma separated)
                            </label>
                            <input
                              type="text"
                              value={editingFaq.keywords.join(', ')}
                              onChange={(e) => setEditingFaq({
                                ...editingFaq,
                                keywords: e.target.value.split(',').map(k => k.trim())
                              })}
                              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={saveFaq}
                            disabled={saving}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                          >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save
                          </button>
                          <button
                            onClick={() => setEditingFaq(null)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                              {faq.category}
                            </span>
                            <span className="text-xs text-gray-400">
                              {faq.view_count} views
                            </span>
                          </div>
                          <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                          <p className="text-sm text-gray-600">{faq.answer}</p>
                          {faq.keywords.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {faq.keywords.map((kw, idx) => (
                                <span key={idx} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          <button
                            onClick={() => setEditingFaq(faq)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleFaqActive(faq)}
                            className={`p-1.5 rounded transition-colors ${
                              faq.is_active
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                          >
                            {faq.is_active ? (
                              <ToggleRight className="h-5 w-5" />
                            ) : (
                              <ToggleLeft className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="p-6">
              <div className="max-w-2xl space-y-6">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Enable Chatbot</h3>
                    <p className="text-sm text-gray-500">
                      When disabled, customers will be connected directly to agents
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, is_enabled: !settings.is_enabled })}
                    className={`p-2 rounded-lg transition-colors ${
                      settings.is_enabled
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {settings.is_enabled ? (
                      <ToggleRight className="h-8 w-8" />
                    ) : (
                      <ToggleLeft className="h-8 w-8" />
                    )}
                  </button>
                </div>

                {/* Bot Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bot Name
                  </label>
                  <input
                    type="text"
                    value={settings.bot_name}
                    onChange={(e) => setSettings({ ...settings, bot_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Welcome Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Welcome Message
                  </label>
                  <textarea
                    value={settings.welcome_message}
                    onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Typing Delay */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Typing Delay (ms)
                  </label>
                  <input
                    type="number"
                    value={settings.typing_delay_ms}
                    onChange={(e) => setSettings({ ...settings, typing_delay_ms: parseInt(e.target.value) })}
                    min={0}
                    max={5000}
                    step={100}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Simulates typing before bot responds (0-5000ms)
                  </p>
                </div>

                {/* Confidence Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confidence Threshold
                  </label>
                  <input
                    type="range"
                    value={settings.fallback_threshold}
                    onChange={(e) => setSettings({ ...settings, fallback_threshold: parseFloat(e.target.value) })}
                    min={0}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Low (0)</span>
                    <span>Current: {(settings.fallback_threshold * 100).toFixed(0)}%</span>
                    <span>High (100%)</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Bot uses fallback response if confidence is below this threshold
                  </p>
                </div>

                {/* Handoff Keywords */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Handoff Keywords
                  </label>
                  <input
                    type="text"
                    value={settings.handoff_keywords.join(', ')}
                    onChange={(e) => setSettings({
                      ...settings,
                      handoff_keywords: e.target.value.split(',').map(k => k.trim())
                    })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Words that trigger immediate transfer to human agent (comma separated)
                  </p>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Settings
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="p-6">
              {stats ? (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-emerald-600">Total Conversations</p>
                          <p className="text-2xl font-bold text-emerald-800">
                            {stats.total_conversations}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-blue-600">Bot Handled</p>
                          <p className="text-2xl font-bold text-blue-800">
                            {stats.bot_handled}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                          <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-amber-600">Handoff Rate</p>
                          <p className="text-2xl font-bold text-amber-800">
                            {(stats.handoff_rate * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-purple-600">Avg Confidence</p>
                          <p className="text-2xl font-bold text-purple-800">
                            {(stats.avg_confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Intents */}
                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Top Matched Intents</h3>
                    <div className="space-y-3">
                      {stats.top_intents.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <span className="text-sm font-medium text-gray-500 w-6">
                            #{idx + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">
                                {item.intent}
                              </span>
                              <span className="text-sm text-gray-500">
                                {item.count} times
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className="bg-emerald-500 h-2 rounded-full"
                                style={{
                                  width: `${(item.count / stats.top_intents[0].count) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No analytics data available yet</p>
                  <p className="text-sm">Data will appear once the chatbot starts handling conversations</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
