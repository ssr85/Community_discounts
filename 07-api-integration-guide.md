# API Integration Guide

## 1. HuggingFace Inference API

### Setup
```bash
npm install @huggingface/inference
```

```javascript
import { HfInference } from '@huggingface/inference';
const hf = new HfInference(process.env.HF_API_KEY);
```

### Free Tier Limits
- Rate limit: ~30,000 requests/month on free tier
- Cold start: ~30s for first request (models load on demand)
- Warm start: ~1-3s per request

### Models Used

#### Intent Classification
```javascript
const result = await hf.zeroShotClassification({
  model: 'bitext/Mistral-7B-Restaurants',
  inputs: 'I want cheap biryani near me',
  parameters: {
    candidate_labels: ['find_restaurant', 'order_food', 'get_deal', 'view_spending']
  }
});
```

#### Sentiment Analysis (Multi-lingual)
```javascript
const result = await hf.textClassification({
  model: 'cardiffnlp/twitter-xlm-roberta-base-sentiment',
  inputs: 'खाना बहुत बेकार था, फिर कभी नहीं आऊंगा' // Hindi review
});
// Returns: [{label: 'negative', score: 0.97}]
```

#### Semantic Embeddings
```javascript
const embeddings = await hf.featureExtraction({
  model: 'sentence-transformers/all-MiniLM-L6-v2',
  inputs: ['cheap vegetarian food pune', 'Honest Kitchen veg thali affordable']
});
// Returns: [[0.23, 0.45, ...], [0.24, 0.44, ...]]
```

---

## 2. Claude (Anthropic) API

### Setup
```bash
npm install @anthropic-ai/sdk
```

```javascript
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
```

### Deal Analysis Call
```javascript
const message = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: `Analyze community spend: ${JSON.stringify(spendData)}. 
              Suggest top 3 group deals as JSON array.`
  }]
});
```

---

## 3. Google Maps Places API

### Setup
```bash
npm install @googlemaps/google-maps-services-js
```

```javascript
import { Client } from '@googlemaps/google-maps-services-js';
const mapsClient = new Client({});

const restaurants = await mapsClient.textSearch({
  params: {
    query: 'restaurants near Koregaon Park Pune',
    key: process.env.GOOGLE_MAPS_API_KEY,
    type: 'restaurant',
    location: { lat: 18.5362, lng: 73.8958 },
    radius: 2000 // 2km
  }
});
```

### Response fields used:
- `place_id` → unique restaurant ID
- `name` → restaurant name
- `rating` → 1-5 star rating
- `price_level` → 1-4 (cheapest to most expensive)
- `geometry.location` → lat/lng
- `types` → ['restaurant', 'food', 'establishment']

---

## 4. Apify Swiggy Scraper

### API Call
```javascript
const apifyClient = new ApifyClient({ token: process.env.APIFY_API_KEY });

const run = await apifyClient.actor('infoweaver/swiggy-restaurant-scraper').call({
  location: 'Koregaon Park, Pune',
  maxItems: 50,
  includeMenuItems: true
});

const dataset = await apifyClient.dataset(run.defaultDatasetId).listItems();
```

### Response format:
```json
{
  "restaurant_id": "swiggy_123",
  "name": "Pizza Hut",
  "cuisine": ["Italian", "Fast Food"],
  "rating": 4.2,
  "delivery_time": "30-40 mins",
  "menu": [
    { "name": "Pepperoni Pizza", "price": 450, "category": "Pizza" }
  ]
}
```

---

## 5. Razorpay Webhooks

### Setup
```javascript
import Razorpay from 'razorpay';
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});
```

### Webhook Receiver
```javascript
app.post('/api/webhooks/razorpay', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const isValid = Razorpay.validateWebhookSignature(
    JSON.stringify(req.body),
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET
  );

  if (!isValid) return res.status(400).json({ error: 'Invalid signature' });

  const event = req.body.event;

  switch (event) {
    case 'payment.captured':
      // Update deal_bookings status → 'paid'
      // Check if deal threshold reached
      // Notify community members if deal activated
      break;
    case 'payment.failed':
      // Update deal_bookings status → 'failed'
      // Notify user to retry
      break;
  }

  res.json({ status: 'ok' });
});
```

---

## 6. Supabase Client

### Setup
```bash
npm install @supabase/supabase-js
```

```javascript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

### Key Queries

```javascript
// Get community spend summary
const { data } = await supabase
  .rpc('get_community_spend_summary', { p_community_id: communityId });

// Insert spending records from CSV
const { error } = await supabase
  .from('spending_records')
  .insert(parsedRecords);

// Real-time deal updates
supabase
  .channel('group_deals')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'group_deals',
    filter: `community_id=eq.${communityId}`
  }, (payload) => {
    // Update UI when deal count changes
    updateDealCard(payload.new);
  })
  .subscribe();
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI
ANTHROPIC_API_KEY=sk-ant-...
HF_API_KEY=hf_...

# Maps & Scraping
GOOGLE_MAPS_API_KEY=AIza...
APIFY_API_KEY=apify_api_...

# Payments
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
```

