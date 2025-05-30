"use client"

import type React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useUser } from "@/components/providers/user-provider"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Home, Target, BookOpen, User, Settings, Store, Trophy, BarChart3, Crown, Sword, Plus } from "lucide-react"

const navigationItems = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: Home },
      { title: "Progress", url: "/progress", icon: BarChart3 },
    ],
  },
  {
    title: "Growth",
    items: [
      { title: "Paths", url: "/paths", icon: Target },
      { title: "Honor Journal", url: "/journal", icon: BookOpen },
      { title: "Quests", url: "/quests", icon: Sword },
    ],
  },
  {
    title: "Community",
    items: [
      { title: "Achievements", url: "/achievements", icon: Trophy },
      { title: "Leaderboard", url: "/leaderboard", icon: Crown },
      { title: "Store", url: "/store", icon: Store },
    ],
  },
  {
    title: "Account",
    items: [
      { title: "Profile", url: "/profile", icon: User },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useUser()

  return (
    <Sidebar {...props} className="">
      <SidebarHeader className="border-b bg-background border-border/50 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yasuke-crimson to-yasuke-gold rounded-lg flex items-center justify-center">
            <Sword className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold yasuke-text-gradient">Path of Yasuke</h2>
            <p className="text-xs text-muted-foreground">Forge your destiny</p>
          </div>
        </div>

        {profile && (
          <div className="mt-4 p-2 sm:p-3 bg-card/50 rounded-lg border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium">Level {profile.level}</span>
              <Badge variant="outline" className="text-xs">
                {profile.subscription_tier}
              </Badge>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
              <div
                className="bg-gradient-to-r from-yasuke-crimson to-yasuke-gold h-1.5 sm:h-2 rounded-full transition-all"
                style={{ width: `${(profile.xp % 1000) / 10}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{profile.xp} XP</p>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="bg-background">
        <ScrollArea className="flex-1">
          {navigationItems.map((section) => (
            <SidebarGroup key={section.title}>
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={pathname === item.url} className="w-full py-2 sm:py-3">
                        <button
                          onClick={() => router.push(item.url)}
                          className="flex items-center space-x-2 sm:space-x-3 w-full"
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="text-sm sm:text-base">{item.title}</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t bg-background border-border/50 p-4">
        <Button className="w-full yasuke-gradient hover:opacity-90" onClick={() => router.push("/paths/new")}>
          <Plus className="w-4 h-4 mr-2" />
          New Path
        </Button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
