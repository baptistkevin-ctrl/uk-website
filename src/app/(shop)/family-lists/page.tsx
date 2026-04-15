'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Plus,
  Copy,
  Check,
  ShoppingCart,
  ArrowRight,
  LogIn,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Container } from '@/components/layout/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { useFamilyListStore } from '@/stores/family-list-store'

const BREADCRUMB_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Family Lists' },
]

function MemberAvatars({
  members,
  size = 'md',
}: {
  members: { id: string; name: string }[]
  size?: 'sm' | 'md'
}) {
  const px = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-8 w-8 text-xs'

  return (
    <div className="flex -space-x-2">
      {members.slice(0, 4).map((m) => (
        <div
          key={m.id}
          className={cn(
            px,
            'flex items-center justify-center rounded-full',
            'border-2 border-(--color-surface) bg-(--brand-primary) text-white font-medium'
          )}
          title={m.name}
        >
          {m.name.charAt(0).toUpperCase()}
        </div>
      ))}
      {members.length > 4 && (
        <div
          className={cn(
            px,
            'flex items-center justify-center rounded-full',
            'border-2 border-(--color-surface) bg-(--color-elevated) text-(--color-text-muted) font-medium'
          )}
        >
          +{members.length - 4}
        </div>
      )}
    </div>
  )
}

function ShareCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5',
        'font-mono text-xs bg-(--color-elevated) px-2 py-0.5 rounded',
        'text-(--color-text-muted) hover:text-(--color-text-secondary) transition-colors'
      )}
      title="Copy share code"
    >
      {code}
      {copied ? (
        <Check className="h-3 w-3 text-(--color-success)" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  )
}

