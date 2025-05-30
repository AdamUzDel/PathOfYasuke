"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/components/providers/user-provider"
import { createClient } from "@/lib/supabase/client"
import { Target, BookOpen, Award, Star } from "lucide-react"

interface DetailedStats {
  paths: {
    total: number
    active: number
    completed: number
  }
  goals: {
    total: number
    completed: number
    inProgress: number
    pending: number
  }
  journal: {
    totalEntries: number
    thisMonth: number
    averageMood: number
    longestStreak: number
  }
  xp: {
    total: number
    thisWeek: number
    thisMonth: number
    fromGoals: number
    fromJournal: number
    fromQuests: number
  }
}

export function ProfileStats() {
  const { user } = useUser()
  const [stats, setStats] = useState<DetailedStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchDetailedStats()
    }
  }, [user])

  const fetchDetailedStats = async () => {
    if (!user) return

    try {
      // Fetch paths data
      const { data: pathsData } = await supabase.from("paths").select("id, progress").eq("user_id", user.id)

      // Fetch goals data
      const { data: goalsData } = await supabase
        .from("goals")
        .select("id, completed, status, path_id")
        .in("path_id", pathsData?.map((p) => p.id) || [])

      // Fetch journal data
      const { data: journalData } = await supabase
        .from("journal_entries")
        .select("id, created_at, mood")
        .eq("user_id", user.id)

      // Fetch XP data
      const { data: xpData } = await supabase
        .from("xp_transactions")
        .select("amount, source, created_at")
        .eq("user_id", user.id)

      // Calculate stats
      const now = new Date()
      const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()))
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const detailedStats: DetailedStats = {
        paths: {
          total: pathsData?.length || 0,
          active: pathsData?.filter((p) => p.progress > 0 && p.progress < 100).length || 0,
          completed: pathsData?.filter((p) => p.progress === 100).length || 0,
        },
        goals: {
          total: goalsData?.length || 0,
          completed: goalsData?.filter((g) => g.completed).length || 0,
          inProgress: goalsData?.filter((g) => g.status === "in_progress").length || 0,
          pending: goalsData?.filter((g) => g.status === "pending").length || 0,
        },
        journal: {
          totalEntries: journalData?.length || 0,
          thisMonth: journalData?.filter((j) => new Date(j.created_at) >= thisMonthStart).length || 0,
          averageMood:
            journalData?.filter((j) => j.mood).reduce((sum, j) => sum + (j.mood || 0), 0) /
              (journalData?.filter((j) => j.mood).length || 1) || 0,
          longestStreak: calculateJournalStreak(journalData || []),
        },
        xp: {
          total: xpData?.reduce((sum, x) => sum + x.amount, 0) || 0,
          thisWeek:
            xpData?.filter((x) => new Date(x.created_at) >= thisWeekStart).reduce((sum, x) => sum + x.amount, 0) || 0,
          thisMonth:
            xpData?.filter((x) => new Date(x.created_at) >= thisMonthStart).reduce((sum, x) => sum + x.amount, 0) || 0,
          fromGoals: xpData?.filter((x) => x.source === "goal").reduce((sum, x) => sum + x.amount, 0) || 0,
          fromJournal: xpData?.filter((x) => x.source === "journal").reduce((sum, x) => sum + x.amount, 0) || 0,
          fromQuests: xpData?.filter((x) => x.source === "quest").reduce((sum, x) => sum + x.amount, 0) || 0,
        },
      }

      setStats(detailedStats)
    } catch (error) {
      console.error("Error fetching detailed stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateJournalStreak = (entries: any[]) => {
    if (entries.length === 0) return 0

    const sortedEntries = [...entries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )

    let longestStreak = 0
    let currentStreak = 0
    let lastDate = new Date(sortedEntries[0].created_at)

    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.created_at)
      const daysDiff = Math.floor((lastDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff <= 1) {
        currentStreak++
      } else {
        longestStreak = Math.max(longestStreak, currentStreak)
        currentStreak = 1
      }

      lastDate = entryDate
    }

    return Math.max(longestStreak, currentStreak)
  }

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded w-1/3" />
                <div className="h-2 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Paths Statistics */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-yasuke-crimson" />
            Growth Paths
          </CardTitle>
          <CardDescription>Your path creation and completion progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-yasuke-crimson">{stats.paths.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yasuke-gold">{stats.paths.active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">{stats.paths.completed}</p>
              <p className="text-xs text-muted-foreground">Done</p>
            </div>
          </div>

          {stats.paths.total > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round((stats.paths.completed / stats.paths.total) * 100)}%
                </span>
              </div>
              <Progress value={(stats.paths.completed / stats.paths.total) * 100} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goals Statistics */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="w-5 h-5 mr-2 text-yasuke-gold" />
            Goals Progress
          </CardTitle>
          <CardDescription>Your goal completion and status breakdown</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-500">{stats.goals.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yasuke-gold">{stats.goals.inProgress}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </div>

          {stats.goals.total > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Success Rate</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round((stats.goals.completed / stats.goals.total) * 100)}%
                </span>
              </div>
              <Progress value={(stats.goals.completed / stats.goals.total) * 100} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Journal Statistics */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
            Journal Insights
          </CardTitle>
          <CardDescription>Your reflection and mood tracking progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-500">{stats.journal.totalEntries}</p>
              <p className="text-xs text-muted-foreground">Total Entries</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-500">{stats.journal.longestStreak}</p>
              <p className="text-xs text-muted-foreground">Best Streak</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">This Month</span>
              <Badge variant="outline">{stats.journal.thisMonth} entries</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Average Mood</span>
              <Badge variant="outline">{stats.journal.averageMood.toFixed(1)}/5</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* XP Statistics */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="w-5 h-5 mr-2 text-yasuke-gold" />
            Experience Points
          </CardTitle>
          <CardDescription>Your XP earning breakdown and trends</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-yasuke-gold">{stats.xp.thisWeek}</p>
              <p className="text-xs text-muted-foreground">This Week</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yasuke-crimson">{stats.xp.thisMonth}</p>
              <p className="text-xs text-muted-foreground">This Month</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Goals</span>
              <span className="font-medium">{stats.xp.fromGoals} XP</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Journal</span>
              <span className="font-medium">{stats.xp.fromJournal} XP</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Quests</span>
              <span className="font-medium">{stats.xp.fromQuests} XP</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
