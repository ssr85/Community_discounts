# Data Sources & Acquisition Strategy

## The Core Data Problem
Swiggy and Zomato do NOT expose user transaction data via public APIs. All individual spending history is locked within their ecosystems.

---

## Data Acquisition Paths (Ranked by Feasibility)

### Path 1: User Consent CSV Upload ✅ (Primary — Hackathon MVP)
**How:** Users export their order history from Swiggy/Zomato (both apps allow this), then upload to platform.

**Swiggy Export:**
- Profile → Order History → Download (CSV/JSON)

**Zomato Export:**
- Account → Privacy Settings → Download My Data

**Data format expected:**
```json
{
  "orders": [
    {
      "date": "2026-04-10",
      "platform": "Swiggy",
      "restaurant": "Pizza Hut",
      "amount": 450,
      "category": "food_delivery",
      "items": ["Pepperoni Pizza", "Garlic Bread"]
    }
  ]
}
```

**Build time:** 2-3 hours
**Privacy:** User explicitly consents, GDPR/DPDP compliant

---

### Path 2: Manual Preference Entry ✅ (Fallback / New Users)
**How:** Users answer 5 questions about their ordering habits.

**Questions:**
1. What do you order most? (Food / Groceries / Both)
2. How often? (Daily / 3x week / Weekly)
3. Average spend per order? (₹150-300 / ₹300-500 / ₹500+)
4. Preferred platforms? (Swiggy / Zomato / Blinkit / All)
5. Which area/society are you from?

**AI Inference (HuggingFace):** Preferences → estimated monthly spend
```
Input: "biryani, 2x/week, ₹300 avg"
Output: ₹2,400/month on food delivery (estimated)
```

**Build time:** 2-3 hours

---

### Path 3: Razorpay Webhooks ⚡ (For In-App Transactions)
**How:** When users pay via the platform, Razorpay webhooks capture transaction data automatically.

**Endpoint:** `POST /api/webhooks/razorpay`
**Events captured:**
- `payment.captured` → successful transaction
- `payment.failed` → failed payment (for retry flow)
- `order.paid` → full order confirmation

**Build time:** 1-2 hours
**Best for:** Tracking purchases made directly through the platform

---

### Path 4: ONDC API Integration 🔮 (Future / Post-Hackathon)
**How:** Register as ONDC buyer app → get access to all ONDC network orders.
**Staging URL:** `https://staging.gateway.proteantech.in/search`
**Build time:** 2-3 days (registration + integration)
**Status:** Requires ONDC onboarding approval

---

### Path 5: Google Maps API 🗺️ (Restaurant Discovery)
**How:** Pull restaurant data by location — names, ratings, categories, price levels.
**Endpoint:** `https://maps.googleapis.com/maps/api/place/textsearch/json`
**Cost:** Free tier (first ₹14,000/month)
**Use case:** Build the restaurant directory that community spending maps to.

---

### Path 6: Apify Swiggy Scraper 🕷️ (Restaurant Catalog Only)
**How:** Use Apify's pre-built Swiggy scraper to pull restaurant menus and pricing.
**API:** `https://api.apify.com/v2/acts/infoweaver~my-actor/run`
**Cost:** ~$5 per 1,000 restaurants
**Use case:** Get current menu prices to show "bulk discount vs standard price"

---

## Data Flow Architecture

```
User A uploads Swiggy CSV ──┐
User B enters preferences ──┤──► Supabase Aggregation Engine
User C uploads Zomato CSV ──┤         │
Razorpay webhook ───────────┘         ▼
                               Community Spend Profile
                                       │
                                       ▼
                               AI Agent (Claude + HuggingFace)
                                       │
                              ┌────────┴────────┐
                              ▼                 ▼
                        Group Deal          Spend Insights
                        Matching            Dashboard
```

---

## Privacy & Compliance

| Principle | Implementation |
|-----------|---------------|
| Explicit Consent | User ticks checkbox before data upload |
| Data Minimization | Only store aggregated community data, not individual details |
| Right to Delete | User can wipe their data from profile settings |
| Anonymization | Community reports show totals only (no individual names) |
| DPDP Compliance | Follows India's Digital Personal Data Protection Act 2023 |

