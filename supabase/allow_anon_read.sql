-- Allow anonymous read access for demo purposes (Login Shortcuts)
DROP POLICY IF EXISTS "Allow anonymous read for users" ON public.users;
CREATE POLICY "Allow anonymous read for users" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous read for communities" ON public.communities;
CREATE POLICY "Allow anonymous read for communities" ON public.communities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous read for community_members" ON public.community_members;
CREATE POLICY "Allow anonymous read for community_members" ON public.community_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous read for spending_records" ON public.spending_records;
CREATE POLICY "Allow anonymous read for spending_records" ON public.spending_records FOR SELECT USING (true);
