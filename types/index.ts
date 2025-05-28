// Development Plan for Path of Yasuke
/*
STEP 1: Project Setup & Foundation ✅
- Next.js 14 App Router with TypeScript
- Tailwind CSS with custom Yasuke theme
- Shadcn UI components
- Dark theme with crimson, gold, steel-gray palette

STEP 2: Authentication System ✅
- Supabase Auth integration
- Email/password + Google OAuth
- Protected routes middleware
- User context for session management

STEP 3: Database Schema Design (IN PROGRESS)
- Users table (profile, subscription, stats)
- Paths table (growth paths/categories)
- Goals table (under paths)
- Tasks table (under goals)
- Journal entries table
- XP/achievements tracking

STEP 4: Core App Pages
- Dashboard (current progress, daily quests)
- Path Builder (create/manage growth paths)
- Honor Journal (daily reflection)
- Profile & Settings
- Store (digital assets)

STEP 5: Gamification System
- XP calculation and leveling
- Streak tracking
- Achievement badges
- Resilience meter
- Progress visualization

STEP 6: Premium Features
- Subscription management
- Advanced analytics
- AI mentor integration (future)
- Export functionality
- Custom themes

STEP 7: Mobile Optimization
- PWA capabilities
- Touch-friendly interactions
- Responsive design refinement
- Offline functionality

STEP 8: Performance & SEO
- Image optimization
- Code splitting
- Meta tags and OpenGraph
- Analytics integration

STEP 9: Testing & Quality
- Unit tests for core functions
- E2E testing for user flows
- Accessibility compliance
- Performance monitoring

STEP 10: Deployment & Monitoring
- Vercel deployment
- Environment configuration
- Error tracking
- User feedback system
*/

// Supabase Auth Types
export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  level: number
  xp: number
  streak: number
  resilience_score: number
  subscription_tier: "free" | "pro" | "team"
  created_at?: string
  updated_at?: string
}

// Core Types for the Application
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  level: number
  xp: number
  streak: number
  resilience_score: number
  subscription_tier: "free" | "pro" | "team"
  created_at: string
  updated_at: string
}

export interface Path {
  id: string
  user_id: string
  title: string
  description?: string
  color: string
  progress: number
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  path_id: string
  title: string
  description?: string
  due_date?: string
  virtue?: string
  status: "pending" | "in_progress" | "completed" | "paused"
  completed: boolean
  xp_reward: number
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  goal_id: string
  title: string
  description?: string
  completed: boolean
  xp_reward: number
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  goal_id: string
  note: string
  completed: boolean
  created_at: string
}

export interface JournalEntry {
  id: string
  user_id: string
  title?: string
  content: string
  mood?: number
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  xp_reward: number
  rarity: "common" | "rare" | "epic" | "legendary"
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
}

export interface DailyQuest {
  id: string
  user_id: string
  title: string
  description: string
  xp_reward: number
  completed: boolean
  quest_type: "meditation" | "exercise" | "reading" | "journaling" | "custom"
  created_at: string
  completed_at?: string
}

export interface StoreItem {
  id: string
  title: string
  description: string
  price: number
  category: "theme" | "avatar" | "badge" | "journal_template"
  image_url?: string
  is_premium: boolean
}

export interface Subscription {
  id: string
  user_id: string
  tier: "free" | "pro" | "team"
  status: "active" | "canceled" | "past_due"
  current_period_start: string
  current_period_end: string
  stripe_subscription_id?: string
}

// Gamification Types
export interface XPTransaction {
  id: string
  user_id: string
  amount: number
  source: "quest" | "goal" | "task" | "journal" | "streak" | "achievement"
  source_id: string
  description?: string
  created_at: string
}

