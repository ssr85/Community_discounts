# User Flows & Feature Specs

## Flow 1: Onboarding (New User)

```
Landing Page
    │
    ├─ "Join as Community Member" ──► Google OAuth Login
    │                                       │
    │                                       ▼
    │                              Find Your Community
    │                              (Search by society/office name)
    │                                       │
    │                              ┌────────┴────────┐
    │                              │ Community found │ Community not found
    │                              │    → Join       │ → Create new community
    │                              └────────┬────────┘
    │                                       │
    │                              Share Spending Data
    │                              ┌────────┴────────┐
    │                              │ Upload CSV      │ Enter preferences
    │                              │ (Swiggy/Zomato) │ (5 quick questions)
    │                              └────────┬────────┘
    │                                       │
    │                              ✅ Welcome to Community Dashboard
```

## Flow 2: CSV Upload

```
Dashboard → "Add Spending Data" button
    │
    ▼
Drag & Drop CSV Upload
    │
    ▼
System parses CSV (Papaparse)
    │
    ├─ Valid format? ── YES ──► Preview table shown
    │                              "We found 45 orders from the last 3 months"
    │                              ├─ Total spend: ₹18,240
    │                              ├─ Food delivery: ₹12,000 (66%)
    │                              └─ Groceries: ₹6,240 (34%)
    │                                       │
    │                              [Confirm & Add to Community]
    │
    └─ NO ──► Error message + download template link
```

## Flow 3: Group Deal Discovery

```
Community Dashboard
    │
    ▼
"AI Deals" Tab
    │
    ▼
AI-Generated Deal Cards:
┌─────────────────────────────────────────────────────────┐
│ 🍛 Biryani Blues — 15% Bulk Discount                    │
│ Your community orders here 72x/month (₹18,000 total)   │
│ 12/15 members needed ✅ ALMOST THERE                   │
│ [Join Deal — ₹250 biryani for ₹212.50]                 │
└─────────────────────────────────────────────────────────┘
    │
    ▼
User clicks "Join Deal"
    │
    ▼
Razorpay Payment Sheet opens
    │
    ├─ Payment success → Deal counter: 13/15
    │                  → If 15/15 → Deal ACTIVATED 🎉
    │                  → All 15 users notified
    │
    └─ Payment failed → Retry or cancel
```

## Flow 4: Community Dashboard View

### Key Metrics Cards (Top Row)
| Metric | Example Value |
|--------|--------------|
| Community Members | 47 |
| Monthly Collective Spend | ₹1,24,500 |
| Deals Saved This Month | ₹9,840 |
| Active Group Deals | 3 |

### Spend Breakdown Chart
- Donut chart: Food delivery (62%) / Grocery (28%) / Services (10%)
- Month-over-month bar chart

### Top Merchants Table
| Merchant | Orders | Total Spend | Trend |
|----------|--------|------------|-------|
| Swiggy   | 220    | ₹55,000    | ↑ 12% |
| Zomato   | 180    | ₹45,000    | ↓ 3%  |
| Blinkit  | 85     | ₹22,000    | ↑ 5%  |

## Flow 5: Service Provider View

```
Provider Dashboard
    │
    ├─ View incoming group deal proposals
    │  "Koregaon Park Society wants 15% bulk deal"
    │  "Expected 40+ orders/month guaranteed"
    │
    ├─ Accept / Counter-Offer
    │
    └─ Analytics: Order volume from communities
       Revenue secured vs single orders
```

