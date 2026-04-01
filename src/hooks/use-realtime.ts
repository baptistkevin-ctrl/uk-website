import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

interface UseRealtimeOptions<T extends Record<string, unknown>> {
  table: string
  filter?: string             // e.g., "vendor_id=eq.vendor_123"
  event?: "INSERT" | "UPDATE" | "DELETE" | "*"
  onInsert?: (record: T) => void
  onUpdate?: (record: T) => void
  onDelete?: (record: T) => void
}

export function useRealtime<T extends Record<string, unknown>>(options: UseRealtimeOptions<T>) {
  const { table, filter, event = "*", onInsert, onUpdate, onDelete } = options
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let channel: RealtimeChannel

    const channelName = `realtime:${table}:${filter || "all"}`

    channel = supabase
      .channel(channelName)
      .on<T>(
        "postgres_changes" as const,
        {
          event: event as "*",
          schema: "public",
          table,
          ...(filter && { filter }),
        },
        (payload: RealtimePostgresChangesPayload<T>) => {
          switch (payload.eventType) {
            case "INSERT":
              onInsert?.(payload.new)
              break
            case "UPDATE":
              onUpdate?.(payload.new)
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
