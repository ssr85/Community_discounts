# Database Schema

This document details the current database schema for the Community Discounts project, based on the [schema.sql](file:///Users/ssrrattan/Documents/Community_Discounts/supabase/schema.sql) file.

## Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ community_members : "is member of"
    users ||--o{ spending_records : "records"
    users ||--o{ deal_bookings : "books"
    communities ||--o{ community_members : "has members"
    communities ||--o{ spending_records : "has records"
    communities ||--o{ group_deals : "offers"
    communities ||--o{ ai_insights : "has"
    group_deals ||--o{ deal_bookings : "has bookings"

    users {
        uuid id PK
        text email UK "linked to auth.users"
        text full_name
        text avatar_url
        text pincode
        timestamptz created_at
    }

    communities {
        uuid id PK
        text name
        text type "residential | office | area"
        text pincode
        text city
        text invite_code UK
        uuid admin_id FK "ref users.id"
        int member_count
        numeric total_spend
        timestamptz created_at
    }

    community_members {
        uuid id PK
        uuid community_id FK
        uuid user_id FK
        timestamptz joined_at
        boolean data_shared
    }

    spending_records {
        uuid id PK
        uuid user_id FK
        uuid community_id FK
        date date
        text platform
        text merchant_name
        numeric amount
        text category
        jsonb items
        text source
        timestamptz created_at
    }

    group_deals {
        uuid id PK
        uuid community_id FK
        text merchant_name
        text title
        text description
        numeric discount_pct
        int min_orders
        int current_orders
        text status "pending | active | expired | claimed"
        timestamptz valid_until
        boolean ai_generated
        timestamptz created_at
    }

    deal_bookings {
        uuid id PK
        uuid deal_id FK
        uuid user_id FK
        text status "joined"
        timestamptz booked_at
    }

    ai_insights {
        uuid id PK
        uuid community_id FK
        text insight_type
        text title
        text body
        jsonb data
        timestamptz generated_at
    }
```

## Tables

### `users`
Extends Supabase `auth.users` with profile information.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `FK (auth.users)` | Links to Supabase Auth |
| `email` | `TEXT` | `UNIQUE`, `NOT NULL` | |
| `full_name` | `TEXT` | | |
| `avatar_url` | `TEXT` | | |
| `pincode` | `TEXT` | | |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |

### `communities`
Groups of users (societies, office parks, etc.).
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `DEFAULT gen_random_uuid()` | |
| `name` | `TEXT` | `NOT NULL` | |
| `type` | `TEXT` | `NOT NULL`, `DEFAULT 'residential'` | |
| `pincode` | `TEXT` | | |
| `city` | `TEXT` | | |
| `invite_code` | `TEXT` | `UNIQUE`, `NOT NULL` | Short code for joining |
| `admin_id` | `UUID` | `FK (users.id)` | |
| `member_count` | `INTEGER` | `DEFAULT 0` | Auto-updated via trigger |
| `total_spend` | `NUMERIC` | `DEFAULT 0` | |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |

### `community_members`
Join table for users and communities.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK` | |
| `community_id` | `UUID` | `FK (communities.id)`, `CASCADE` | |
| `user_id` | `UUID` | `FK (users.id)`, `CASCADE` | |
| `joined_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |
| `data_shared` | `BOOLEAN` | `DEFAULT FALSE` | Has user shared data? |

### `spending_records`
Granular spending data for individual users.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK` | |
| `user_id` | `UUID` | `FK (users.id)`, `CASCADE` | |
| `community_id` | `UUID` | `FK (communities.id)` | |
| `date` | `DATE` | `NOT NULL` | |
| `platform` | `TEXT` | `NOT NULL` | Swiggy, Zomato, etc. |
| `merchant_name` | `TEXT` | `NOT NULL` | |
| `amount` | `NUMERIC` | `NOT NULL` | |
| `category` | `TEXT` | `NOT NULL`, `DEFAULT 'food_delivery'` | |
| `items` | `JSONB` | | Detailed order items |
| `source` | `TEXT` | `DEFAULT 'csv_upload'` | |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |

### `group_deals`
Aggregated negotiation opportunities.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK` | |
| `community_id` | `UUID` | `FK (communities.id)` | |
| `merchant_name` | `TEXT` | `NOT NULL` | |
| `title` | `TEXT` | `NOT NULL` | |
| `description` | `TEXT` | | |
| `discount_pct` | `NUMERIC` | `NOT NULL` | |
| `min_orders` | `INTEGER` | `NOT NULL` | Target to activate |
| `current_orders` | `INTEGER` | `DEFAULT 0` | Auto-updated via trigger |
| `status` | `TEXT` | `DEFAULT 'pending'` | pending \| active \| etc. |
| `valid_until` | `TIMESTAMPTZ` | | |
| `ai_generated` | `BOOLEAN` | `DEFAULT TRUE` | |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |

### `deal_bookings`
User commitment to specific deals.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK` | |
| `deal_id` | `UUID` | `FK (group_deals.id)` | |
| `user_id` | `UUID` | `FK (users.id)` | |
| `status` | `TEXT` | `DEFAULT 'joined'` | |
| `booked_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |

### `ai_insights`
Summaries and trends generated for communities.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK` | |
| `community_id` | `UUID` | `FK (communities.id)` | |
| `insight_type` | `TEXT` | `NOT NULL` | |
| `title` | `TEXT` | `NOT NULL` | |
| `body` | `TEXT` | `NOT NULL` | |
| `data` | `JSONB` | | |
| `generated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |

## Automation (Triggers & Functions)

1.  **`handle_new_user()`**: Automatically copies new Auth users into the `public.users` table.
2.  **`update_member_count()`**: Syncs the `member_count` on the `communities` table whenever rows are added/removed from `community_members`.
3.  **`update_deal_orders()`**: Updates `current_orders` and sets status to `active` when a deal hits its `min_orders` threshold via `deal_bookings`.

## Security (RLS)

-   **`users`**: Users can only view/update their own profile.
-   **`communities`**: Members can only see metadata for communities they belong to.
-   **`spending_records`**: Users have exclusive access to their own data.
-   **`group_deals` & `ai_insights`**: Visibility is restricted to community members.
-   **`deal_bookings`**: Users manage only their own bookings.
