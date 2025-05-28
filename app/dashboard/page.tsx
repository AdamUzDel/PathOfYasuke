"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/components/providers/user-provider"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { Target, BookOpen, Crown, Star, Flame, Shield, Plus, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react'
import { xpSystem } from "@/lib/xp-system"

interface DailyQuest {
  id: string
  title: string
  description: string
  xp_reward: number
  completed: boolean
  quest_type: string
}

interface Path {
  id: string
  title: string
  description: string
  color: string
  progress: number
  goals_count: number
  completed_goals: number
}

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useUser()
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([])
  const [paths, setPaths] = useState<Path[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (user && profile) {
      fetchDashboardData()
    }
  }, [user, profile])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      // Fetch daily quests
      const { data: questsData } = await supabase
        .from("daily_quests")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", new Date().toISOString().split("T")[0])
        .order("created_at", { ascending: false })

      // Fetch paths with goal counts
      const { data: pathsData } = await supabase
        .from("paths")
        .select(`
          *,
          goals:goals(count),
          completed_goals:goals!inner(count)
        `)
        .eq("user_id", user.id)
        .eq("goals.completed", true)

      if (questsData) {
        setDailyQuests(questsData)
      }

      if (pathsData) {
        const formattedPaths = pathsData.map((path) => ({
          ...path,
          goals_count: path.goals?.[0]?.count || 0,
          completed_goals: path.completed_goals?.[0]?.count || 0,
        }))
        setPaths(formattedPaths)
      }

      // Create default daily quests if none exist
      if (!questsData || questsData.length === 0) {
        await createDefaultDailyQuests()
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const createDefaultDailyQuests = async () => {
    if (!user) return

    const defaultQuests = [
      {
        title: "Morning Meditation",
        description: "Start your day with 10 minutes of mindfulness",
        xp_reward: 50,
        quest_type: "meditation",
      },
      {
        title: "Read 10 Pages",
        description: "Expand your knowledge through reading",
        xp_reward: 30,
        quest_type: "reading",
      },
      {
        title: "Exercise 30 Minutes",
        description: "Strengthen your body and discipline",
        xp_reward: 75,
        quest_type: "exercise",
      },
      {
        title: "Journal Reflection",
        description: "Reflect on your day and growth",
        xp_reward: 40,
        quest_type: "journaling",
      },
    ]

    try {
      const { data } = await supabase
        .from("daily_quests")
        .insert(
          defaultQuests.map((quest) => ({
            ...quest,
            user_id: user.id,
          })),
        )
        .select()

      if (data) {
        setDailyQuests(data)
      }
    } catch (error) {
      console.error("Error creating default quests:", error)
    }
  }

  const toggleQuest = async (questId: string, completed: boolean) => {
    try {
      const quest = dailyQuests.find(q => q.id === questId)
      if (!quest) return

      const { error } = await supabase
        .from("daily_quests")
        .update({
          completed: !completed,
          completed_at: !completed ? new Date().toISOString() : null,
        })
        .eq("id", questId)

      if (!error) {
        // Award XP when completing a quest
        if (!completed && user) {
          await xpSystem.addXP(
            user.id,
            quest.xp_reward,
            "quest",
            questId,
            `Completed daily quest: ${quest.title}`
          )
        }

        setDailyQuests((prev) =>
          prev.map((quest) => (quest.id === questId ? { ...quest, completed: !completed } : quest)),
        )
      }
    } catch (error) {
      console.error("Error updating quest:", error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  if (loading || isLoadingData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading your path..." />
        </div>
      </AppLayout>
    )
  }

  if (!user || !profile) {
    return null
  }

  const completedQuests = dailyQuests.filter((q) => q.completed).length
  const totalQuests = dailyQuests.length
  const questProgress = totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0

  return (
    <AppLayout title="Path of Yasuke" subtitle="Dashboard">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, <span className="yasuke-text-gradient">{profile.full_name || "Warrior"}</span>
          </h2>
          <p className="text-muted-foreground">Continue your journey of discipline and honor.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-yasuke-crimson/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Level</p>
                  <p className="text-2xl font-bold text-yasuke-crimson">{profile.level}</p>
                </div>
                <Crown className="w-8 h-8 text-yasuke-crimson" />
              </div>
              <div className="mt-4">
                <Progress value={(profile.xp % 1000) / 10} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{profile.xp} XP</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-yasuke-gold/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Daily Quests</p>
                  <p className="text-2xl font-bold text-yasuke-gold">
                    {completedQuests}/{totalQuests}
                  </p>
                </div>
                <Target className="w-8 h-8 text-yasuke-gold" />
              </div>
              <div className="mt-4">
                <Progress value={questProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{Math.round(questProgress)}% complete</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-yasuke-steel/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resilience</p>
                  <p className="text-2xl font-bold text-yasuke-steel">{profile.resilience_score}%</p>
                </div>
                <Shield className="w-8 h-8 text-yasuke-steel" />
              </div>
              <div className="mt-4">
                <Progress value={profile.resilience_score} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">Mental fortitude</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Streak</p>
                  <p className="text-2xl font-bold">{profile.streak}</p>
                </div>
                <Flame className="w-8 h-8 text-orange-500" />
              </div>
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">Keep the momentum going!</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daily Quests */}
          <div className="lg:col-span-2">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Target className="w-5 h-5 mr-2 text-yasuke-crimson" />
                      Today's Quests
                    </CardTitle>
                    <CardDescription>Complete your daily challenges</CardDescription>
                  </div>
                  <Badge variant="outline">
                    {completedQuests}/{totalQuests} Complete
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {dailyQuests.map((quest) => (
                  <div
                    key={quest.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${
                      quest.completed
                        ? "bg-yasuke-crimson/10 border-yasuke-crimson/30"
                        : "bg-muted/50 border-border/50 hover:border-yasuke-crimson/30"
                    }`}
                    onClick={() => toggleQuest(quest.id, quest.completed)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          quest.completed ? "bg-yasuke-crimson border-yasuke-crimson" : "border-muted-foreground"
                        }`}
                      >
                        {quest.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <span className={quest.completed ? "line-through text-muted-foreground" : ""}>
                          {quest.title}
                        </span>
                        {quest.description && <p className="text-sm text-muted-foreground">{quest.description}</p>}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-yasuke-gold border-yasuke-gold/50">
                      <Star className="w-3 h-3 mr-1" />
                      {quest.xp_reward} XP
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Growth Paths */}
          <div>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-yasuke-gold" />
                      Growth Paths
                    </CardTitle>
                    <CardDescription>Your journey progress</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => router.push("/paths")}>
                    <Plus className="w-4 h-4 mr-1" />
                    New Path
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {paths.length > 0 ? (
                  paths.map((path) => (
                    <div
                      key={path.id}
                      className="p-4 rounded-lg border border-border/50 hover:border-yasuke-crimson/30 transition-all cursor-pointer"
                      onClick={() => router.push(`/paths/${path.id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{path.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {path.completed_goals}/{path.goals_count} goals
                        </Badge>
                      </div>
                      <Progress value={path.progress} className="h-2 mb-2" />
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{path.progress}% complete</span>
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={BookOpen}
                    title="No growth paths yet"
                    description="Create your first path to start your journey of self-mastery"
                    actionLabel="Create Your First Path"
                    onAction={() => router.push("/paths")}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2 hover:border-yasuke-crimson/50"
              onClick={() => router.push("/journal")}
            >
              <BookOpen className="w-6 h-6" />
              <span>Honor Journal</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2 hover:border-yasuke-gold/50"
              onClick={() => router.push("/paths")}
            >
              <Target className="w-6 h-6" />
              <span>Create Quest</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2 hover:border-yasuke-steel/50"
              onClick={() => router.push("/profile")}
            >
              <Calendar className="w-6 h-6" />
              <span>View Progress</span>
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
