"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/components/providers/user-provider"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { BookOpen, Heart, Tag, X } from "lucide-react"
import { xpSystem } from "@/lib/xp-system"

const moodOptions = [
  { value: 1, emoji: "😔", label: "Very Low", color: "text-red-500" },
  { value: 2, emoji: "😕", label: "Low", color: "text-orange-500" },
  { value: 3, emoji: "😐", label: "Neutral", color: "text-yellow-500" },
  { value: 4, emoji: "😊", label: "Good", color: "text-green-500" },
  { value: 5, emoji: "😄", label: "Excellent", color: "text-emerald-500" },
]

const reflectionPrompts = [
  "What am I most grateful for today?",
  "What challenge did I overcome today?",
  "How did I grow as a person today?",
  "What virtue did I practice today?",
  "What lesson did I learn today?",
  "How did I help someone today?",
  "What brought me joy today?",
  "What would I do differently?",
  "What am I looking forward to tomorrow?",
  "How did I honor my commitments today?",
]

export default function NewJournalEntryPage() {
  const { user } = useUser()
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    mood: null as number | null,
  })
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

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

  const usePrompt = useCallback((prompt: string) => {
    setSelectedPrompt(prompt)
    setFormData((prev) => ({
      ...prev,
      content: prev.content + (prev.content ? "\n\n" : "") + prompt + "\n\n",
    }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!formData.content.trim()) {
      toast({
        title: "Content required",
        description: "Please write something in your journal entry.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .insert([
          {
            user_id: user.id,
            title: formData.title.trim() || null,
            content: formData.content.trim(),
            mood: formData.mood,
            tags: tags.length > 0 ? tags : null,
          },
        ])
        .select()
        .single()

      if (error) throw error

      // Award XP for journal entry
      await xpSystem.addXP(user.id, 30, "journal", data.id, "Created a journal entry")

      toast({
        title: "Entry saved!",
        description: "Your journal entry has been saved successfully. +30 XP earned!",
      })

      router.push("/journal")
    } catch (error) {
      console.error("Error creating journal entry:", error)
      toast({
        title: "Save failed",
        description: "Failed to save journal entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <AppLayout title="New Journal Entry" subtitle="Reflect and grow">
      <PageHeader
        title="New Journal Entry"
        description="Take time to reflect on your journey and capture your thoughts"
        showBackButton
        backUrl="/journal"
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-yasuke-crimson" />
                  Your Reflection
                </CardTitle>
                <CardDescription>Express your thoughts, feelings, and insights from today's journey.</CardDescription>
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
                    <p className="text-sm text-muted-foreground">Take your time. There's no rush in self-reflection.</p>
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
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-destructive"
                            >
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
                    <Button type="submit" disabled={isCreating} className="yasuke-gradient hover:opacity-90">
                      {isCreating ? "Saving..." : "Save Entry"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Reflection Prompts */}
          <div>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Reflection Prompts</CardTitle>
                <CardDescription>Need inspiration? Try one of these prompts to guide your reflection.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {reflectionPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => usePrompt(prompt)}
                    className="w-full p-3 text-left text-sm rounded-lg border border-border/50 hover:border-yasuke-crimson/30 hover:bg-yasuke-crimson/5 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Writing Tips */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Writing Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>• Be honest and authentic with yourself</p>
                <p>• Focus on growth and learning</p>
                <p>• Include both challenges and victories</p>
                <p>• Consider how you practiced virtues today</p>
                <p>• Think about what you're grateful for</p>
                <p>• Set intentions for tomorrow</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
