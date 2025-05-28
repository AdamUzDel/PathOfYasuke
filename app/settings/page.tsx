"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/components/providers/user-provider"
import { createClient } from "@/lib/supabase/client"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { User, Bell, Shield, Trash2, Crown } from "lucide-react"

export default function SettingsPage() {
  const { user, profile, loading, refreshProfile } = useUser()
  const [isUpdating, setIsUpdating] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
  })
  const [notifications, setNotifications] = useState({
    daily_reminders: true,
    achievement_alerts: true,
    weekly_summary: true,
    marketing_emails: false,
  })
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email || "",
      })
    }
  }, [profile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const updateProfile = async () => {
    if (!user) return

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      await refreshProfile()

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      })
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteAccount = async () => {
    if (!user) return

    try {
      // This would typically involve calling a server function
      // For now, we'll just show a message
      toast({
        title: "Account deletion requested",
        description: "Please contact support to complete account deletion.",
      })
    } catch (error) {
      toast({
        title: "Deletion failed",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading settings..." />
        </div>
      </AppLayout>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <AppLayout title="Settings" subtitle="Manage your account and preferences">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences"
        showBackButton
        backUrl="/dashboard"
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Privacy & Security
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Crown className="w-4 h-4 mr-2" />
                  Subscription
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Profile Information
                </CardTitle>
                <CardDescription>Update your personal information and profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" value={formData.email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed. Contact support if needed.</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div>
                    <Label>Current Level</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-yasuke-crimson border-yasuke-crimson/50">
                        Level {profile.level}
                      </Badge>
                      <Badge variant="outline" className="text-yasuke-gold border-yasuke-gold/50">
                        {profile.xp} XP
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label>Subscription</Label>
                    <div className="mt-1">
                      <Badge variant="outline" className="capitalize">
                        {profile.subscription_tier}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button onClick={updateProfile} disabled={isUpdating} className="yasuke-gradient hover:opacity-90">
                  {isUpdating ? "Updating..." : "Update Profile"}
                </Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Choose what notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label className="capitalize">{key.replace(/_/g, " ")}</Label>
                      <p className="text-sm text-muted-foreground">
                        {key === "daily_reminders" && "Get reminded about your daily quests"}
                        {key === "achievement_alerts" && "Notifications when you earn achievements"}
                        {key === "weekly_summary" && "Weekly progress summary emails"}
                        {key === "marketing_emails" && "Product updates and promotional content"}
                      </p>
                    </div>
                    <Switch checked={value} onCheckedChange={(checked) => handleNotificationChange(key, checked)} />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Subscription Settings */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crown className="w-5 h-5 mr-2" />
                  Subscription
                </CardTitle>
                <CardDescription>Manage your subscription and billing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                  <div>
                    <h4 className="font-medium capitalize">{profile.subscription_tier} Plan</h4>
                    <p className="text-sm text-muted-foreground">
                      {profile.subscription_tier === "free"
                        ? "Basic features with limited access"
                        : "Full access to all premium features"}
                    </p>
                  </div>
                  {profile.subscription_tier === "free" ? (
                    <Button className="yasuke-gradient hover:opacity-90">Upgrade to Pro</Button>
                  ) : (
                    <Button variant="outline">Manage Billing</Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="bg-card/50 backdrop-blur-sm border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                  <Trash2 className="w-5 h-5 mr-2" />
                  Danger Zone
                </CardTitle>
                <CardDescription>Irreversible and destructive actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Delete Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Delete Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account and remove all your
                          data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteAccount} className="bg-destructive hover:bg-destructive/90">
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
