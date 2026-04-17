# MVP Deal Generation Design

**Date:** 2026-04-17
**Status:** Approved

## Goal
Establish a persistent data flow where mock spending data is analyzed by Claude 3.5 Sonnet to generate actionable group deals, which are then stored in Supabase and displayed on a demo dashboard.

## User Review Required
> [!IMPORTANT]
> This MVP will use a hardcoded **Demo User** and **Community ID** to bypass OAuth and RLS during initial development. This allows for rapid iteration on the AI logic.

## Proposed System Design

### 1. Data Seeding (`scripts/seed-demo.ts`)
- **Action:** A Node.js script using the Supabase Service Role key.
- **Entities:**
    - `users`: Create a "Demo User".
    - `communities`: Create "Koregaon Park Residents".
    - `community_members`: Link demo user to community.
    - `spending_records`: 100+ entries across Food, Grocery, and Utilities.
- **Rationale:** Provides enough data density for the LLM to find meaningful patterns (e.g., "7 households spend >₹2000/week at Biryani Blues").

### 2. The Intelligence Layer (Agentic Orchestration)
- **Skill:** `deal-orchestrator` in `skills/deal-orchestrator/`.
- **Model:** Claude 3.5 Sonnet (via Anthropic SDK).
- **Process:**
    1. Fetch aggregated spend from Supabase.
    2. Format prompt with community context and spending clusters.
    3. Ask Claude for 3-5 group deal suggestions in structured JSON.
    4. Save results to `group_deals`.

### 3. Application Layer (Dashboard UI)
- **Route:** `/dashboard`
- **Component:** `DealCard`
    - Visualizes the merchant, discount %, and progress (Joined/Needed).
- **Component:** `GenerateDealsButton`
    - A temporary admin control to trigger the analysis flow for testing.

## Success Criteria
1. `spending_records` table is populated.
2. `/api/agent/analyze` triggers Claude and writes to `group_deals`.
3. `/dashboard` renders cards directly from the Supabase table.
