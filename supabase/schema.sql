-- Run this in Supabase SQL Editor

-- Users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT UNIQUE NOT NULL,
  full_name     TEXT,
  avatar_url    TEXT,
  pincode       TEXT,
  role          TEXT NOT NULL DEFAULT 'member',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Communities
CREATE TABLE IF NOT EXISTS public.communities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'residential',
  pincode       TEXT,
  city          TEXT,
  invite_code   TEXT UNIQUE NOT NULL DEFAULT substring(gen_random_uuid()::text, 1, 8),
  admin_id      UUID REFERENCES public.users(id),
  member_count  INTEGER DEFAULT 0,
  total_spend   NUMERIC DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Community Members
CREATE TABLE IF NOT EXISTS public.community_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id    UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  data_shared     BOOLEAN DEFAULT FALSE,
  UNIQUE(community_id, user_id)
);

-- Spending Records
CREATE TABLE IF NOT EXISTS public.spending_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.users(id) ON DELETE CASCADE,
  community_id    UUID REFERENCES public.communities(id),
  date            DATE NOT NULL,
  platform        TEXT NOT NULL,
  merchant_name   TEXT NOT NULL,
  amount          NUMERIC NOT NULL,
  category        TEXT NOT NULL DEFAULT 'food_delivery',
  items           JSONB,
  source          TEXT DEFAULT 'csv_upload',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Group Deals
CREATE TABLE IF NOT EXISTS public.group_deals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id    UUID REFERENCES public.communities(id),
  merchant_name   TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  discount_pct    NUMERIC NOT NULL,
  min_orders      INTEGER NOT NULL,
  current_orders  INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'pending',
  valid_until     TIMESTAMPTZ,
  ai_generated    BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Deal Bookings (join tracking, no payment for MVP)
CREATE TABLE IF NOT EXISTS public.deal_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         UUID REFERENCES public.group_deals(id),
  user_id         UUID REFERENCES public.users(id),
  status          TEXT DEFAULT 'joined',
  booked_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(deal_id, user_id)
);

-- AI Insights
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id    UUID REFERENCES public.communities(id),
  insight_type    TEXT NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  data            JSONB,
  generated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Triggers ──────────────────────────────────────────────────────────────────

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    role = COALESCE(EXCLUDED.role, public.users.role);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update community member_count
CREATE OR REPLACE FUNCTION public.update_member_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.communities
  SET member_count = (
    SELECT COUNT(*) FROM public.community_members WHERE community_id = COALESCE(NEW.community_id, OLD.community_id)
  )
  WHERE id = COALESCE(NEW.community_id, OLD.community_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_member_change ON public.community_members;
CREATE TRIGGER on_member_change
  AFTER INSERT OR DELETE ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.update_member_count();

-- Update deal current_orders on booking
CREATE OR REPLACE FUNCTION public.update_deal_orders()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.group_deals
  SET current_orders = (
    SELECT COUNT(*) FROM public.deal_bookings WHERE deal_id = COALESCE(NEW.deal_id, OLD.deal_id)
  ),
  status = CASE
    WHEN (SELECT COUNT(*) FROM public.deal_bookings WHERE deal_id = COALESCE(NEW.deal_id, OLD.deal_id)) >=
         (SELECT min_orders FROM public.group_deals WHERE id = COALESCE(NEW.deal_id, OLD.deal_id))
    THEN 'active'
    ELSE 'pending'
  END
  WHERE id = COALESCE(NEW.deal_id, OLD.deal_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_change ON public.deal_bookings;
CREATE TRIGGER on_booking_change
  AFTER INSERT OR DELETE ON public.deal_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_deal_orders();

-- ── Row Level Security ─────────────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view and update own profile" ON public.users;
CREATE POLICY "Users can view and update own profile"
  ON public.users FOR ALL USING (auth.uid() = id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin');

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view their communities" ON public.communities;
CREATE POLICY "Members can view their communities"
  ON public.communities FOR SELECT
  USING (
    id IN (SELECT community_id FROM public.community_members WHERE user_id = auth.uid())
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
  );
DROP POLICY IF EXISTS "Authenticated users can create communities" ON public.communities;
CREATE POLICY "Authenticated users can create communities"
  ON public.communities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins can update their community" ON public.communities;
CREATE POLICY "Admins can update their community"
  ON public.communities FOR UPDATE USING (admin_id = auth.uid());

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view their memberships" ON public.community_members;
CREATE POLICY "Members can view their memberships"
  ON public.community_members FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
CREATE POLICY "Users can join communities"
  ON public.community_members FOR INSERT WITH CHECK (user_id = auth.uid());

ALTER TABLE public.spending_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own spending records" ON public.spending_records;
CREATE POLICY "Users see own spending records"
  ON public.spending_records FOR ALL USING (
    user_id = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
  );

ALTER TABLE public.group_deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members see community deals" ON public.group_deals;
CREATE POLICY "Members see community deals"
  ON public.group_deals FOR SELECT
  USING (
    community_id IN (SELECT community_id FROM public.community_members WHERE user_id = auth.uid())
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
  );
DROP POLICY IF EXISTS "Authenticated users can insert deals" ON public.group_deals;
CREATE POLICY "Authenticated users can insert deals"
  ON public.group_deals FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public.deal_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own bookings" ON public.deal_bookings;
CREATE POLICY "Users manage own bookings"
  ON public.deal_bookings FOR ALL USING (user_id = auth.uid());

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members see community insights" ON public.ai_insights;
CREATE POLICY "Members see community insights"
  ON public.ai_insights FOR SELECT
  USING (community_id IN (SELECT community_id FROM public.community_members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Service role can insert insights" ON public.ai_insights;
CREATE POLICY "Service role can insert insights"
  ON public.ai_insights FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
