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
import { PageHeader } from "@/components/ui/page-header"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { Target, Plus, Calendar, TrendingUp, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Path } from "@/types"

interface PathWithStats extends Path {
  goals_count: number
  completed_goals: number
  active_goals: number
}

export default function PathsPage() {
  const { user } = useUser()
  const [paths, setPaths] = useState<PathWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchPaths()
    }
  }, [user])

  const fetchPaths = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("paths")
        .select(`
          *,
          goals (
            id,
            completed,
            status
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      const pathsWithStats =
        data?.map((path) => {
          const goals = path.goals || []
          const completedGoals = goals.filter((g: any) => g.completed).length
          const activeGoals = goals.filter((g: any) => g.status === "in_progress").length
          const progress = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0

          return {
            ...path,
            goals_count: goals.length,
            completed_goals: completedGoals,
            active_goals: activeGoals,
            progress,
          }
        }) || []

      setPaths(pathsWithStats)
    } catch (error) {
      console.error("Error fetching paths:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const deletePath = async (pathId: string) => {
    try {
      const { error } = await supabase.from("paths").delete().eq("id", pathId)

      if (error) throw error

      setPaths(paths.filter((path) => path.id !== pathId))
    } catch (error) {
      console.error("Error deleting path:", error)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading your paths..." />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Growth Paths" subtitle="Forge your destiny">
      <PageHeader
        title="Growth Paths"
        description="Create and manage your journey of self-mastery"
        showBackButton
        backUrl="/dashboard"
      >
        <Button onClick={() => router.push("/paths/new")} className="yasuke-gradient hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" />
          New Path
        </Button>
      </PageHeader>

      <div className="container mx-auto px-4 py-8">
        {paths.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paths.map((path) => (
              <Card
                key={path.id}
                className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-yasuke-crimson/30 transition-all cursor-pointer group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className={`w-3 h-3 rounded-full bg-${path.color || "yasuke-crimson"}`} />
                        <CardTitle className="text-lg group-hover:text-yasuke-crimson transition-colors">
                          {path.title}
                        </CardTitle>
                      </div>
                      {path.description && <CardDescription className="text-sm">{path.description}</CardDescription>}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/paths/${path.id}/edit`)}>
                          Edit Path
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deletePath(path.id)} className="text-destructive">
                          Delete Path
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent onClick={() => router.push(`/paths/${path.id}`)}>
                  <div className="space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-muted-foreground">{path.progress}%</span>
                      </div>
                      <Progress value={path.progress} className="h-2" />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-yasuke-crimson">{path.goals_count}</p>
                        <p className="text-xs text-muted-foreground">Total Goals</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-yasuke-gold">{path.active_goals}</p>
                        <p className="text-xs text-muted-foreground">Active</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-green-500">{path.completed_goals}</p>
                        <p className="text-xs text-muted-foreground">Complete</p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(path.created_at).toLocaleDateString()}
                      </Badge>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        View Details
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Target}
            title="No growth paths yet"
            description="Create your first path to begin your journey of self-mastery. Define goals, track progress, and build the discipline of a modern samurai."
            actionLabel="Create Your First Path"
            onAction={() => router.push("/paths/new")}
          />
        )}
      </div>
    </AppLayout>
  )
}
