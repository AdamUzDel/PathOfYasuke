"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/components/providers/user-provider"
import { xpSystem } from "@/lib/xp-system"
import { Crown, Star, TrendingUp } from 'lucide-react'

interface XPDisplayProps {
  showDetails?: boolean
  className?: string
}

export function XPDisplay({ showDetails = false, className = "" }: XPDisplayProps) {
  const { profile } = useUser()
  const [xpToNext, setXpToNext] = useState(0)
  const [progressPercent, setProgressPercent] = useState(0)

  useEffect(() => {
    if (profile) {
      const nextLevelXP = xpSystem.getXPForNextLevel(profile.xp)
      const progress = xpSystem.getProgressToNextLevel(profile.xp)
      setXpToNext(nextLevelXP - profile.xp)
      setProgressPercent(progress)
    }
  }, [profile])

  if (!profile) return null

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Badge variant="outline" className="text-yasuke-crimson border-yasuke-crimson/50">
          <Crown className="w-3 h-3 mr-1" />
          Level {profile.level}
        </Badge>
        <Badge variant="outline" className="text-yasuke-gold border-yasuke-gold/50">
          <Star className="w-3 h-3 mr-1" />
          {profile.xp.toLocaleString()} XP
        </Badge>
      </div>
    )
  }

  return (
    <Card className={`bg-card/50 backdrop-blur-sm border-border/50 ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Level and XP */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yasuke-crimson to-yasuke-gold rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Level {profile.level}</h3>
                <p className="text-sm text-muted-foreground">{profile.xp.toLocaleString()} Total XP</p>
              </div>
            </div>
            <Badge variant="outline" className="text-yasuke-gold border-yasuke-gold/50">
              <TrendingUp className="w-3 h-3 mr-1" />
              {xpToNext.toLocaleString()} to next
            </Badge>
          </div>

          {/* Progress to Next Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress to Level {profile.level + 1}</span>
              <span className="text-muted-foreground">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {xpToNext.toLocaleString()} XP needed for next level
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
