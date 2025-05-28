"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/components/providers/user-provider"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { Target, Plus, CheckCircle2, Calendar, Edit, MoreHorizontal, Trash2, Flag } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Path, Goal } from "@/types"
import { xpSystem } from "@/lib/xp-system"

interface GoalWithActivities extends Goal {
  activities?: Array<{
    id: string
    note: string
    completed: boolean
    created_at: string
  }>
}

export default function PathDetailPage() {
  const { user } = useUser()
  const [path, setPath] = useState<Path | null>(null)
  const [goals, setGoals] = useState<GoalWithActivities[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const pathId = params.id as string

  useEffect(() => {
    if (user && pathId) {
      fetchPathDetails()
    }
  }, [user, pathId])

  const fetchPathDetails = async () => {
    if (!user) return

    try {
      // Fetch path details
      const { data: pathData, error: pathError } = await supabase
        .from("paths")
        .select("*")
        .eq("id", pathId)
        .eq("user_id", user.id)
        .single()

      if (pathError) throw pathError

      // Fetch goals with activities
      const { data: goalsData, error: goalsError } = await supabase
        .from("goals")
        .select(`
          *,
          activities (
            id,
            note,
            completed,
            created_at
          )
        `)
        .eq("path_id", pathId)
        .order("created_at", { ascending: true })

      if (goalsError) throw goalsError

      setPath(pathData)
      setGoals(goalsData || [])

      // Update path progress
      await updatePathProgress(pathData, goalsData || [])
    } catch (error) {
      console.error("Error fetching path details:", error)
      toast({
        title: "Error loading path",
        description: "Failed to load path details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updatePathProgress = async (pathData: Path, goalsData: Goal[]) => {
    if (goalsData.length === 0) return

    const completedGoals = goalsData.filter((goal) => goal.completed).length
    const progress = Math.round((completedGoals / goalsData.length) * 100)

    if (progress !== pathData.progress) {
      await supabase.from("paths").update({ progress }).eq("id", pathId)

      setPath((prev) => (prev ? { ...prev, progress } : null))
    }
  }

  const toggleGoal = async (goalId: string, completed: boolean) => {
    try {
      const goal = goals.find(g => g.id === goalId)
      if (!goal) return

      const { error } = await supabase
        .from("goals")
        .update({
          completed: !completed,
          status: !completed ? "completed" : "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", goalId)

      if (error) throw error

      // Award XP when completing a goal
      if (!completed && user) {
        await xpSystem.addXP(
          user.id,
          goal.xp_reward,
          "goal",
          goalId,
          `Completed goal: ${goal.title}`
        )
      }

      setGoals((prev) =>
        prev.map((goal) =>
          goal.id === goalId
            ? { ...goal, completed: !completed, status: !completed ? ("completed" as const) : ("in_progress" as const) }
            : goal,
      ),
    )

    // Update path progress
    if (path) {
      const updatedGoals = goals.map((goal) => (goal.id === goalId ? { ...goal, completed: !completed } : goal))
      await updatePathProgress(path, updatedGoals)
    }

    toast({
      title: !completed ? "Goal completed!" : "Goal reopened",
      description: !completed ? `Great work! You earned ${goal.xp_reward} XP!` : "Goal marked as in progress",
    })
  } catch (error) {
    console.error("Error updating goal:", error)
    toast({
      title: "Update failed",
      description: "Failed to update goal. Please try again.",
      variant: "destructive",
    })
  }
}

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase.from("goals").delete().eq("id", goalId)

      if (error) throw error

      setGoals((prev) => prev.filter((goal) => goal.id !== goalId))

      toast({
        title: "Goal deleted",
        description: "The goal has been removed from your path.",
      })
    } catch (error) {
      console.error("Error deleting goal:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete goal. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading path..." />
        </div>
      </AppLayout>
    )
  }

  if (!path) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <EmptyState
            icon={Target}
            title="Path not found"
            description="The path you're looking for doesn't exist or you don't have access to it."
            actionLabel="Back to Paths"
            onAction={() => router.push("/paths")}
          />
        </div>
      </AppLayout>
    )
  }

  const completedGoals = goals.filter((goal) => goal.completed).length
  const totalGoals = goals.length
  const progress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

  return (
    <AppLayout title={path.title} subtitle="Growth Path">
      <PageHeader title={path.title} description={path.description} showBackButton backUrl="/paths">
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => router.push(`/paths/${pathId}/goals/new`)}
            className="yasuke-gradient hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/paths/${pathId}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Path
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/paths")} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Path
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PageHeader>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Overview */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className={`w-4 h-4 rounded-full bg-${path.color} mr-3`} />
              Path Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-muted-foreground mt-1">
                  {completedGoals} of {totalGoals} goals completed
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yasuke-crimson">{totalGoals}</p>
                <p className="text-sm text-muted-foreground">Total Goals</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{completedGoals}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals List */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Flag className="w-5 h-5 mr-2 text-yasuke-gold" />
                  Goals
                </CardTitle>
                <CardDescription>Break down your path into achievable goals</CardDescription>
              </div>
              <Button onClick={() => router.push(`/paths/${pathId}/goals/new`)} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {goals.length > 0 ? (
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`p-4 rounded-lg border transition-all ${
                      goal.completed
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-muted/50 border-border/50 hover:border-yasuke-crimson/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <button
                          onClick={() => toggleGoal(goal.id, goal.completed)}
                          className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            goal.completed
                              ? "bg-green-500 border-green-500"
                              : "border-muted-foreground hover:border-yasuke-crimson"
                          }`}
                        >
                          {goal.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </button>
                        <div className="flex-1">
                          <h4 className={`font-medium ${goal.completed ? "line-through text-muted-foreground" : ""}`}>
                            {goal.title}
                          </h4>
                          {goal.description && <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>}
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {goal.status}
                            </Badge>
                            {goal.due_date && (
                              <Badge variant="outline" className="text-xs">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(goal.due_date).toLocaleDateString()}
                              </Badge>
                            )}
                            {goal.virtue && (
                              <Badge variant="outline" className="text-xs text-yasuke-gold border-yasuke-gold/50">
                                {goal.virtue}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/paths/${pathId}/goals/${goal.id}`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/paths/${pathId}/goals/${goal.id}/edit`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Goal
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteGoal(goal.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Goal
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Flag}
                title="No goals yet"
                description="Start by creating your first goal. Break down your path into specific, achievable objectives."
                actionLabel="Create First Goal"
                onAction={() => router.push(`/paths/${pathId}/goals/new`)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
