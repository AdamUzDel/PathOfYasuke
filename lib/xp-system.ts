import { createClient } from "@/lib/supabase/client"
import type { XPTransaction } from "@/types"

export class XPSystem {
  private supabase = createClient()

  async addXP(
    userId: string,
    amount: number,
    source: XPTransaction["source"],
    sourceId: string,
    description?: string
  ) {
    try {
      // Add XP transaction
      const { data: transaction, error: transactionError } = await this.supabase
        .from("xp_transactions")
        .insert([
          {
            user_id: userId,
            amount,
            source,
            source_id: sourceId,
            description,
          },
        ])
        .select()
        .single()

      if (transactionError) throw transactionError

      // Get current user profile
      const { data: profile, error: profileError } = await this.supabase
        .from("profiles")
        .select("xp, level")
        .eq("id", userId)
        .single()

      if (profileError) throw profileError

      // Calculate new XP and level
      const newXP = profile.xp + amount
      const newLevel = this.calculateLevel(newXP)

      // Update user profile
      const { error: updateError } = await this.supabase
        .from("profiles")
        .update({
          xp: newXP,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (updateError) throw updateError

      // Create notification for XP gain
      await this.createNotification(userId, {
        type: "xp_gained",
        title: `+${amount} XP Earned!`,
        message: description || `You earned ${amount} XP from ${source}`,
        data: { amount, source, sourceId },
      })

      // Check for level up
      if (newLevel > profile.level) {
        await this.createNotification(userId, {
          type: "level_up",
          title: `Level Up! 🎉`,
          message: `Congratulations! You've reached Level ${newLevel}`,
          data: { newLevel, oldLevel: profile.level },
        })
      }

      return { transaction, newXP, newLevel, leveledUp: newLevel > profile.level }
    } catch (error) {
      console.error("Error adding XP:", error)
      throw error
    }
  }

  calculateLevel(xp: number): number {
    // Level formula: Level = floor(sqrt(XP / 100)) + 1
    // This means: Level 1 = 0-99 XP, Level 2 = 100-399 XP, Level 3 = 400-899 XP, etc.
    return Math.floor(Math.sqrt(xp / 100)) + 1
  }

  getXPForLevel(level: number): number {
    // XP required to reach a specific level
    return (level - 1) ** 2 * 100
  }

  getXPForNextLevel(currentXP: number): number {
    const currentLevel = this.calculateLevel(currentXP)
    return this.getXPForLevel(currentLevel + 1)
  }

  getProgressToNextLevel(currentXP: number): number {
    const currentLevel = this.calculateLevel(currentXP)
    const currentLevelXP = this.getXPForLevel(currentLevel)
    const nextLevelXP = this.getXPForLevel(currentLevel + 1)
    const progressXP = currentXP - currentLevelXP
    const totalXPNeeded = nextLevelXP - currentLevelXP

    return Math.round((progressXP / totalXPNeeded) * 100)
  }

  private async createNotification(
    userId: string,
    notification: {
      type: string
      title: string
      message: string
      data?: any
    }
  ) {
    try {
      await this.supabase.from("notifications").insert([
        {
          user_id: userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          read: false,
        },
      ])
    } catch (error) {
      console.error("Error creating notification:", error)
    }
  }
}

export const xpSystem = new XPSystem()
