import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FamilyListItem {
  id: string
  productId?: string
  customName?: string
  productName?: string
  productImage?: string
  productPrice?: number
  quantity: number
  checked: boolean
  addedBy: string
  addedById: string
  addedAt: string
  note?: string
}

export interface FamilyListMember {
  id: string
  name: string
  avatar?: string
  isOwner: boolean
}

export interface FamilyList {
  id: string
  name: string
  shareCode: string
  items: FamilyListItem[]
  members: FamilyListMember[]
  ownerId: string
  createdAt: string
}

interface FamilyListStore {
  lists: FamilyList[]
  activeListId: string | null

  // List management
  createList: (name: string) => FamilyList
  deleteList: (listId: string) => void
  setActiveList: (listId: string | null) => void
  getActiveList: () => FamilyList | null

  // Item management
  addItem: (listId: string, item: Omit<FamilyListItem, 'id' | 'checked' | 'addedAt'>) => void
  removeItem: (listId: string, itemId: string) => void
  toggleItem: (listId: string, itemId: string) => void
  updateItemQuantity: (listId: string, itemId: string, quantity: number) => void

  // Member management
  addMember: (listId: string, member: { id: string; name: string }) => void

  // Cart integration
  addAllToCart: (listId: string) => FamilyListItem[]

  // Counts
  getUncheckedCount: (listId: string) => number
  getTotalPrice: (listId: string) => number

  // List name update
  updateListName: (listId: string, name: string) => void

  // Sync helpers
  syncFromApi: (lists: FamilyList[]) => void
  syncListDetail: (listId: string, items: FamilyListItem[], members: FamilyListMember[]) => void
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => chars[b % chars.length]).join('')
}

export const useFamilyListStore = create<FamilyListStore>()(
  persist(
    (set, get) => ({
      lists: [],
      activeListId: null,

      createList: (name: string) => {
        const newList: FamilyList = {
          id: generateId(),
          name,
          shareCode: generateShareCode(),
          items: [],
          members: [],
          ownerId: 'local',
          createdAt: new Date().toISOString(),
        }

        set(state => ({
          lists: [...state.lists, newList],
          activeListId: newList.id,
        }))
        return newList
      },

      deleteList: (listId: string) => {
        set(state => ({
          lists: state.lists.filter(l => l.id !== listId),
          activeListId: state.activeListId === listId ? null : state.activeListId,
        }))
      },

      setActiveList: (listId: string | null) => {
        set({ activeListId: listId })
      },

      getActiveList: () => {
        const { lists, activeListId } = get()
        if (!activeListId) return null
        return lists.find(l => l.id === activeListId) || null
      },

      addItem: (listId, item) => {
        const newItem: FamilyListItem = {
          ...item,
          id: generateId(),
          checked: false,
          addedAt: new Date().toISOString(),
        }

        set(state => ({
          lists: state.lists.map(list =>
            list.id === listId
              ? { ...list, items: [...list.items, newItem] }
              : list
          ),
        }))
      },

      removeItem: (listId, itemId) => {
        set(state => ({
          lists: state.lists.map(list =>
            list.id === listId
              ? { ...list, items: list.items.filter(i => i.id !== itemId) }
              : list
          ),
        }))
      },

      toggleItem: (listId, itemId) => {
        set(state => ({
          lists: state.lists.map(list =>
            list.id === listId
              ? {
                  ...list,
                  items: list.items.map(i =>
                    i.id === itemId ? { ...i, checked: !i.checked } : i
                  ),
                }
              : list
          ),
        }))
      },

      updateItemQuantity: (listId, itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(listId, itemId)
          return
        }

        set(state => ({
          lists: state.lists.map(list =>
            list.id === listId
              ? {
                  ...list,
                  items: list.items.map(i =>
                    i.id === itemId ? { ...i, quantity } : i
                  ),
                }
              : list
          ),
        }))
      },

      addMember: (listId, member) => {
        set(state => ({
          lists: state.lists.map(list => {
            if (list.id !== listId) return list
            const exists = list.members.some(m => m.id === member.id)
            if (exists) return list
            return {
              ...list,
              members: [
                ...list.members,
                { ...member, isOwner: false },
              ],
            }
          }),
        }))
      },

      addAllToCart: (listId) => {
        const list = get().lists.find(l => l.id === listId)
        if (!list) return []
        return list.items.filter(item => !item.checked && item.productId)
      },

      getUncheckedCount: (listId) => {
        const list = get().lists.find(l => l.id === listId)
        if (!list) return 0
        return list.items.filter(i => !i.checked).length
      },

      getTotalPrice: (listId) => {
        const list = get().lists.find(l => l.id === listId)
        if (!list) return 0
        return list.items.reduce((total, item) => {
          if (item.checked) return total
          return total + (item.productPrice || 0) * item.quantity
        }, 0)
      },

      updateListName: (listId, name) => {
        set(state => ({
          lists: state.lists.map(list =>
            list.id === listId ? { ...list, name } : list
          ),
        }))
      },

      syncFromApi: (lists) => {
        set({ lists })
      },

      syncListDetail: (listId, items, members) => {
        set(state => ({
          lists: state.lists.map(list =>
            list.id === listId
              ? { ...list, items, members }
              : list
          ),
        }))
      },
    }),
    {
      name: 'family-lists-storage',
      partialize: (state) => ({
        lists: state.lists,
        activeListId: state.activeListId,
      }),
    }
  )
)
