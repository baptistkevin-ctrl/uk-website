import { useEffect, useState } from "react"
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
