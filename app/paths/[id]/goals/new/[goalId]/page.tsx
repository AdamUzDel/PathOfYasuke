"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/components/providers/user-provider"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { Target, CheckCircle2, Calendar, Edit, MoreHorizontal, Trash2, Flag, ListTodo, Send, Clock } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Goal, Activity } from "@/types"
import { xpSystem } from "@/lib/xp-system"
import { format, formatDistanceToNow } from "date-fns"

interface GoalWithActivities extends Goal {
  activities: Activity[]
  path: {
    title: string
  }
}

export default function GoalDetailPage() {
  const { user } = useUser()
  const [goal, setGoal] = useState<GoalWithActivities | null>(null)
  const [newActivity, setNewActivity] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingActivity, setIsAddingActivity] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const pathId = params.id as string
  const goalId = params.goalId as string

  useEffect(() => {
    if (user && goalId) {
      fetchGoalDetails()
    }
  }, [user, goalId])

  const fetchGoalDetails = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("goals")
        .select(`
          *,
          activities (
            id,
            note,
            completed,
            xp_reward,
            created_at,
            updated_at
          ),
          paths!inner (
            title,
            user_id
          )
        `)
        .eq("id", goalId)
        .eq("paths.user_id", user.id)
        .single()

      if (error) throw error

      setGoal(data)
    } catch (error) {
      console.error("Error fetching goal details:", error)
      toast({
        title: "Error loading goal",
        description: "Failed to load goal details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addActivity = async () => {
    if (!user || !goal || !newActivity.trim()) return

    setIsAddingActivity(true)
    try {
      const { data, error } = await supabase
        .from("activities")
        .insert([
          {
            goal_id: goalId,
            note: newActivity.trim(),
            completed: false,
            xp_reward: 25,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setGoal((prev) =>
        prev
          ? {
              ...prev,
              activities: [...prev.activities, data],
            }
          : null,
      )

      setNewActivity("")
      toast({
        title: "Activity added!",
        description: "New activity has been added to your goal.",
      })
    } catch (error) {
      console.error("Error adding activity:", error)
      toast({
        title: "Failed to add activity",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingActivity(false)
    }
  }

  const toggleActivity = async (activityId: string, completed: boolean) => {
    if (!user || !goal) return

    try {
      const { error } = await supabase
        .from("activities")
        .update({
          completed: !completed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activityId)

      if (error) throw error

      // Award XP when completing an activity
      if (!completed) {
        const activity = goal.activities.find((a) => a.id === activityId)
        if (activity) {
          await xpSystem.addXP(
            user.id,
            activity.xp_reward,
            "activity",
            activityId,
            `Completed activity: ${activity.note}`,
          )
        }
      }

      setGoal((prev) =>
        prev
          ? {
              ...prev,
              activities: prev.activities.map((activity) =>
                activity.id === activityId ? { ...activity, completed: !completed } : activity,
              ),
            }
          : null,
      )

      toast({
        title: !completed ? "Activity completed!" : "Activity reopened",
        description: !completed ? "Great work! You earned 25 XP!" : "Activity marked as incomplete",
      })

      // Check if all activities are completed to suggest goal completion
      if (!completed && goal) {
        const updatedActivities = goal.activities.map((activity) =>
          activity.id === activityId ? { ...activity, completed: true } : activity,
        )
        const allCompleted = updatedActivities.every((activity) => activity.completed)

        if (allCompleted && updatedActivities.length > 0) {
          toast({
            title: "All activities completed! 🎉",
            description: "Consider marking this goal as complete.",
          })
        }
      }
    } catch (error) {
      console.error("Error updating activity:", error)
      toast({
        title: "Update failed",
        description: "Failed to update activity. Please try again.",
        variant: "destructive",
      })
    }
  }

  const deleteActivity = async (activityId: string) => {
    try {
      const { error } = await supabase.from("activities").delete().eq("id", activityId)

      if (error) throw error

      setGoal((prev) =>
        prev
          ? {
              ...prev,
              activities: prev.activities.filter((activity) => activity.id !== activityId),
            }
          : null,
      )

      toast({
        title: "Activity deleted",
        description: "The activity has been removed.",
      })
    } catch (error) {
      console.error("Error deleting activity:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete activity. Please try again.",
        variant: "destructive",
      })
    }
  }

  const toggleGoalCompletion = async () => {
    if (!user || !goal) return

    try {
      const newCompleted = !goal.completed
      const { error } = await supabase
        .from("goals")
        .update({
          completed: newCompleted,
          status: newCompleted ? "completed" : "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", goalId)

      if (error) throw error

      // Award XP when completing a goal
      if (newCompleted) {
        await xpSystem.addXP(user.id, goal.xp_reward, "goal", goalId, `Completed goal: ${goal.title}`)
      }

      setGoal((prev) =>
        prev
          ? {
              ...prev,
              completed: newCompleted,
              status: newCompleted ? "completed" : "in_progress",
            }
          : null,
      )

      toast({
        title: newCompleted ? "Goal completed! 🎉" : "Goal reopened",
        description: newCompleted ? `Excellent work! You earned ${goal.xp_reward} XP!` : "Goal marked as in progress",
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

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading goal..." />
        </div>
      </AppLayout>
    )
  }

  if (!goal) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <EmptyState
            icon={Target}
            title="Goal not found"
            description="The goal you're looking for doesn't exist or you don't have access to it."
            actionLabel="Back to Path"
            onAction={() => router.push(`/paths/${pathId}`)}
          />
        </div>
      </AppLayout>
    )
  }

  const completedActivities = goal.activities.filter((activity) => activity.completed).length
  const totalActivities = goal.activities.length
  const activityProgress = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0

  return (
    <AppLayout title={goal.title} subtitle="Goal Details">
      <PageHeader
        title={goal.title}
        description={`${goal.path.title} • ${goal.description || "No description"}`}
        badge={goal.status}
        badgeVariant={goal.completed ? "default" : "outline"}
        showBackButton
        backUrl={`/paths/${pathId}`}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <Button
            onClick={toggleGoalCompletion}
            variant={goal.completed ? "outline" : "default"}
            className={goal.completed ? "" : "yasuke-gradient hover:opacity-90"}
            size="sm"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {goal.completed ? "Mark Incomplete" : "Mark Complete"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/paths/${pathId}/goals/${goalId}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Goal
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Goal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PageHeader>

      <div className="container mx-auto px-4 py-4 sm:py-8 space-y-6">
        {/* Goal Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Flag className="w-5 h-5 mr-2 text-yasuke-gold" />
                Goal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {goal.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{goal.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {goal.due_date && (
                  <div>
                    <h4 className="font-medium mb-1 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Due Date
                    </h4>
                    <p className="text-sm text-muted-foreground">{format(new Date(goal.due_date), "PPP")}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(goal.due_date), { addSuffix: true })}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-1">XP Reward</h4>
                  <Badge variant="outline" className="text-yasuke-gold border-yasuke-gold/50">
                    {goal.xp_reward} XP
                  </Badge>
                </div>
              </div>

              {goal.virtue && (
                <div>
                  <h4 className="font-medium mb-1">Associated Virtue</h4>
                  <Badge variant="outline" className="text-yasuke-crimson border-yasuke-crimson/50">
                    {goal.virtue}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yasuke-crimson mb-1">{activityProgress}%</div>
                <p className="text-sm text-muted-foreground">Activities Complete</p>
              </div>

              <Progress value={activityProgress} className="h-2" />

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold">{completedActivities}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{totalActivities}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Created {formatDistanceToNow(new Date(goal.created_at), { addSuffix: true })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activities Section */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle className="flex items-center">
                  <ListTodo className="w-5 h-5 mr-2 text-yasuke-gold" />
                  Activities
                </CardTitle>
                <CardDescription>Break down your goal into actionable steps</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add New Activity */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Input
                placeholder="Add a new activity..."
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    addActivity()
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={addActivity}
                disabled={!newActivity.trim() || isAddingActivity}
                className="yasuke-gradient hover:opacity-90 w-full sm:w-auto"
              >
                <Send className="w-4 h-4 mr-2" />
                {isAddingActivity ? "Adding..." : "Add"}
              </Button>
            </div>

            {/* Activities List */}
            {goal.activities.length > 0 ? (
              <div className="space-y-3">
                {goal.activities
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map((activity) => (
                    <div
                      key={activity.id}
                      className={`p-3 sm:p-4 rounded-lg border transition-all ${
                        activity.completed
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-muted/50 border-border/50 hover:border-yasuke-crimson/30"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <button
                            onClick={() => toggleActivity(activity.id, activity.completed)}
                            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                              activity.completed
                                ? "bg-green-500 border-green-500"
                                : "border-muted-foreground hover:border-yasuke-crimson"
                            }`}
                          >
                            {activity.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm sm:text-base break-words ${
                                activity.completed ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {activity.note}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 space-y-1 sm:space-y-0">
                              <Badge variant="outline" className="text-xs w-fit">
                                {activity.xp_reward} XP
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="flex-shrink-0 ml-2">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => deleteActivity(activity.id)} className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <EmptyState
                icon={ListTodo}
                title="No activities yet"
                description="Break down this goal into smaller, actionable steps to track your progress."
                actionLabel="Add First Activity"
                onAction={() => document.querySelector("input")?.focus()}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
