import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

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
          .map((p: Record<string, unknown>) => ({
            id: p.userId as string,
            name: p.userName as string,
          }))
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

    return () => {
      channel.unsubscribe()
    }
  }, [roomId, userData.id])

  return {
    onlineUsers,
    isUserOnline: (id: string) => onlineUsers.some((u) => u.id === id),
  }
}
