# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Onboarding  │  │  Dashboard   │  │   Group Deals Feed   │   │
│  │  (CSV upload │  │  (Spending   │  │   (AI-recommended    │   │
│  │  + prefs)    │  │   analytics) │  │    bulk deals)       │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API / Supabase Realtime
┌───────────────────────────▼─────────────────────────────────────┐
│                       BACKEND (Node.js)                          │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ CSV Parser  │  │  Aggregation │  │  AI Agent Orchestrator │  │
│  │ (Papaparse) │  │  Engine      │  │  (Claude + HuggingFace)│  │
│  └─────────────┘  └──────────────┘  └────────────────────────┘  │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │  Razorpay   │  │  Google Maps │  │  ONDC Gateway (future) │  │
│  │  Webhooks   │  │  API Client  │  │                        │  │
│  └─────────────┘  └──────────────┘  └────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                     DATABASE (Supabase)                          │
│                                                                  │
│  users  │  communities  │  spending_records  │  group_deals      │
│  members│  restaurants  │  preferences       │  deal_bookings    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | Next.js 14 (App Router) | SSR + API routes in one project |
| UI Library | Shadcn/UI + Tailwind CSS | Fast, accessible component library |
| Charts | Recharts | Spending analytics visualization |
| File Upload | React Dropzone | CSV drag-and-drop upload |
| State | Zustand | Lightweight client state |
| Auth | Supabase Auth (Google OAuth) | One-click login |

### Backend
| Layer | Technology | Reason |
|-------|-----------|--------|
| Runtime | Node.js (Next.js API routes) | Unified full-stack |
| CSV Parsing | Papaparse | Handles Swiggy/Zomato CSV formats |
| HTTP Client | Axios | API calls to Maps, Apify |
| Webhooks | Razorpay SDK | Payment event capture |
| Job Queue | Supabase Edge Functions | Background processing |

### AI/ML
| Model | Use Case | Access |
|-------|---------|--------|
| Claude 3.5 Sonnet | Deal analysis, spend insights | Anthropic API |
| sentence-transformers/all-MiniLM-L6-v2 | Semantic restaurant matching | HuggingFace API |
| bitext/Mistral-7B-Restaurants | Intent classification | HuggingFace API |
| xlm-roberta-base-sentiment | Review sentiment (multi-language) | HuggingFace API |

### Infrastructure
| Service | Role |
|---------|------|
| Vercel | Frontend + API routes deployment |
| Supabase | Database + Auth + Realtime |
| Railway | Background job workers (optional) |
| Razorpay | Payment processing (sandbox for demo) |

---

## API Endpoints

### Auth
```
POST /api/auth/signup          → Register user + create community
POST /api/auth/login           → OAuth via Supabase
```

### Data Ingestion
```
POST /api/data/upload-csv      → Parse + ingest Swiggy/Zomato CSV
POST /api/data/preferences     → Store manual preferences
POST /api/webhooks/razorpay    → Capture payment events
```

### Community
```
POST /api/community/create     → Create new community
POST /api/community/join       → Join existing community by code
GET  /api/community/:id/stats  → Aggregated spend stats
GET  /api/community/:id/members→ Community member list
```

### Analytics
```
GET  /api/analytics/spending   → Personal spend breakdown
GET  /api/analytics/community  → Community-level insights
GET  /api/analytics/trends     → Month-over-month spend trends
```

### Deals
```
GET  /api/deals/recommendations→ AI-generated group deal suggestions
POST /api/deals/create         → Create new group deal proposal
POST /api/deals/:id/join       → Join an existing group deal
GET  /api/deals/active         → All active deals in community
```

### AI Agent
```
POST /api/agent/analyze        → Trigger Claude analysis on community data
POST /api/agent/match-groups   → Find group deal matches across users
GET  /api/agent/insights       → Latest AI-generated community insights
```

### External Integrations
```
GET  /api/restaurants/nearby   → Google Maps restaurants by location
GET  /api/restaurants/:id      → Restaurant details + pricing
POST /api/scrape/menu          → Apify Swiggy menu scraper trigger
```

