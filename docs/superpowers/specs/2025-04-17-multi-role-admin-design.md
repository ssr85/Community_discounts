# Multi-Role Admin & Member Views Design

**Date:** 2025-04-17  
**Status:** Approved

---

## Overview

Design for three user roles with distinct dashboards and login shortcuts:
- **Super Admin**: Views all communities, drills down into community data and members
- **Community Admin**: Views all members of their community, individual + collective spend per platform
- **Member**: Views own spend with timeline selector, gamified badges, invite functionality

---

## 1. Login Screen

**Design:**
- Test users section at top (existing)
- New "Demo Login" section:
  - **Super Admin** button (single, always visible)
  - **Community Login** dropdown:
    - Select community (Skyline, Green Valley, etc.)
    - Two buttons: **As Admin** | **As Member**

---

## 2. Member View (`/dashboard`)

### Features:

**A. Timeline Selector**
- Dropdown to select time range for cumulative spend
- Options: Last 7 days, Last 30 days, Last 90 days, All Time
- Shows cumulative spend amount for selected period

**B. Own Spend Display**
- Personal spending breakdown by platform (Swiggy, Zomato, etc.)
- Category distribution (food_delivery, groceries, etc.)
- Individual transaction list

**C. Gamified Badge (Top of Dashboard)**
- Shows: "🎉 X members from [Community Name] joined"
- Shows: "💰 ₹X total community savings unlocked"
- Animated, prominent display to encourage social proof
- Updates in real-time

**D. Invite Functionality**
- "Invite to Community" button
- Shows: "Every neighbor you invite increases collective power"
- Share invite code link
- Shows progress toward next discount threshold

---

## 3. Community Admin View (`/admin/community`)

### Features:

**A. Members List (Main View)**
- Table showing all community members
- Columns: Name, Total Spend (individual), Joined Date, Status

**B. Member Drill-Down (Click on Member)**
- Modal or detail view when clicking a member
- Shows individual expense data for that member
- Shows collective expense of society for each platform:
  - Platform name | Society Total | Member's Contribution %
- Example: "Swiggy: ₹45,000 total (you: 12%)"

**C. Admin Actions**
- Toggle data sharing per member
- Export member data
- View analytics for community

---

## 4. Super Admin View (`/super-admin`)

### Features:

**A. Communities List (Main View)**
- Table showing all communities
- Columns: Name, Type, Members, Total Spend, Admin, Created

**B. Community Drill-Down (Click on Community)**
- Click on community row → expands to show:
  - Community details (name, type, city)
  - Member count
  - Total spend
  - Active deals
  - List of all members in that community
- Click on member → shows individual expense data

**C. System Overview Stats**
- Total communities
- Total users
- Active deals across all communities
- New users (last 7 days)

---

## 5. Database Changes

```sql
-- Add is_admin flag to community_members
ALTER TABLE community_members ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Set existing admins
UPDATE community_members cm
SET is_admin = TRUE
FROM communities c
WHERE cm.community_id = c.id AND cm.user_id = c.admin_id;
```

---

## Acceptance Criteria

1. **Login**: Shows super admin button + community dropdown with admin/member options
2. **Member Dashboard**:
   - Timeline selector (7d, 30d, 90d, All) shows cumulative spend
   - Gamified badge showing member count and savings
   - Invite button to invite others
3. **Community Admin**:
   - Shows all community members in table
   - Click member → sees individual + collective spend per platform
4. **Super Admin**:
   - Shows all communities in table
   - Click community → expands to show members and data
   - Click member → shows individual expense
5. Role-aware navigation in NavBar
6. Unauthorized access redirects appropriately