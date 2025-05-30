"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/components/providers/user-provider"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { BookOpen, Heart, Tag, X } from "lucide-react"
import type { JournalEntry } from "@/types"

const moodOptions = [
  { value: 1, emoji: "😔", label: "Very Low", color: "text-red-500" },
  { value: 2, emoji: "😕", label: "Low", color: "text-orange-500" },
  { value: 3, emoji: "😐", label: "Neutral", color: "text-yellow-500" },
  { value: 4, emoji: "😊", label: "Good", color: "text-green-500" },
  { value: 5, emoji: "😄", label: "Excellent", color: "text-emerald-500" },
]

export default function EditJournalEntryPage() {
  const { user } = useUser()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    mood: null as number | null,
  })
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
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
      setFormData({
        title: data.title || "",
        content: data.content || "",
        mood: data.mood,
      })
      setTags(data.tags || [])
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleMoodSelect = (mood: number) => {
    setFormData((prev) => ({
      ...prev,
      mood: prev.mood === mood ? null : mood,
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim().toLowerCase())) {
      setTags((prev) => [...prev, newTag.trim().toLowerCase()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !entry) return

    if (!formData.content.trim()) {
      toast({
        title: "Content required",
        description: "Please write something in your journal entry.",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)

    try {
      const { error } = await supabase
        .from("journal_entries")
        .update({
          title: formData.title.trim() || null,
          content: formData.content.trim(),
          mood: formData.mood,
          tags: tags.length > 0 ? tags : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entryId)

      if (error) throw error

      toast({
        title: "Entry updated!",
        description: "Your journal entry has been updated successfully.",
      })

      router.push(`/journal/${entryId}`)
    } catch (error) {
      console.error("Error updating journal entry:", error)
      toast({
        title: "Update failed",
        description: "Failed to update journal entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
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
        <PageHeader
          title="Entry not found"
          description="The journal entry you're trying to edit doesn't exist."
          showBackButton
          backUrl="/journal"
        />
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Edit Journal Entry" subtitle="Update your reflection">
      <PageHeader
        title="Edit Journal Entry"
        description="Update your thoughts and reflections"
        showBackButton
        backUrl={`/journal/${entryId}`}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-yasuke-crimson" />
              Update Your Reflection
            </CardTitle>
            <CardDescription>Revise your thoughts and add new insights to your journal entry.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Give your entry a meaningful title..."
                />
              </div>

              {/* Mood Selection */}
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Heart className="w-4 h-4 mr-2" />
                  How are you feeling?
                </Label>
                <div className="flex gap-2">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood.value}
                      type="button"
                      onClick={() => handleMoodSelect(mood.value)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        formData.mood === mood.value
                          ? "border-yasuke-crimson bg-yasuke-crimson/10"
                          : "border-border hover:border-yasuke-crimson/50"
                      }`}
                    >
                      <div className="text-2xl mb-1">{mood.emoji}</div>
                      <div className={`text-xs ${mood.color}`}>{mood.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Your Thoughts *</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="What's on your mind? Reflect on your day, your growth, your challenges, and your victories..."
                  rows={12}
                  required
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Tag className="w-4 h-4 mr-2" />
                  Tags
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add tags (press Enter)"
                    className="flex-1"
                  />
                  <Button type="button" onClick={addTag} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating} className="yasuke-gradient hover:opacity-90">
                  {isUpdating ? "Updating..." : "Update Entry"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
