# Multi-Role Admin & Member Views Design

**Date:** 2025-04-17  
**Status:** Approved

---

## Overview

Design for three user roles with distinct dashboards and login shortcuts:
- **Super Admin**: Can view all communities, all users, create communities
- **Community Admin**: Manage single community (members, deals, settings)
- **Member**: View deals and spending insights for their community

---

## 1. Login Screen Updates

### Current State
- Test users displayed in grid grouped by community
- No role differentiation

### New Design
- Test users section remains at top
- New "Demo Login" section with two areas:

**Super Admin Section:**
- Single button "Enter as Super Admin"
- Logs in with super-admin email (hardcoded test user)

**Community Login Section:**
- Dropdown: Select community (Skyline, Green Valley, etc.)
- When community selected, show two buttons:
  - "As Admin" - Login as community admin
  - "As Member" - Login as regular member

**Implementation Notes:**
- Add super_admin flag to users table or use environment variable for super admin emails
- Community dropdown populated from communities table

---

## 2. Member View

### Routes
- `/dashboard` - Existing deals and insights
- `/deals` - Existing deal listing/joining
- `/community` - Existing community info

### Behavior
No changes to existing member-facing pages.

---

## 3. Community Admin View

### Route
- `/admin/community` - New page

### Tabs

**Tab 1: Overview**
- Community name, type, city
- Member count
- Total community spend
- Active deals count

**Tab 2: Members**
- Table: name, email, joined date, data_shared toggle
- Actions: Remove member, toggle data sharing

**Tab 3: Deals**
- List of all deals for community
- Create new deal (manual)
- Edit/delete deals

**Tab 4: Analytics**
- Spending breakdown by merchant
- Category distribution
- Month-over-month trends

**Tab 5: Settings**
- Edit community name, type, city
- Regenerate invite code
- Delete community (with confirmation)

### Sidebar/Navigation
- Replace or extend existing NavBar with role-aware navigation
- Show admin link when user is community admin

---

## 4. Super Admin View

### Route
- `/super-admin` - New page

### Single Page Sections

**Section 1: Communities**
- Table: Name, Type, Members, Total Spend, Admin Name, Created
- Actions: View details, Delete

**Section 2: Users**
- Table: Email, Full Name, Communities count, Joined date
- Actions: View user communities

**Section 3: Create Community**
- Form: Name, Type, City, Pincode
- Admin email assignment

**Section 4: System Health**
- Total communities
- Total users
- Total active deals
- Recently joined users (count, last 7 days)

---

## 5. Navigation

### Updated NavBar
- Show role-specific links:
  - Member: Dashboard, Community, Deals
  - Community Admin: Dashboard, Community, Deals, **Admin** (new)
  - Super Admin: **Super Admin** (new, replaces others)

### Implementation
- Check user role on each page load
- Redirect if unauthorized

---

## Database Changes

```sql
-- Add role field to users (optional - can determine from admin_id instead)
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'super_admin'));

-- Or super_admin is determined by email pattern
-- super_admin@test.com emails get super admin access

-- Add is_admin to community_members
ALTER TABLE community_members ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
```

---

## Acceptance Criteria

1. Login page shows super admin button + community dropdown with admin/member options
2. Member can view their community's deals and stats
3. Community admin can manage members, deals, and settings
4. Super admin can see all communities and users
5. Navigation updates based on user role
6. Unauthorized access redirects to appropriate page