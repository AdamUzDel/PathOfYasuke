"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/components/providers/user-provider"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { BookOpen, Edit, Trash2, Heart, Calendar, Tag } from "lucide-react"
import type { JournalEntry } from "@/types"
import { format } from "date-fns"

const moodEmojis = {
  1: "😔",
  2: "😕",
  3: "😐",
  4: "😊",
  5: "😄",
}

const moodLabels = {
  1: "Very Low",
  2: "Low",
  3: "Neutral",
  4: "Good",
  5: "Excellent",
}

const moodColors = {
  1: "text-red-500",
  2: "text-orange-500",
  3: "text-yellow-500",
  4: "text-green-500",
  5: "text-emerald-500",
}

export default function JournalEntryPage() {
  const { user } = useUser()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const entryId = params.id as string

  useEffect(() => {
    if (user && entryId) {
      fetchEntry()
    }
  }, [user, entryId])

  const fetchEntry = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("id", entryId)
        .eq("user_id", user.id)
        .single()

      if (error) throw error

      setEntry(data)
    } catch (error) {
      console.error("Error fetching journal entry:", error)
      toast({
        title: "Error loading entry",
        description: "Failed to load journal entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteEntry = async () => {
    if (!entry) return

    try {
      const { error } = await supabase.from("journal_entries").delete().eq("id", entry.id)

      if (error) throw error

      toast({
        title: "Entry deleted",
        description: "Your journal entry has been deleted.",
      })

      router.push("/journal")
    } catch (error) {
      console.error("Error deleting entry:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete entry. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading entry..." />
        </div>
      </AppLayout>
    )
  }

  if (!entry) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <EmptyState
            icon={BookOpen}
            title="Entry not found"
            description="The journal entry you're looking for doesn't exist or you don't have access to it."
            actionLabel="Back to Journal"
            onAction={() => router.push("/journal")}
          />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Journal Entry" subtitle="Reflection">
      <PageHeader
        title={entry.title || "Journal Entry"}
        description={format(new Date(entry.created_at), "EEEE, MMMM d, yyyy 'at' h:mm a")}
        showBackButton
        backUrl="/journal"
      >
        <div className="flex items-center space-x-2">
          <Button onClick={() => router.push(`/journal/${entry.id}/edit`)} variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button onClick={deleteEntry} variant="outline" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </PageHeader>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{entry.title || "Untitled Entry"}</CardTitle>
                    <CardDescription className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(new Date(entry.created_at), "MMMM d, yyyy")}
                      </span>
                      {entry.mood && (
                        <span className="flex items-center">
                          <Heart className="w-4 h-4 mr-1" />
                          <span className={moodColors[entry.mood as keyof typeof moodColors]}>
                            {moodLabels[entry.mood as keyof typeof moodLabels]}
                          </span>
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  {entry.mood && <div className="text-4xl">{moodEmojis[entry.mood as keyof typeof moodEmojis]}</div>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  {entry.content.split("\n").map((paragraph, index) => (
                    <p key={index} className="mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {entry.tags && entry.tags.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-border/50">
                    <div className="flex items-center space-x-2 mb-3">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Entry Stats */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Entry Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Word Count</p>
                  <p className="text-2xl font-bold text-yasuke-crimson">
                    {entry.content.split(/\s+/).filter((word) => word.length > 0).length}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Character Count</p>
                  <p className="text-2xl font-bold text-yasuke-gold">{entry.content.length}</p>
                </div>

                {entry.mood && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Mood Rating</p>
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-2xl">{moodEmojis[entry.mood as keyof typeof moodEmojis]}</span>
                      <span className={`font-bold ${moodColors[entry.mood as keyof typeof moodColors]}`}>
                        {entry.mood}/5
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => router.push(`/journal/${entry.id}/edit`)}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Entry
                </Button>

                <Button onClick={() => router.push("/journal/new")} variant="outline" className="w-full justify-start">
                  <BookOpen className="w-4 h-4 mr-2" />
                  New Entry
                </Button>

                <Button
                  onClick={deleteEntry}
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Entry
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
