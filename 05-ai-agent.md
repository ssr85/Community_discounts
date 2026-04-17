# AI Agent Logic & Workflows

## Agent Architecture

The platform uses a **multi-agent pipeline** where different models handle different responsibilities:

```
User Trigger / Scheduled Job
         │
         ▼
┌─────────────────────────┐
│  Orchestrator (Claude)  │  ← Decides which agents to invoke
└────────────┬────────────┘
             │
    ┌────────┼──────────────┐
    ▼        ▼              ▼
[Intent]  [Sentiment]  [Recommendation]
[Agent]   [Agent]      [Agent]
 │            │              │
 HF Mistral  HF XLM-RoBERTa  HF sentence-transformers
             │              │
             └──────┬───────┘
                    ▼
           [Claude Final Agent]
           Synthesizes insights
           Generates deal recommendations
```

---

## Agent 1: Intent Classifier (HuggingFace)

**Model:** `bitext/Mistral-7B-Restaurants`
**Purpose:** Understand what user wants when they type a query

```javascript
// POST https://api-inference.huggingface.co/models/bitext/Mistral-7B-Restaurants
const classifyIntent = async (userQuery) => {
  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${HF_API_KEY}` },
    body: JSON.stringify({
      inputs: userQuery,
      parameters: { candidate_labels: [
        'find_restaurant',
        'check_menu_price',
        'book_group_deal',
        'view_community_spending',
        'report_quality_issue',
        'find_home_service'
      ]}
    })
  });
  const data = await response.json();
  return data.labels[0]; // highest confidence label
};
```

**Example:**
```
Input: "Mujhe saste me paneer dhundhna hai mere area mein"
Output: "find_restaurant" (confidence: 0.94)
→ Triggers restaurant search with filters: cuisine=paneer, price=low
```

---

## Agent 2: Sentiment Analyzer (HuggingFace)

**Model:** `cardiffnlp/twitter-xlm-roberta-base-sentiment`
**Purpose:** Analyze community reviews in Hindi + English

```javascript
const analyzeSentiment = async (reviewTexts) => {
  const results = await Promise.all(
    reviewTexts.map(text =>
      fetch('https://api-inference.huggingface.co/models/cardiffnlp/twitter-xlm-roberta-base-sentiment', {
        method: 'POST',
        headers: { Authorization: `Bearer ${HF_API_KEY}` },
        body: JSON.stringify({ inputs: text })
      }).then(r => r.json())
    )
  );
  // Returns: [{label: 'positive'|'negative'|'neutral', score: 0.92}]
  return results;
};
```

**Output Example:**
```json
{
  "restaurant": "Biryani Blues",
  "reviews_analyzed": 24,
  "sentiment": {
    "positive": 17,
    "negative": 5,
    "neutral": 2
  },
  "score": 0.71,
  "trend": "declining",   // was 0.85 last month
  "alert": "Quality drop detected. 5 negative reviews mention 'cold food' this week."
}
```

---

## Agent 3: Semantic Matcher (HuggingFace)

**Model:** `sentence-transformers/all-MiniLM-L6-v2`
**Purpose:** Find semantically similar restaurants/services to what user wants

```javascript
const generateEmbedding = async (text) => {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${HF_API_KEY}` },
      body: JSON.stringify({ inputs: text })
    }
  );
  return response.json(); // Returns float array (384 dimensions)
};

const cosineSimilarity = (a, b) => {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (magA * magB);
};

const findSimilarRestaurants = async (userQuery, restaurantList) => {
  const queryEmbedding = await generateEmbedding(userQuery);
  const scores = await Promise.all(
    restaurantList.map(async (restaurant) => {
      const restEmbedding = await generateEmbedding(
        `${restaurant.name} ${restaurant.cuisine} ${restaurant.description}`
      );
      return {
        restaurant,
        score: cosineSimilarity(queryEmbedding, restEmbedding)
      };
    })
  );
  return scores.sort((a, b) => b.score - a.score).slice(0, 5);
};
```

---

## Agent 4: Deal Orchestrator (Claude)

**Model:** Claude 3.5 Sonnet
**Purpose:** Analyze community spend data, identify deal opportunities, generate insights

```javascript
const generateDealInsights = async (communityData) => {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: `You are a community savings advisor. 
    Analyze community spending patterns and identify group deal opportunities.
    Be specific, use exact numbers, and prioritize deals by potential savings.
    Output structured JSON only.`,
    messages: [{
      role: 'user',
      content: `
        Community: ${communityData.name}
        Members: ${communityData.memberCount}
        Location: ${communityData.city}
        
        Last 30 days spending:
        ${JSON.stringify(communityData.spendingSummary)}
        
        Top merchants:
        ${JSON.stringify(communityData.topMerchants)}
        
        Find 3 group deal opportunities. For each:
        1. Which merchant/category
        2. Estimated monthly community spend with them
        3. Recommended discount to negotiate (%)
        4. Minimum orders needed to qualify
        5. Projected annual savings for community
        
        Return as JSON array.
      `
    }]
  });

  return JSON.parse(response.content[0].text);
};
```

**Example Output:**
```json
[
  {
    "merchant": "Swiggy (general)",
    "category": "food_delivery",
    "monthly_spend": 55000,
    "recommended_discount": 12,
    "min_orders_needed": 40,
    "current_orders": 220,
    "projected_annual_savings": 79200,
    "message": "Your community orders 220+ times/month on Swiggy. At this volume, you can negotiate a 12% bulk rate — saving ₹6,600/month or ₹79,200/year.",
    "action": "Start Group Deal",
    "urgency": "high"
  },
  {
    "merchant": "Biryani Blues",
    "category": "restaurant",
    "monthly_spend": 18000,
    "recommended_discount": 15,
    "min_orders_needed": 15,
    "current_orders": 72,
    "projected_annual_savings": 32400,
    "message": "72 biryani orders/month from this restaurant. Propose a weekly bulk order slot for 15% off.",
    "action": "Propose Deal",
    "urgency": "medium"
  }
]
```

---

## Scheduled Agent Jobs

| Job | Frequency | What It Does |
|-----|-----------|-------------|
| `analyze_community_spend` | Daily (midnight) | Recalculates spend summaries for all communities |
| `generate_deal_insights` | Weekly (Monday 9AM) | Claude generates fresh deal recommendations |
| `sentiment_scan` | Weekly | Scans new reviews for quality alerts |
| `deal_expiry_check` | Every 6 hours | Marks expired deals, notifies members |
| `group_match` | Real-time on join | When user joins deal, checks if threshold reached |

