"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/components/providers/user-provider"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Flag, CalendarIcon } from "lucide-react"
import { SAMURAI_VIRTUES } from "@/types"
import { format } from "date-fns"

export default function NewGoalPage() {
  const { user } = useUser()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    virtue: "",
    xp_reward: 50,
  })
  const [dueDate, setDueDate] = useState<Date>()
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const pathId = params.id as string

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your goal.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      const { data, error } = await supabase
        .from("goals")
        .insert([
          {
            path_id: pathId,
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            virtue: formData.virtue || null,
            due_date: dueDate?.toISOString().split("T")[0] || null,
            xp_reward: formData.xp_reward,
            status: "pending",
            completed: false,
          },
        ])
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Goal created!",
        description: "Your new goal has been added to your path.",
      })

      router.push(`/paths/${pathId}`)
    } catch (error) {
      console.error("Error creating goal:", error)
      toast({
        title: "Creation failed",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <AppLayout title="New Goal" subtitle="Define your objective">
      <PageHeader
        title="Create New Goal"
        description="Define a specific objective for your growth path"
        showBackButton
        backUrl={`/paths/${pathId}`}
      />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Flag className="w-5 h-5 mr-2 text-yasuke-gold" />
              Goal Details
            </CardTitle>
            <CardDescription>
              Create a specific, measurable goal that moves you forward on your path of growth.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Complete 30-day morning routine, Read 5 leadership books"
                  required
                />
                <p className="text-sm text-muted-foreground">Be specific and actionable</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe what success looks like and why this goal matters..."
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">Clarify the details and importance of this goal</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Virtue */}
                <div className="space-y-2">
                  <Label>Associated Virtue</Label>
                  <Select
                    value={formData.virtue}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, virtue: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a virtue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific virtue</SelectItem>
                      {SAMURAI_VIRTUES.map((virtue) => (
                        <SelectItem key={virtue.id} value={virtue.id}>
                          {virtue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Connect this goal to a samurai virtue</p>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <p className="text-sm text-muted-foreground">Optional target completion date</p>
                </div>
              </div>

              {/* XP Reward */}
              <div className="space-y-2">
                <Label htmlFor="xp_reward">XP Reward</Label>
                <Select
                  value={formData.xp_reward.toString()}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, xp_reward: Number.parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 XP - Small goal</SelectItem>
                    <SelectItem value="50">50 XP - Medium goal</SelectItem>
                    <SelectItem value="100">100 XP - Large goal</SelectItem>
                    <SelectItem value="200">200 XP - Major milestone</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">XP earned when this goal is completed</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating} className="yasuke-gradient hover:opacity-90">
                  {isCreating ? "Creating..." : "Create Goal"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
