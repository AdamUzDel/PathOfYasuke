"use client"

import type React from "react"

import { useState } from "react"
import { AppHeader } from "./app-header"
import { AppSidebar } from "./app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-yasuke-dark via-background to-yasuke-darker">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader
            title={title}
            subtitle={subtitle}
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            showMenuButton
          />
          <main className="flex-1">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
