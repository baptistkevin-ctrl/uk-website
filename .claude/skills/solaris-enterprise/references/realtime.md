# Real-Time Patterns

> For UK Taxi (live tracking), UK Grocery (order updates), Webcrafts
> (live previews). Using Supabase Realtime.

---

## 1. REAL-TIME SUBSCRIPTION HOOK

```typescript
// src/hooks/use-realtime.ts

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface UseRealtimeOptions<T> {
  table: string
  filter?: string             // e.g., "vendor_id=eq.vendor_123"
  event?: "INSERT" | "UPDATE" | "DELETE" | "*"
  onInsert?: (record: T) => void
  onUpdate?: (record: T) => void
  onDelete?: (record: T) => void
}

export function useRealtime<T>(options: UseRealtimeOptions<T>) {
  const { table, filter, event = "*", onInsert, onUpdate, onDelete } = options
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let channel: RealtimeChannel

    const channelName = `realtime:${table}:${filter || "all"}`

    channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event,
          schema: "public",
          table,
          ...(filter && { filter }),
        },
        (payload) => {
          switch (payload.eventType) {
            case "INSERT":
              onInsert?.(payload.new as T)
              break
            case "UPDATE":
              onUpdate?.(payload.new as T)
              break
            case "DELETE":
              onDelete?.(payload.old as T)
              break
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED")
      })

    return () => {
      channel.unsubscribe()
    }
  }, [table, filter, event])

  return { isConnected }
}

// Usage — live order updates for a vendor:
function VendorDashboard({ vendorId }: { vendorId: string }) {
  const [orders, setOrders] = useState<Order[]>([])

  useRealtime<Order>({
    table: "orders",
    filter: `vendor_id=eq.${vendorId}`,
    onInsert: (newOrder) => {
      setOrders((prev) => [newOrder, ...prev])
      toast({ title: "New order!", description: `Order #${newOrder.id}` })
      playNotificationSound()
    },
    onUpdate: (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      )
    },
  })

  return <OrderList orders={orders} />
}
```

## 2. PRESENCE (Who's Online)

```typescript
// src/hooks/use-presence.ts

export function usePresence(roomId: string, userData: { id: string; name: string }) {
  const [onlineUsers, setOnlineUsers] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase.channel(`presence:${roomId}`)

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState()
        const users = Object.values(state)
          .flat()
          .map((p: any) => ({ id: p.userId, name: p.userName }))
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId: userData.id,
            userName: userData.name,
            onlineAt: new Date().toISOString(),
          })
        }
      })

    return () => { channel.unsubscribe() }
  }, [roomId, userData.id])

  return { onlineUsers, isUserOnline: (id: string) => onlineUsers.some((u) => u.id === id) }
}

// Usage — show who's viewing the admin dashboard:
function AdminDashboard({ currentUser }: Props) {
  const { onlineUsers } = usePresence("admin-dashboard", {
    id: currentUser.id,
    name: currentUser.name,
  })

  return (
    <div>
      <p>{onlineUsers.length} admin(s) online</p>
      {onlineUsers.map((u) => <Avatar key={u.id} name={u.name} />)}
    </div>
  )
}
```

## 3. LIVE NOTIFICATIONS

```typescript
// src/hooks/use-notifications.ts

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Load initial notifications
  useEffect(() => {
    loadNotifications(userId).then((data) => {
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.readAt).length)
    })
  }, [userId])

  // Listen for new ones in real-time
  useRealtime<Notification>({
    table: "notifications",
    filter: `user_id=eq.${userId}`,
    event: "INSERT",
    onInsert: (notification) => {
      setNotifications((prev) => [notification, ...prev])
      setUnreadCount((prev) => prev + 1)

      // Browser notification (if permitted)
      if (Notification.permission === "granted") {
        new Notification(notification.title, { body: notification.body })
      }
    },
  })

  const markAsRead = useCallback(async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  return { notifications, unreadCount, markAsRead }
}
```

## 4. DATABASE SETUP FOR REALTIME

```sql
-- Enable realtime on specific tables only (not all — saves resources)
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- DO NOT enable realtime on: users, payments, audit_logs (too sensitive/heavy)
```
