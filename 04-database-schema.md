# Database Schema (Supabase / PostgreSQL)

## Tables

### users
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  full_name     TEXT NOT NULL,
  avatar_url    TEXT,
  phone         TEXT,
  pincode       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### communities
```sql
CREATE TABLE communities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,                    -- "Koregaon Park Society A"
  type          TEXT NOT NULL,                    -- 'residential' | 'office' | 'area'
  pincode       TEXT NOT NULL,
  city          TEXT NOT NULL,
  invite_code   TEXT UNIQUE NOT NULL,             -- short code for joining
  admin_id      UUID REFERENCES users(id),
  member_count  INTEGER DEFAULT 0,
  total_spend   NUMERIC DEFAULT 0,                -- aggregate (auto-updated)
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### community_members
```sql
CREATE TABLE community_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id    UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  data_shared     BOOLEAN DEFAULT FALSE,           -- has user shared spending data?
  UNIQUE(community_id, user_id)
);
```

### spending_records
```sql
CREATE TABLE spending_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  community_id    UUID REFERENCES communities(id),
  date            DATE NOT NULL,
  platform        TEXT NOT NULL,                  -- 'Swiggy' | 'Zomato' | 'Blinkit' | 'Manual'
  merchant_name   TEXT NOT NULL,
  amount          NUMERIC NOT NULL,
  category        TEXT NOT NULL,                  -- 'food_delivery' | 'grocery' | 'home_service'
  items           JSONB,                          -- [{name, price, qty}]
  source          TEXT DEFAULT 'csv_upload',      -- 'csv_upload' | 'manual' | 'razorpay'
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### user_preferences
```sql
CREATE TABLE user_preferences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  food_frequency  TEXT,                           -- 'daily' | '3x_week' | 'weekly'
  avg_order_value TEXT,                           -- '150-300' | '300-500' | '500+'
  platforms       TEXT[],                         -- ['Swiggy', 'Zomato']
  fav_cuisines    TEXT[],                         -- ['North Indian', 'Chinese']
  estimated_monthly_spend NUMERIC,               -- AI-inferred
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### restaurants
```sql
CREATE TABLE restaurants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id TEXT UNIQUE,
  name            TEXT NOT NULL,
  category        TEXT,                           -- 'restaurant' | 'grocery' | 'pharmacy'
  cuisine_type    TEXT[],
  address         TEXT,
  pincode         TEXT,
  city            TEXT,
  rating          NUMERIC,
  price_level     INTEGER,                        -- 1-4 (Google Maps scale)
  lat             NUMERIC,
  lng             NUMERIC,
  ondc_seller_id  TEXT,                           -- for future ONDC integration
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### group_deals
```sql
CREATE TABLE group_deals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id    UUID REFERENCES communities(id),
  restaurant_id   UUID REFERENCES restaurants(id),
  title           TEXT NOT NULL,                  -- "15% off at Pizza Hut for 10+ orders"
  description     TEXT,
  discount_pct    NUMERIC NOT NULL,               -- 15.0
  min_orders      INTEGER NOT NULL,               -- minimum orders to activate
  current_orders  INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'pending',         -- 'pending' | 'active' | 'expired' | 'claimed'
  valid_until     TIMESTAMPTZ,
  ai_generated    BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### deal_bookings
```sql
CREATE TABLE deal_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         UUID REFERENCES group_deals(id),
  user_id         UUID REFERENCES users(id),
  amount          NUMERIC,
  razorpay_order_id TEXT,
  status          TEXT DEFAULT 'pending',         -- 'pending' | 'paid' | 'cancelled'
  booked_at       TIMESTAMPTZ DEFAULT NOW()
);
```

### ai_insights
```sql
CREATE TABLE ai_insights (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id    UUID REFERENCES communities(id),
  insight_type    TEXT NOT NULL,                  -- 'spend_summary' | 'deal_opportunity' | 'trend_alert'
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  data            JSONB,                          -- supporting data for the insight
  generated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Row Level Security (RLS) Policies

```sql
-- Users can only see their own data
ALTER TABLE spending_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own records"
  ON spending_records FOR SELECT
  USING (auth.uid() = user_id);

-- Community members can see community-level stats (not individual breakdowns)
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see their communities"
  ON communities FOR SELECT
  USING (
    id IN (
      SELECT community_id FROM community_members
      WHERE user_id = auth.uid()
    )
  );

-- Group deals visible to community members
ALTER TABLE group_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see community deals"
  ON group_deals FOR SELECT
  USING (
    community_id IN (
      SELECT community_id FROM community_members
      WHERE user_id = auth.uid()
    )
  );
```

---

## Key Database Functions

```sql
-- Get community spending summary (anonymized)
CREATE OR REPLACE FUNCTION get_community_spend_summary(p_community_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_spend', SUM(amount),
    'member_count', COUNT(DISTINCT user_id),
    'by_platform', json_object_agg(platform, platform_total),
    'by_category', json_object_agg(category, category_total),
    'avg_per_member', SUM(amount) / NULLIF(COUNT(DISTINCT user_id), 0)
  )
  FROM spending_records
  WHERE community_id = p_community_id
    AND date >= NOW() - INTERVAL '30 days';
$$ LANGUAGE SQL SECURITY DEFINER;

-- Auto-update community total_spend
CREATE OR REPLACE FUNCTION update_community_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE communities
  SET total_spend = (
    SELECT COALESCE(SUM(amount), 0)
    FROM spending_records
    WHERE community_id = NEW.community_id
  )
  WHERE id = NEW.community_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_spending_insert
AFTER INSERT ON spending_records
FOR EACH ROW EXECUTE FUNCTION update_community_total();
```

