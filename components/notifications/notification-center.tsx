"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useUser } from "@/components/providers/user-provider"
import { notificationSystem, type Notification } from "@/lib/notifications"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Bell, Check, Trash2, Star, Target, BookOpen, Crown, Flame } from 'lucide-react'
import { formatDistanceToNow } from "date-fns"

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "xp_gained":
      return <Star className="w-4 h-4 text-yasuke-gold" />
    case "level_up":
      return <Crown className="w-4 h-4 text-yasuke-crimson" />
    case "goal_completed":
      return <Target className="w-4 h-4 text-green-500" />
    case "quest_completed":
      return <Flame className="w-4 h-4 text-orange-500" />
    case "journal_entry":
      return <BookOpen className="w-4 h-4 text-blue-500" />
    default:
      return <Bell className="w-4 h-4 text-muted-foreground" />
  }
}

export function NotificationCenter() {
  const { user } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      fetchNotifications()
      fetchUnreadCount()

      // Subscribe to real-time notifications
      const subscription = notificationSystem.subscribeToNotifications(user.id, (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev])
        setUnreadCount((prev) => prev + 1)

        // Show toast for important notifications
        if (newNotification.type === "level_up") {
          toast({
            title: newNotification.title,
            description: newNotification.message,
          })
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user])

  const fetchNotifications = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const data = await notificationSystem.getNotifications(user.id)
      setNotifications(data)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    if (!user) return

    try {
      const count = await notificationSystem.getUnreadCount(user.id)
      setUnreadCount(count)
    } catch (error) {
      console.error("Error fetching unread count:", error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    const success = await notificationSystem.markAsRead(notificationId)
    if (success) {
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    const success = await notificationSystem.markAllAsRead(user.id)
    if (success) {
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
      setUnreadCount(0)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    const success = await notificationSystem.deleteNotification(notificationId)
    if (success) {
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId))
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find((n) => n.id === notificationId)
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-yasuke-crimson text-white text-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                Mark all read
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yasuke-crimson" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-muted/50 transition-colors ${
                    !notification.read ? "bg-yasuke-crimson/5 border-l-2 border-yasuke-crimson" : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
