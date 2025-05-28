"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { UserProfile } from "@/types"

interface UserContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error fetching profile:", error)
      return null
    }
  }

  const createProfile = async (user: User) => {
    try {
      const profileData = {
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        level: 1,
        xp: 0,
        streak: 0,
        resilience_score: 50,
        subscription_tier: "free" as const,
      }

      const { data, error } = await supabase.from("profiles").insert([profileData]).select().single()

      if (error) {
        console.error("Error creating profile:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error creating profile:", error)
      return null
    }
  }

  const refreshProfile = async () => {
    if (!user) return

    let profileData = await fetchProfile(user.id)

    // Create profile if it doesn't exist
    if (!profileData) {
      profileData = await createProfile(user)
    }

    setProfile(profileData)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        await refreshProfile()
      }

      setLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        await refreshProfile()
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Update profile when user changes
  useEffect(() => {
    if (user) {
      refreshProfile()
    
      // Subscribe to XP transactions to refresh profile
      const subscription = supabase
        .channel('xp-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'xp_transactions',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // Refresh profile when XP changes
            refreshProfile()
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user])

  return (
    <UserContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>{children}</UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
