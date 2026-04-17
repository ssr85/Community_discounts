# Folder Structure & Multi-Agent Design

**Date:** 2026-04-17
**Status:** Approved

## Goal
Restructure the `Community_Discounts` project to follow an agentic architecture, modularizing AI capabilities into "Skills" and defining a central "Orchestrator" in a `.agent` workspace.

## Architecture

### 1. The Intelligence Layer (`.agent/` & `skills/`)
The project uses a split intelligence model:
- **Orchestrator (`.agent/`)**: A Claude 3.5 Sonnet agent that handles high-level reasoning, intent routing, and final synthesis.
- **Skills (`skills/`)**: Specialized workers using various HuggingFace models for discrete tasks (Intent, Sentiment, Matching).

### 2. The Application Layer (`src/`)
A Next.js 14 (App Router) project that consumes the records from Supabase and triggers agent workflows via API routes.

## Component Breakdown

### `.agent/`
- `AGENT.md`: System prompt defining the "Community Savings Advisor" persona.
- `orchestrator.ts`: Implementation of the routing logic that decides which skills to invoke based on user input or scheduled jobs.

### `skills/`
Each skill follows a standard structure:
- `SKILL.md`: Metadata (name, model, description) and prompting instructions.
- `provider.ts`: The HTTP client logic for the specific HuggingFace or Anthropic model.

Targets:
1. `intent-classifier`: Mistral-7B for understanding query labels (find_restaurant, check_price, etc.).
2. `sentiment-analyzer`: XLM-RoBERTa for community review processing.
3. `semantic-matcher`: MiniLM-L6-v2 for personalized restaurant recommendations.
4. `deal-orchestrator`: Claude 3.5 for analyzing spend data and finding bulk deal opportunities.

---

## Implementation Sequence
1. **Bootstrap Next.js**: Initialize the Next.js 14 project in the root directory.
2. **Scaffold Agents**: Create `.agent` and `skills` folders with their respective stubs.
3. **Migrate Logic**: Move code snippets from `docs/05-ai-agent.md` into the `provider.ts` files within each skill.
4. **Environment Setup**: Define necessary keys for HuggingFace and Anthropic.
