"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface PageHeaderProps {
  title: string
  description?: string
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  showBackButton?: boolean
  backUrl?: string
  children?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  badge,
  badgeVariant = "outline",
  showBackButton = false,
  backUrl,
  children,
}: PageHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl)
    } else {
      router.back()
    }
  }

  return (
    <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-2xl font-bold">{title}</h1>
                {badge && (
                  <Badge variant={badgeVariant} className="text-xs">
                    {badge}
                  </Badge>
                )}
              </div>
              {description && <p className="text-muted-foreground">{description}</p>}
            </div>
          </div>
          {children && <div className="flex items-center space-x-2">{children}</div>}
        </div>
      </div>
    </div>
  )
}
