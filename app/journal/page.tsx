"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useUser } from "@/components/providers/user-provider"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { BookOpen, Plus, Search, Calendar, Heart, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { JournalEntry } from "@/types"
import { formatDistanceToNow } from "date-fns"

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

export default function JournalPage() {
  const { user } = useUser()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [moodFilter, setMoodFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchEntries()
    }
  }, [user])

  useEffect(() => {
    filterAndSortEntries()
  }, [entries, searchQuery, moodFilter, sortBy])

  const fetchEntries = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setEntries(data || [])
    } catch (error) {
      console.error("Error fetching journal entries:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortEntries = () => {
    let filtered = [...entries]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (entry) =>
          entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Apply mood filter
    if (moodFilter !== "all") {
      filtered = filtered.filter((entry) => entry.mood === Number.parseInt(moodFilter))
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "mood-high":
          return (b.mood || 0) - (a.mood || 0)
        case "mood-low":
          return (a.mood || 0) - (b.mood || 0)
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredEntries(filtered)
  }

  const deleteEntry = async (entryId: string) => {
    try {
      const { error } = await supabase.from("journal_entries").delete().eq("id", entryId)

      if (error) throw error

      setEntries((prev) => prev.filter((entry) => entry.id !== entryId))
    } catch (error) {
      console.error("Error deleting entry:", error)
    }
  }

  const getStreakInfo = () => {
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

  const streakInfo = getStreakInfo()
  const averageMood =
    entries.length > 0
      ? entries.filter((e) => e.mood).reduce((sum, e) => sum + (e.mood || 0), 0) / entries.filter((e) => e.mood).length
      : 0

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading your journal..." />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Honor Journal" subtitle="Daily reflection">
      <PageHeader
        title="Honor Journal"
        description="Reflect on your journey and cultivate wisdom through daily writing"
        showBackButton
        backUrl="/dashboard"
      >
        <Button onClick={() => router.push("/journal/new")} className="yasuke-gradient hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" />
          New Entry
        </Button>
      </PageHeader>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6 text-center">
              <BookOpen className="w-8 h-8 text-yasuke-crimson mx-auto mb-2" />
              <p className="text-2xl font-bold">{entries.length}</p>
              <p className="text-sm text-muted-foreground">Total Entries</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 text-yasuke-gold mx-auto mb-2" />
              <p className="text-2xl font-bold">{streakInfo.current}</p>
              <p className="text-sm text-muted-foreground">Current Streak</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6 text-center">
              <Heart className="w-8 h-8 text-pink-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{averageMood.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Avg Mood</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6 text-center">
              <Badge variant="outline" className="text-yasuke-steel border-yasuke-steel/50 mb-2">
                Best Streak
              </Badge>
              <p className="text-2xl font-bold">{streakInfo.longest}</p>
              <p className="text-sm text-muted-foreground">Days</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search entries, tags, or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Select value={moodFilter} onValueChange={setMoodFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Mood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Moods</SelectItem>
                    <SelectItem value="5">😄 Excellent</SelectItem>
                    <SelectItem value="4">😊 Good</SelectItem>
                    <SelectItem value="3">😐 Neutral</SelectItem>
                    <SelectItem value="2">😕 Low</SelectItem>
                    <SelectItem value="1">😔 Very Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="mood-high">Mood: High</SelectItem>
                    <SelectItem value="mood-low">Mood: Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Journal Entries */}
        {filteredEntries.length > 0 ? (
          <div className="space-y-6">
            {filteredEntries.map((entry) => (
              <Card
                key={entry.id}
                className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-yasuke-crimson/30 transition-all cursor-pointer group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1" onClick={() => router.push(`/journal/${entry.id}`)}>
                      <div className="flex items-center space-x-3 mb-2">
                        {entry.mood && (
                          <span className="text-2xl">{moodEmojis[entry.mood as keyof typeof moodEmojis]}</span>
                        )}
                        <div>
                          <CardTitle className="text-lg group-hover:text-yasuke-crimson transition-colors">
                            {entry.title || "Untitled Entry"}
                          </CardTitle>
                          <CardDescription>
                            {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                            {entry.mood && (
                              <span className="ml-2">• {moodLabels[entry.mood as keyof typeof moodLabels]}</span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
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
                        <DropdownMenuItem onClick={() => router.push(`/journal/${entry.id}`)}>
                          <BookOpen className="w-4 h-4 mr-2" />
                          Read Entry
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/journal/${entry.id}/edit`)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Entry
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteEntry(entry.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Entry
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent onClick={() => router.push(`/journal/${entry.id}`)}>
                  <p className="text-muted-foreground line-clamp-3 mb-4">
                    {entry.content.substring(0, 200)}
                    {entry.content.length > 200 && "..."}
                  </p>

                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title={searchQuery || moodFilter !== "all" ? "No entries found" : "Start your journal"}
            description={
              searchQuery || moodFilter !== "all"
                ? "Try adjusting your search or filters to find entries."
                : "Begin your journey of self-reflection and wisdom. Write your first journal entry to track your growth and insights."
            }
            actionLabel={searchQuery || moodFilter !== "all" ? "Clear Filters" : "Write First Entry"}
            onAction={() => {
              if (searchQuery || moodFilter !== "all") {
                setSearchQuery("")
                setMoodFilter("all")
              } else {
                router.push("/journal/new")
              }
            }}
          />
        )}
      </div>
    </AppLayout>
  )
}
