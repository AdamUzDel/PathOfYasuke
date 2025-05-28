import { createClient } from "@/lib/supabase/client"

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data?: any
  read: boolean
  created_at: string
}

export class NotificationSystem {
  private supabase = createClient()

  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any
  ): Promise<Notification | null> {
    try {
      const { data, error } = await this.supabase
        .from("notifications")
        .insert([
          {
            user_id: userId,
            type,
            title,
            message,
            data,
            read: false,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating notification:", error)
      return null
    }
  }

  async getNotifications(userId: string, limit = 50): Promise<Notification[]> {
    try {
      const { data, error } = await this.supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching notifications:", error)
      return []
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId)

      return !error
    } catch (error) {
      console.error("Error marking notification as read:", error)
      return false
    }
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false)

      return !error
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      return false
    }
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.from("notifications").delete().eq("id", notificationId)

      return !error
    } catch (error) {
      console.error("Error deleting notification:", error)
      return false
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error("Error getting unread count:", error)
      return 0
    }
  }

  // Subscribe to real-time notifications
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    return this.supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification)
        }
      )
      .subscribe()
  }
}

export const notificationSystem = new NotificationSystem()
