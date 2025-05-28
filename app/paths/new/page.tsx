"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/components/providers/user-provider"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Target, Palette } from "lucide-react"

const colorOptions = [
  { name: "Crimson", value: "yasuke-crimson", class: "bg-yasuke-crimson" },
  { name: "Gold", value: "yasuke-gold", class: "bg-yasuke-gold" },
  { name: "Steel", value: "yasuke-steel", class: "bg-yasuke-steel" },
  { name: "Emerald", value: "emerald-500", class: "bg-emerald-500" },
  { name: "Blue", value: "blue-500", class: "bg-blue-500" },
  { name: "Purple", value: "purple-500", class: "bg-purple-500" },
  { name: "Orange", value: "orange-500", class: "bg-orange-500" },
  { name: "Pink", value: "pink-500", class: "bg-pink-500" },
]

export default function NewPathPage() {
  const { user } = useUser()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    color: "yasuke-crimson",
  })
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleColorSelect = (color: string) => {
    setFormData((prev) => ({
      ...prev,
      color,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your path.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      const { data, error } = await supabase
        .from("paths")
        .insert([
          {
            user_id: user.id,
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            color: formData.color,
            progress: 0,
          },
        ])
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Path created!",
        description: "Your new growth path has been created successfully.",
      })

      router.push(`/paths/${data.id}`)
    } catch (error) {
      console.error("Error creating path:", error)
      toast({
        title: "Creation failed",
        description: "Failed to create path. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <AppLayout title="New Path" subtitle="Create your journey">
      <PageHeader
        title="Create New Path"
        description="Define a new area of growth and self-mastery"
        showBackButton
        backUrl="/paths"
      />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-yasuke-crimson" />
              Path Details
            </CardTitle>
            <CardDescription>
              Create a focused area of growth. This could be a skill, virtue, or life area you want to develop.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Path Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Physical Discipline, Leadership Skills, Mindfulness Practice"
                  required
                />
                <p className="text-sm text-muted-foreground">Choose a clear, inspiring name for your growth path</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe what this path represents and why it's important to you..."
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Optional: Explain your vision and motivation for this path
                </p>
              </div>

              {/* Color Selection */}
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Palette className="w-4 h-4 mr-2" />
                  Path Color
                </Label>
                <div className="grid grid-cols-4 gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => handleColorSelect(color.value)}
                      className={`
                        relative p-3 rounded-lg border-2 transition-all
                        ${
                          formData.color === color.value
                            ? "border-foreground ring-2 ring-foreground/20"
                            : "border-border hover:border-foreground/50"
                        }
                      `}
                    >
                      <div className={`w-full h-8 rounded ${color.class}`} />
                      <p className="text-xs mt-1 text-center">{color.name}</p>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">Choose a color to help you identify this path</p>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="p-4 border border-border/50 rounded-lg bg-muted/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-3 h-3 rounded-full bg-${formData.color}`} />
                    <span className="font-medium">{formData.title || "Your Path Title"}</span>
                  </div>
                  {formData.description && <p className="text-sm text-muted-foreground">{formData.description}</p>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating} className="yasuke-gradient hover:opacity-90">
                  {isCreating ? "Creating..." : "Create Path"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
