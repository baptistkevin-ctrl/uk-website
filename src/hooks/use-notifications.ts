import { useEffect, useState, useCallback } from "react"
import { useRealtime } from "./use-realtime"
import { createClient } from "@/lib/supabase/client"

interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  action_url?: string
  read_at: string | null
  created_at: string
}

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Load initial notifications
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) {
          setNotifications(data)
          setUnreadCount(data.filter((n) => !n.read_at).length)
        }
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
    },
  })

  const markAsRead = useCallback(async (notificationId: string) => {
    const supabase = createClient()
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
      )
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(async () => {
    const supabase = createClient()
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null)

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    )
    setUnreadCount(0)
  }, [userId])

  return { notifications, unreadCount, markAsRead, markAllAsRead }
}
