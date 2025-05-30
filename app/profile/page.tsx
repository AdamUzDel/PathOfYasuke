"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/components/providers/user-provider"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Crown, Star, Target, BookOpen, Flame, Shield, Calendar, TrendingUp, Award, Edit, Settings } from "lucide-react"
import { xpSystem } from "@/lib/xp-system"
import type { XPTransaction } from "@/types"
import { formatDistanceToNow, format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"

interface ProfileStats {
  totalPaths: number
  completedGoals: number
  totalGoals: number
  journalEntries: number
  currentStreak: number
  longestStreak: number
  totalXP: number
  level: number
  joinDate: string
}

interface ActivityData {
  date: string
  xp: number
  activities: number
}

export default function ProfilePage() {
  const { user, profile } = useUser()
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [xpHistory, setXpHistory] = useState<XPTransaction[]>([])
  const [weeklyActivity, setWeeklyActivity] = useState<ActivityData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (user && profile) {
      fetchProfileData()
    }
  }, [user, profile])

  const fetchProfileData = async () => {
    if (!user) return

    try {
      // Fetch basic stats
      const [pathsResult, goalsResult, journalResult, xpResult] = await Promise.all([
        supabase.from("paths").select("id").eq("user_id", user.id),
        supabase.from("goals").select("id, completed").eq("path_id", user.id),
        supabase.from("journal_entries").select("id, created_at").eq("user_id", user.id),
        supabase
          .from("xp_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ])

      // Calculate goals from paths
      const { data: pathGoals } = await supabase
        .from("goals")
        .select("id, completed, path_id")
        .in("path_id", pathsResult.data?.map((p) => p.id) || [])

      const totalGoals = pathGoals?.length || 0
      const completedGoals = pathGoals?.filter((g) => g.completed).length || 0

      // Calculate streaks from journal entries
      const journalEntries = journalResult.data || []
      const streakInfo = calculateStreaks(journalEntries)

      const profileStats: ProfileStats = {
        totalPaths: pathsResult.data?.length || 0,
        completedGoals,
        totalGoals,
        journalEntries: journalEntries.length,
        currentStreak: streakInfo.current,
        longestStreak: streakInfo.longest,
        totalXP: profile.xp,
        level: profile.level,
        joinDate: profile.created_at || "",
      }

      setStats(profileStats)
      setXpHistory(xpResult.data || [])

      // Calculate weekly activity
      const weeklyData = calculateWeeklyActivity(xpResult.data || [])
      setWeeklyActivity(weeklyData)
    } catch (error) {
      console.error("Error fetching profile data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStreaks = (entries: any[]) => {
    if (entries.length === 0) return { current: 0, longest: 0 }

    const sortedEntries = [...entries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    let lastDate = new Date()

    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.created_at)
      const daysDiff = Math.floor((lastDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff <= 1) {
        tempStreak++
        if (currentStreak === 0) currentStreak = tempStreak
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
        currentStreak = 0
      }

      lastDate = entryDate
    }

    longestStreak = Math.max(longestStreak, tempStreak)
    return { current: currentStreak, longest: longestStreak }
  }

  const calculateWeeklyActivity = (transactions: XPTransaction[]): ActivityData[] => {
    const now = new Date()
    const weekStart = startOfWeek(now)
    const weekEnd = endOfWeek(now)
    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

    return daysOfWeek.map((day) => {
      const dayTransactions = transactions.filter(
        (t) => format(new Date(t.created_at), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"),
      )

      return {
        date: format(day, "yyyy-MM-dd"),
        xp: dayTransactions.reduce((sum, t) => sum + t.amount, 0),
        activities: dayTransactions.length,
      }
    })
  }

  const getXPSourceIcon = (source: string) => {
    switch (source) {
      case "goal":
        return <Target className="w-4 h-4 text-yasuke-gold" />
      case "quest":
        return <Flame className="w-4 h-4 text-orange-500" />
      case "journal":
        return <BookOpen className="w-4 h-4 text-blue-500" />
      case "achievement":
        return <Award className="w-4 h-4 text-purple-500" />
      case "streak":
        return <Calendar className="w-4 h-4 text-green-500" />
      default:
        return <Star className="w-4 h-4 text-yasuke-crimson" />
    }
  }

  const getXPSourceColor = (source: string) => {
    switch (source) {
      case "goal":
        return "text-yasuke-gold"
      case "quest":
        return "text-orange-500"
      case "journal":
        return "text-blue-500"
      case "achievement":
        return "text-purple-500"
      case "streak":
        return "text-green-500"
      default:
        return "text-yasuke-crimson"
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading profile..." />
        </div>
      </AppLayout>
    )
  }

  if (!user || !profile || !stats) {
    return null
  }

  const progressToNext = xpSystem.getProgressToNextLevel(profile.xp)
  const xpToNext = xpSystem.getXPForNextLevel(profile.xp) - profile.xp

  return (
    <AppLayout title="Profile" subtitle="Your journey">
      <PageHeader
        title="Profile"
        description="Track your progress and achievements on the path of self-mastery"
        showBackButton
        backUrl="/dashboard"
      >
        <div className="flex items-center space-x-2">
          <Button onClick={() => router.push("/settings")} variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => router.push("/profile/edit")} variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </PageHeader>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-yasuke-crimson/20">
                  <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.full_name} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-yasuke-crimson to-yasuke-gold text-white">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-yasuke-crimson to-yasuke-gold rounded-full flex items-center justify-center border-4 border-background">
                  <Crown className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold mb-2">{profile.full_name}</h2>
                <p className="text-muted-foreground mb-4">{profile.email}</p>

                <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-6">
                  <Badge className="bg-yasuke-crimson/20 text-yasuke-crimson border-yasuke-crimson/50">
                    <Crown className="w-3 h-3 mr-1" />
                    Level {profile.level}
                  </Badge>
                  <Badge className="bg-yasuke-gold/20 text-yasuke-gold border-yasuke-gold/50">
                    <Star className="w-3 h-3 mr-1" />
                    {profile.xp.toLocaleString()} XP
                  </Badge>
                  <Badge className="bg-yasuke-steel/20 text-yasuke-steel border-yasuke-steel/50">
                    <Shield className="w-3 h-3 mr-1" />
                    {profile.resilience_score}% Resilience
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {profile.subscription_tier}
                  </Badge>
                </div>

                {/* Level Progress */}
                <div className="max-w-md mx-auto md:mx-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progress to Level {profile.level + 1}</span>
                    <span className="text-sm text-muted-foreground">{progressToNext}%</span>
                  </div>
                  <Progress value={progressToNext} className="h-3 mb-2" />
                  <p className="text-xs text-muted-foreground">{xpToNext.toLocaleString()} XP needed for next level</p>
                </div>
              </div>

              {/* Join Date */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Warrior since</p>
                <p className="font-medium">{format(new Date(stats.joinDate), "MMM yyyy")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-yasuke-crimson/20">
            <CardContent className="p-4 text-center">
              <Target className="w-6 h-6 text-yasuke-crimson mx-auto mb-2" />
              <p className="text-2xl font-bold text-yasuke-crimson">{stats.totalPaths}</p>
              <p className="text-xs text-muted-foreground">Paths</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-yasuke-gold/20">
            <CardContent className="p-4 text-center">
              <Award className="w-6 h-6 text-yasuke-gold mx-auto mb-2" />
              <p className="text-2xl font-bold text-yasuke-gold">{stats.completedGoals}</p>
              <p className="text-xs text-muted-foreground">Goals Done</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-blue-500/20">
            <CardContent className="p-4 text-center">
              <BookOpen className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-500">{stats.journalEntries}</p>
              <p className="text-xs text-muted-foreground">Entries</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-orange-500/20">
            <CardContent className="p-4 text-center">
              <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-500">{stats.currentStreak}</p>
              <p className="text-xs text-muted-foreground">Streak</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-green-500/20">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-500">{stats.longestStreak}</p>
              <p className="text-xs text-muted-foreground">Best Streak</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-purple-500/20">
            <CardContent className="p-4 text-center">
              <Calendar className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-500">
                {Math.floor((new Date().getTime() - new Date(stats.joinDate).getTime()) / (1000 * 60 * 60 * 24))}
              </p>
              <p className="text-xs text-muted-foreground">Days</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Activity */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-yasuke-crimson" />
                    This Week's Activity
                  </CardTitle>
                  <CardDescription>Your daily XP and activity this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {weeklyActivity.map((day, index) => (
                      <div key={day.date} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-yasuke-crimson/20 flex items-center justify-center">
                            <span className="text-xs font-medium">{format(new Date(day.date), "EEE").charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{format(new Date(day.date), "EEE, MMM d")}</p>
                            <p className="text-xs text-muted-foreground">{day.activities} activities</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-yasuke-gold border-yasuke-gold/50">
                          +{day.xp} XP
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent XP History */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yasuke-gold" />
                    Recent XP Gains
                  </CardTitle>
                  <CardDescription>Your latest experience point transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {xpHistory.slice(0, 10).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center space-x-3">
                          {getXPSourceIcon(transaction.source)}
                          <div>
                            <p className="text-sm font-medium capitalize">{transaction.source}</p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.description || `XP from ${transaction.source}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`${getXPSourceColor(transaction.source)} border-current/50`}
                        >
                          +{transaction.amount} XP
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2 text-purple-500" />
                  Achievements
                </CardTitle>
                <CardDescription>Your earned badges and accomplishments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Achievement System Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Earn badges and unlock achievements as you progress on your journey of self-mastery.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Goal Completion Rate */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-yasuke-crimson" />
                    Goal Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Completion Rate</span>
                        <span className="text-sm text-muted-foreground">
                          {stats.totalGoals > 0 ? Math.round((stats.completedGoals / stats.totalGoals) * 100) : 0}%
                        </span>
                      </div>
                      <Progress
                        value={stats.totalGoals > 0 ? (stats.completedGoals / stats.totalGoals) * 100 : 0}
                        className="h-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yasuke-gold">{stats.completedGoals}</p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yasuke-steel">
                          {stats.totalGoals - stats.completedGoals}
                        </p>
                        <p className="text-sm text-muted-foreground">In Progress</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* XP Breakdown */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yasuke-gold" />
                    XP Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {["goal", "quest", "journal", "achievement", "streak"].map((source) => {
                      const sourceXP = xpHistory
                        .filter((t) => t.source === source)
                        .reduce((sum, t) => sum + t.amount, 0)
                      const percentage = profile.xp > 0 ? (sourceXP / profile.xp) * 100 : 0

                      return (
                        <div key={source} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getXPSourceIcon(source)}
                            <span className="text-sm font-medium capitalize">{source}s</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</span>
                            <span className="text-sm font-medium">{sourceXP.toLocaleString()} XP</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