function ListCard({
  list,
}: {
  list: ReturnType<typeof useFamilyListStore.getState>['lists'][number]
}) {
  const { getUncheckedCount } = useFamilyListStore()
  const unchecked = getUncheckedCount(list.id)

  return (
    <Link
      href={`/family-lists/${list.id}`}
      className={cn(
        'group block rounded-xl border border-(--color-border)',
        'bg-(--color-surface) p-5',
        'hover:shadow-(--shadow-md) transition-all duration-200'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-(--color-text) group-hover:text-(--brand-primary) transition-colors">
          {list.name}
        </h3>
        <ArrowRight className="h-4 w-4 text-(--color-text-muted) opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <MemberAvatars members={list.members} />

      <p className="mt-3 text-sm text-(--color-text-muted)">
        {list.items.length} item{list.items.length !== 1 ? 's' : ''} &middot;{' '}
        {unchecked} unchecked
      </p>

      <div className="mt-3" onClick={(e) => e.preventDefault()}>
        <ShareCodeBadge code={list.shareCode} />
      </div>
    </Link>
  )
}

function CreateListDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const { createList } = useFamilyListStore()

  function handleCreate() {
    if (!name.trim()) return
    createList(name.trim())
    setName('')
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative w-full max-w-md rounded-2xl',
          'bg-(--color-surface) border border-(--color-border)',
          'p-6 shadow-(--shadow-md)'
        )}
      >
        <h2 className="text-xl font-display font-bold text-(--color-text) mb-4">
          Create a Family List
        </h2>
        <label className="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
          List Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="e.g. Weekly Shop, BBQ Supplies"
          className={cn(
            'w-full rounded-lg border border-(--color-border)',
            'bg-(--color-bg) px-4 py-2.5 text-sm text-(--color-text)',
            'placeholder:text-(--color-text-muted)',
            'focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/30 focus:border-(--brand-primary)',
            'transition-colors'
          )}
          autoFocus
        />
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className={cn(
              'flex-1 rounded-lg px-4 py-2.5 text-sm font-medium',
              'border border-(--color-border) text-(--color-text-secondary)',
              'hover:bg-(--color-elevated) transition-colors'
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className={cn(
              'flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold',
              'bg-(--brand-amber) text-white',
              'hover:bg-(--brand-amber-hover) transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Create List
          </button>
        </div>
      </div>
    </div>
  )
}

function JoinListSection() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const { lists, addMember } = useFamilyListStore()

  function handleJoin() {
    if (!code.trim()) return
    const found = lists.find(
      (l) => l.shareCode.toUpperCase() === code.trim().toUpperCase()
    )
    if (!found) {
      setError('No list found with that code. Double-check and try again.')
      return
    }
    addMember(found.id, { id: `member-${Date.now()}`, name: 'New Member' })
    setCode('')
    setError('')
  }

  return (
    <div className="mt-12 pt-8 border-t border-(--color-border)">
      <h2 className="text-lg font-semibold text-(--color-text) mb-2">
        Join an existing list
      </h2>
      <p className="text-sm text-(--color-text-muted) mb-4">
        Enter the share code from a family member to join their list.
      </p>
      <div className="flex gap-3 max-w-md">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase())
            setError('')
          }}
          placeholder="Enter share code"
          className={cn(
            'flex-1 rounded-lg border border-(--color-border)',
            'bg-(--color-bg) px-4 py-2.5 text-sm font-mono tracking-wider',
            'text-(--color-text) placeholder:text-(--color-text-muted)',
            'focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/30 focus:border-(--brand-primary)',
            'transition-colors uppercase'
          )}
        />
        <button
          onClick={handleJoin}
          disabled={!code.trim()}
          className={cn(
            'rounded-lg px-6 py-2.5 text-sm font-semibold',
            'bg-(--brand-primary) text-white',
            'hover:bg-(--brand-primary)/90 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          Join
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-(--color-error)">{error}</p>
      )}
    </div>
  )
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  const [showJoin, setShowJoin] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 lg:py-24">
      <div className="flex items-center justify-center h-24 w-24 rounded-full bg-(--brand-primary)/10 mb-6">
        <Users className="h-16 w-16 text-(--brand-primary)" />
      </div>
      <h1 className="text-3xl lg:text-4xl font-display font-bold text-(--color-text) mb-3">
        Family Shopping Lists
      </h1>
      <p className="text-(--color-text-muted) max-w-md mb-8">
        Create a shared list and shop together with your household. Everyone can
        add items, and you can add everything to your cart in one click.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onCreateClick}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg',
            'bg-(--brand-amber) text-white px-6 py-3 text-sm font-semibold',
            'hover:bg-(--brand-amber-hover) transition-colors',
            'shadow-(--shadow-amber)'
          )}
        >
          <Plus className="h-4 w-4" />
          Create a List
        </button>
        <button
          onClick={() => setShowJoin(true)}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg',
            'border border-(--color-border) text-(--color-text-secondary)',
            'px-6 py-3 text-sm font-medium',
            'hover:bg-(--color-elevated) transition-colors'
          )}
        >
          <LogIn className="h-4 w-4" />
          Join a List
        </button>
      </div>

      {showJoin && (
        <div className="mt-8 w-full max-w-md">
          <JoinListSection />
        </div>
      )}
    </div>
  )
}

export default function FamilyListsPage() {
  const { lists } = useFamilyListStore()
  const [showCreate, setShowCreate] = useState(false)

  const hasLists = lists.length > 0

  return (
    <Container size="lg" className="py-8 lg:py-12">
      <Breadcrumb items={BREADCRUMB_ITEMS} className="mb-6" />

      {!hasLists ? (
        <EmptyState onCreateClick={() => setShowCreate(true)} />
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-(--color-text)">
              Family Lists
            </h1>
            <button
              onClick={() => setShowCreate(true)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg',
                'bg-(--brand-amber) text-white px-4 py-2.5 text-sm font-semibold',
                'hover:bg-(--brand-amber-hover) transition-colors'
              )}
            >
              <Plus className="h-4 w-4" />
              Create New
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.map((list) => (
              <ListCard key={list.id} list={list} />
            ))}
          </div>

          <JoinListSection />
        </>
      )}

      <CreateListDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </Container>
  )
}
