-- 1. Fix Infinite Recursion in Users Table Policy
-- The previous policy was self-referencing in a way that caused a loop.
-- We'll replace it with a more robust version and allow public read for the demo.

DROP POLICY IF EXISTS "Users can view and update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow anonymous read for users" ON public.users;

-- Allow anyone to see basic user info (needed for login shortcuts)
CREATE POLICY "Allow public read for users"
  ON public.users FOR SELECT
  USING (true);

-- Allow users to update only their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- 2. Fix Communities Policy
DROP POLICY IF EXISTS "Members can view their communities" ON public.communities;
DROP POLICY IF EXISTS "Allow anonymous read for communities" ON public.communities;

-- Allow public read for communities (needed for login shortcuts)
CREATE POLICY "Allow public read for communities"
  ON public.communities FOR SELECT
  USING (true);

-- 3. Fix Community Members Policy
DROP POLICY IF EXISTS "Members can view their memberships" ON public.community_members;
DROP POLICY IF EXISTS "Allow anonymous read for community_members" ON public.community_members;

-- Allow public read for community members (needed for login shortcuts)
CREATE POLICY "Allow public read for community_members"
  ON public.community_members FOR SELECT
  USING (true);

-- 4. Fix Spending Records Policy
DROP POLICY IF EXISTS "Users see own spending records" ON public.spending_records;
DROP POLICY IF EXISTS "Allow anonymous read for spending_records" ON public.spending_records;

-- Allow public read for spending records (needed for login shortcuts to check for "Active" admins/members)
CREATE POLICY "Allow public read for spending_records"
  ON public.spending_records FOR SELECT
  USING (true);

-- 5. Fix Group Deals Policy
DROP POLICY IF EXISTS "Members see community deals" ON public.group_deals;
CREATE POLICY "Allow public read for group_deals"
  ON public.group_deals FOR SELECT
  USING (true);
