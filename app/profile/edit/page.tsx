"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/components/providers/user-provider"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { User, Camera, Save } from "lucide-react"

export default function EditProfilePage() {
  const { user, profile, refreshProfile } = useUser()
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    avatar_url: "",
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        bio: "", // We'll add bio field to the database later
        avatar_url: profile.avatar_url || "",
      })
      setIsLoading(false)
    }
  }, [profile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)

      setFormData((prev) => ({
        ...prev,
        avatar_url: data.publicUrl,
      }))

      toast({
        title: "Avatar uploaded",
        description: "Your avatar has been uploaded successfully.",
      })
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!formData.full_name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your full name.",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name.trim(),
          avatar_url: formData.avatar_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      await refreshProfile()

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })

      router.push("/profile")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
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
          <LoadingSpinner size="lg" text="Loading profile..." />
        </div>
      </AppLayout>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <AppLayout title="Edit Profile" subtitle="Update your information">
      <PageHeader
        title="Edit Profile"
        description="Update your profile information and preferences"
        showBackButton
        backUrl="/profile"
      />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2 text-yasuke-crimson" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal information and how others see you on the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Section */}
              <div className="space-y-4">
                <Label>Profile Picture</Label>
                <div className="flex items-center space-x-6">
                  <Avatar className="w-24 h-24 border-4 border-yasuke-crimson/20">
                    <AvatarImage src={formData.avatar_url || "/placeholder.svg"} alt={formData.full_name} />
                    <AvatarFallback className="text-xl bg-gradient-to-br from-yasuke-crimson to-yasuke-gold text-white">
                      {formData.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <div className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <Camera className="w-4 h-4" />
                        <span>Change Avatar</span>
                      </div>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </Label>
                    <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 2MB.</p>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
                <p className="text-sm text-muted-foreground">This is how your name will appear to other users.</p>
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile.email} disabled className="bg-muted" />
                <p className="text-sm text-muted-foreground">
                  Email cannot be changed. Contact support if you need to update your email.
                </p>
              </div>

              {/* Bio (Future feature) */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Coming Soon)</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell others about your journey and goals..."
                  rows={4}
                  disabled
                />
                <p className="text-sm text-muted-foreground">
                  Share your story and inspire others on their path of self-mastery.
                </p>
              </div>

              {/* Avatar URL (Manual entry) */}
              <div className="space-y-2">
                <Label htmlFor="avatar_url">Avatar URL (Optional)</Label>
                <Input
                  id="avatar_url"
                  name="avatar_url"
                  value={formData.avatar_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/your-avatar.jpg"
                />
                <p className="text-sm text-muted-foreground">Or paste a direct link to your avatar image.</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-6">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating} className="yasuke-gradient hover:opacity-90">
                  <Save className="w-4 h-4 mr-2" />
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 mt-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details and subscription status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Account Level</Label>
                <p className="font-medium">Level {profile.level}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Total XP</Label>
                <p className="font-medium">{profile.xp.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Subscription</Label>
                <p className="font-medium capitalize">{profile.subscription_tier}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Member Since</Label>
                <p className="font-medium">{new Date(profile.created_at || "").toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