export interface Virtue {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

// The Seven Virtues of the Samurai
export const SAMURAI_VIRTUES: Virtue[] = [
  {
    id: "rectitude",
    name: "Rectitude (義)",
    description: "Moral uprightness and righteousness in all actions",
    icon: "Scale",
    color: "yasuke-crimson",
  },
  {
    id: "courage",
    name: "Courage (勇)",
    description: "Bravery in the face of fear and adversity",
    icon: "Shield",
    color: "yasuke-gold",
  },
  {
    id: "benevolence",
    name: "Benevolence (仁)",
    description: "Compassion and kindness toward others",
    icon: "Heart",
    color: "yasuke-steel",
  },
  {
    id: "respect",
    name: "Respect (礼)",
    description: "Courtesy and honor in all interactions",
    icon: "Bow",
    color: "yasuke-crimson",
  },
  {
    id: "honesty",
    name: "Honesty (誠)",
    description: "Truthfulness and sincerity in word and deed",
    icon: "Eye",
    color: "yasuke-gold",
  },
  {
    id: "honor",
    name: "Honor (名誉)",
    description: "Living with dignity and maintaining reputation",
    icon: "Crown",
    color: "yasuke-steel",
  },
  {
    id: "loyalty",
    name: "Loyalty (忠義)",
    description: "Faithfulness to principles and commitments",
    icon: "Anchor",
    color: "yasuke-crimson",
  },
]

// Database Schema SQL for Supabase
export const DATABASE_SCHEMA = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  resilience_score INTEGER DEFAULT 50,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'team')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Paths table (updated)
CREATE TABLE paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'yasuke-crimson',
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goals table (updated)
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  path_id UUID REFERENCES paths(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'paused')),
  due_date DATE,
  virtue TEXT,
  completed BOOLEAN DEFAULT FALSE,
  xp_reward INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities table (updated - renamed from tasks for clarity)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  xp_reward INTEGER DEFAULT 25,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journal entries table
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily quests table
CREATE TABLE daily_quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quest_type TEXT DEFAULT 'custom' CHECK (quest_type IN ('meditation', 'exercise', 'reading', 'journaling', 'custom')),
  xp_reward INTEGER DEFAULT 30,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- XP transactions table
CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('quest', 'goal', 'activity', 'journal', 'streak', 'achievement')),
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 100,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements table
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Paths policies
CREATE POLICY "Users can view own paths" ON paths FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own paths" ON paths FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own paths" ON paths FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own paths" ON paths FOR DELETE USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can view own goals" ON goals FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM paths WHERE paths.id = goals.path_id)
);
CREATE POLICY "Users can create own goals" ON goals FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM paths WHERE paths.id = goals.path_id)
);
CREATE POLICY "Users can update own goals" ON goals FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM paths WHERE paths.id = goals.path_id)
);
CREATE POLICY "Users can delete own goals" ON goals FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM paths WHERE paths.id = goals.path_id)
);

-- Activities policies
CREATE POLICY "Users can view own activities" ON activities FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM paths WHERE paths.id = (SELECT path_id FROM goals WHERE goals.id = activities.goal_id))
);
CREATE POLICY "Users can create own activities" ON activities FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM paths WHERE paths.id = (SELECT path_id FROM goals WHERE goals.id = activities.goal_id))
);
CREATE POLICY "Users can update own activities" ON activities FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM paths WHERE paths.id = (SELECT path_id FROM goals WHERE goals.id = activities.goal_id))
);
CREATE POLICY "Users can delete own activities" ON activities FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM paths WHERE paths.id = (SELECT path_id FROM goals WHERE goals.id = activities.goal_id))
);

-- Journal entries policies
CREATE POLICY "Users can view own journal entries" ON journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own journal entries" ON journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal entries" ON journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal entries" ON journal_entries FOR DELETE USING (auth.uid() = user_id);

-- Daily quests policies
CREATE POLICY "Users can view own daily quests" ON daily_quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own daily quests" ON daily_quests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily quests" ON daily_quests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own daily quests" ON daily_quests FOR DELETE USING (auth.uid() = user_id);

-- XP transactions policies
CREATE POLICY "Users can view own xp transactions" ON xp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own xp transactions" ON xp_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User achievements policies
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Achievements are public (read-only)
CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_paths_updated_at BEFORE UPDATE ON paths FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data?: any
  read: boolean
  created_at: string
}

export const NOTIFICATIONS_SCHEMA = `
-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- Update XP transactions table to include description
ALTER TABLE xp_transactions ADD COLUMN description TEXT;

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_id_read ON notifications(user_id, read);
CREATE INDEX idx_xp_transactions_user_id_created_at ON xp_transactions(user_id, created_at DESC);
`;
