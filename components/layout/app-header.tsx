"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUser } from "@/components/providers/user-provider"
import { useRouter } from "next/navigation"
import { Sword, Flame, Settings, LogOut, User, Bell, Menu } from 'lucide-react'
import Link from "next/link"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { XPDisplay } from "@/components/ui/xp-display"

interface AppHeaderProps {
  title?: string
  subtitle?: string
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export function AppHeader({
  title = "Path of Yasuke",
  subtitle = "Dashboard",
  onMenuClick,
  showMenuButton = false,
}: AppHeaderProps) {
  const { user, profile, signOut } = useUser()
  const router = useRouter()
  const [notifications] = useState(0) // TODO: Implement notifications

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  if (!user || !profile) return null

  return (
    <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {showMenuButton && (
            <Button variant="ghost" size="sm" onClick={onMenuClick} className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          )}

          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yasuke-crimson to-yasuke-gold rounded-lg flex items-center justify-center">
              <Sword className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold yasuke-text-gradient">{title}</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">{subtitle}</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {/* Streak Badge */}
          <XPDisplay className="hidden sm:block" />

          {/* Replace the existing notifications Button with: */}
          <NotificationCenter />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.full_name} />
                  <AvatarFallback>{profile.full_name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      Level {profile.level}
                    </Badge>
                    <Badge variant="outline" className="text-xs text-yasuke-gold border-yasuke-gold/50">
                      {profile.xp} XP
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
