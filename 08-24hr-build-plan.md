# 24-Hour Build Plan

## Phase 1: Foundation (Hours 0-4)

### Hour 0-1: Project Setup
```bash
npx create-next-app@latest community-deals --typescript --tailwind --app
cd community-deals
npx shadcn@latest init
npx shadcn@latest add button card input badge tabs progress
npm install @supabase/supabase-js @anthropic-ai/sdk @huggingface/inference papaparse recharts
```

### Hour 1-2: Supabase Setup
- Create Supabase project
- Run all SQL from `04-database-schema.md`
- Enable Row Level Security
- Set up Google OAuth provider
- Copy env variables

### Hour 2-4: Auth + Layout
- Implement Google OAuth login
- Build navigation shell (sidebar + header)
- Create routing: `/dashboard`, `/community`, `/deals`, `/analytics`

---

## Phase 2: Core Data Flow (Hours 4-10)

### Hour 4-6: CSV Upload Pipeline
```
Components to build:
- <CsvUploader /> → react-dropzone + Papaparse
- <SpendPreview /> → show parsed data before confirming
- API: POST /api/data/upload-csv → insert to spending_records
```

### Hour 6-8: Community Dashboard
```
Components to build:
- <SpendSummaryCards /> → total spend, member count, savings
- <SpendBreakdownChart /> → Recharts donut + bar chart
- <TopMerchantsTable /> → sortable table
- API: GET /api/analytics/community → aggregated data
```

### Hour 8-10: Restaurant Directory
```
Integration to build:
- Google Maps API → fetch restaurants by pincode
- Store in restaurants table
- <RestaurantCard /> → name, rating, price level, category
- API: GET /api/restaurants/nearby?pincode=411001
```

---

## Phase 3: AI + Deals (Hours 10-18)

### Hour 10-13: HuggingFace Integration
```
Agents to build:
- Intent classifier (Mistral-7B)
- Sentiment analyzer (xlm-roberta)
- Embedding generator (MiniLM)
Test each with real queries
```

### Hour 13-16: Claude Deal Generator
```
Build:
- POST /api/agent/analyze → feed community spend to Claude
- Parse Claude JSON response
- Store insights in ai_insights table
- <DealCard /> → show AI-generated deal opportunity
```

### Hour 16-18: Group Deal Flow
```
Build:
- <GroupDealFeed /> → list of active + pending deals
- JOIN deal button → triggers Razorpay payment
- Real-time counter via Supabase subscriptions
- Activation notification when threshold reached
```

---

## Phase 4: Polish + Demo (Hours 18-24)

### Hour 18-20: Razorpay Integration
- Set up Razorpay test mode
- Implement payment flow for deal joining
- Webhook receiver for payment confirmation

### Hour 20-22: UI Polish
- Dark mode support
- Loading skeletons for all data-fetching components
- Empty states with call-to-action
- Mobile responsive check

### Hour 22-23: Demo Data
- Seed mock community: "Koregaon Park Residents"
- 15 mock members with varied spending
- 3 active group deals at different stages
- 5 AI-generated insights

### Hour 23-24: Deployment
```bash
vercel deploy --prod
# Set all env variables in Vercel dashboard
```

---

## MVP Feature Checklist

### Must Have (Core Demo)
- [x] Google OAuth login
- [x] Community creation + joining
- [x] CSV upload (Swiggy/Zomato format)
- [x] Spending breakdown dashboard
- [x] AI-generated deal recommendations (Claude)
- [x] Group deal joining flow
- [x] Real-time deal counter

### Should Have (Impressive Demo)
- [x] HuggingFace intent classification
- [x] Restaurant directory (Google Maps)
- [x] Sentiment analysis on reviews
- [x] Razorpay payment sandbox

### Nice to Have (Time Permitting)
- [ ] ONDC API integration
- [ ] Push notifications
- [ ] Provider-facing dashboard
- [ ] Savings tracker over time

---

## Demo Script (5 Minutes)

### Minute 1: Problem Setup
> "Today, 47 households in a society spend ₹1.25 lakh monthly on food delivery — but each person pays full price because they have no idea their neighbors are ordering from the same restaurants."

### Minute 2: Data Ingestion
> Show CSV upload → instantly parses Swiggy export → spending summary appears

### Minute 3: Community Intelligence
> Show dashboard: ₹55,000 spent on Swiggy alone this month. Top restaurant: Biryani Blues.

### Minute 4: AI Deal Generation
> "Claude analyzed the community's spending and found 3 bulk deal opportunities. Top pick: Negotiate 15% off at Biryani Blues — 72 orders/month qualifies for bulk pricing."

### Minute 5: Group Deal Activation
> Show group deal card: 12/15 members joined. Click "Join Deal" → payment → 13/15. 
> "Two more members, and the entire community unlocks 15% off forever."

