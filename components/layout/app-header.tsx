"use client"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { XPDisplay } from "@/components/ui/xp-display"
import { useUser } from "@/components/providers/user-provider"
import { User, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AppHeaderProps {
  title?: string
  subtitle?: string
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export function AppHeader({ title, subtitle, onMenuClick, showMenuButton = true }: AppHeaderProps) {
  const { user, profile } = useUser()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        {/* Left side - Menu trigger and title */}
        <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
          {showMenuButton && (
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
          )}

          {(title || subtitle) && (
            <div className="hidden sm:block min-w-0 flex-1">
              {title && <h1 className="text-lg font-semibold truncate">{title}</h1>}
              {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
            </div>
          )}
        </div>

        {/* Center - XP Display (hidden on small screens) */}
        <div className="hidden lg:flex items-center justify-center flex-1">
          {profile && <XPDisplay xp={profile.xp} level={profile.level} />}
        </div>

        {/* Right side - Notifications and user menu */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* XP Display for mobile/tablet */}
          <div className="lg:hidden">
            {profile && (
              <div className="flex items-center space-x-2 text-xs sm:text-sm">
                <span className="font-medium">Lv.{profile.level}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-yasuke-gold font-medium">{profile.xp} XP</span>
              </div>
            )}
          </div>

          <NotificationCenter />

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || ""} alt={user.name || ""} />
                    <AvatarFallback className="yasuke-gradient text-white text-xs">
                      {user.name ? getUserInitials(user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Mobile title display */}
      {(title || subtitle) && (
        <div className="sm:hidden px-4 pb-3 border-b border-border/30">
          {title && <h1 className="text-base font-semibold truncate">{title}</h1>}
          {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
        </div>
      )}
    </header>
  )
}
