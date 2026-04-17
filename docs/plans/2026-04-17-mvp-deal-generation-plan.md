# MVP Deal Generation Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Build a functional MVP where mock spending data is analyzed by Claude to generate group deals displayed on a dashboard.

**Architecture:** A 3-tier flow: (1) Seeder script for mock data, (2) Next.js API route to trigger Claude analysis, (3) Dashboard page to render results from Supabase.

**Tech Stack:** Next.js 14/16, Supabase, Anthropic SDK (Claude 3.5 Sonnet), Recharts.

---

### Task 1: Seed Demo Data
**Files:**
- Create: `scripts/seed-demo.ts`

**Step 1: Create the seeding script**
Develop a Node.js script that uses the Supabase Service Role key to:
1. Insert a demo user and community ("Koregaon Park Residents").
2. Link them via `community_members`.
3. Ingest 150+ `spending_records` for the community.

**Step 2: Run the script**
`npx tsx scripts/seed-demo.ts`
Expected: "Successfully seeded 150 records."

**Step 3: Verify in Supabase**
Run `supabase status` or check the dashboard to confirm data presence.

---

### Task 2: Deal-Orchestrator Skill implementation
**Files:**
- Create: `skills/deal-orchestrator/SKILL.md`
- Create: `skills/deal-orchestrator/provider.ts`

**Step 1: Define the skill metadata**
Document the system prompt and purpose of the deal-orchestrator.

**Step 2: Implement the provider**
Write the TypeScript logic to fetch aggregated spending from Supabase and call Claude 3.5 Sonnet to generate `group_deals`.

---

### Task 3: API Route for AI Analysis
**Files:**
- Create: `src/app/api/agent/analyze/route.ts`

**Step 1: Create the endpoint**
Implement a POST route that invokes the `deal-orchestrator` skill and saves the response to the `group_deals` table.

**Step 2: Manual Test**
`curl -X POST http://localhost:3000/api/agent/analyze`
Expected: 201 Created with JSON array of deals.

---

### Task 4: Dashboard UI
**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/components/DealCard.tsx`

**Step 1: Build the layout**
Create a Next.js page that fetches `group_deals` from Supabase and renders them in a grid.

**Step 2: Add Generate Button**
Include a "Refresh Analysis" button that calls `/api/agent/analyze`.

**Step 3: Verification**
Load the dashboard in the browser and verify deals appear correctly.

---

### Verification Plan
1. Run `scripts/seed-demo.ts`.
2. Check `spending_records` table count via `psql` or Supabase UI.
3. Call `POST /api/agent/analyze` and verify `group_deals` table populated.
4. Open `/dashboard` and verify deals are visible.
