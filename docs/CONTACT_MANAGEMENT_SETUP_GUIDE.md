# Contact Management - Database Setup Guide

**Date**: 2025-11-18
**Status**: API Routes Added ✅

---

## ⚠️ What You're Seeing

You clicked on "名单管理" and got: **"加载失败 Failed to fetch contacts"**

This is **expected and normal** because:
1. ✅ API routes are now registered in the Koa server
2. ❌ Database schema hasn't been created in Supabase yet
3. ❌ No contacts table exists to query

---

## ✅ What I Just Fixed

I added all 10 API routes to `server/server.js`:

```javascript
// Contacts (4 endpoints)
router.get('/api/contacts', contactController.getContacts)
router.post('/api/contacts', contactController.createContact)
router.put('/api/contacts/:id', contactController.updateContact)
router.delete('/api/contacts/:id', contactController.deleteContact)

// Contact Stages (3 endpoints)
router.get('/api/contact-stages', contactController.getContactStages)
router.post('/api/contact-stages', contactController.createContactStage)
router.delete('/api/contact-stages/:id', contactController.deleteContactStage)

// Traffic Channels (3 endpoints)
router.get('/api/traffic-channels', contactController.getTrafficChannels)
router.post('/api/traffic-channels', contactController.createTrafficChannel)
router.delete('/api/traffic-channels/:id', contactController.deleteTrafficChannel)
```

---

## 🚀 Next Steps: Database Setup

### Step 1: Get Your Supabase SQL File

The complete migration is at:
```
/Users/jackytok/Desktop/InsideCloud/docs/contact-management-schema.sql
```

### Step 2: Run Migration in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy and paste the entire contents of `contact-management-schema.sql`
6. Click **Run** button

### Step 3: Verify Tables Created

After running the migration, you should see 6 new tables in Supabase:
- ✅ `contact_stages` - Custom opportunity stages
- ✅ `traffic_channels` - Traffic source channels
- ✅ `contacts` - Main contact table
- ✅ `contact_stage_history` - Pipeline velocity tracking
- ✅ `integration_credentials` - Third-party OAuth (Phase 2)
- ✅ `integration_sync_logs` - Sync history logs (Phase 2)

### Step 4: Create Seed Data

Run these SQL statements to create default stages and channels:

```sql
-- Get your current organization ID (replace with your actual org_id)
-- First, find your org_id from the organizations table
SELECT id FROM organizations WHERE organization_slug = 'your-slug-here';

-- Then run these (replace org_id with the actual ID):
INSERT INTO contact_stages (organization_id, name, color, order_index)
VALUES
  ('{org_id}', 'Lead', '#2196F3', 0),
  ('{org_id}', 'Prospect', '#9C27B0', 1),
  ('{org_id}', 'Appointment', '#00BCD4', 2),
  ('{org_id}', 'Nurture', '#FFC107', 3),
  ('{org_id}', 'Won', '#4CAF50', 4),
  ('{org_id}', 'Lost', '#F44336', 5),
  ('{org_id}', 'Cold', '#9E9E9E', 6);

INSERT INTO traffic_channels (organization_id, name, is_enabled)
VALUES
  ('{org_id}', 'LinkedIn', true),
  ('{org_id}', 'Referral', true),
  ('{org_id}', 'Online Ads', true),
  ('{org_id}', 'Cold Call', true),
  ('{org_id}', 'Events', true),
  ('{org_id}', 'Email Marketing', true),
  ('{org_id}', 'Website', true);
```

---

## 🧪 Testing After Setup

### Test 1: Verify Empty State
1. Stop your server: `Ctrl+C`
2. Start again: `npm run start`
3. Click "名单管理" card
4. You should see **empty state** (no error):
   - "没有联系人" (No contacts)
   - "开始添加您的第一个联系人" (Start by adding your first contact)

### Test 2: Create First Contact
1. Click the **[+ Add Contact]** button (FAB)
2. Fill in the form:
   - Contact Type: Customer
   - First Name: Alex
   - Last Name: Tan
   - Phone 1: +60 12 3456789
   - Entity Type: Individual
   - Traffic Source: LinkedIn
   - Stage: Lead
3. Click **Save**
4. New contact should appear in the list

### Test 3: View Contact Details
1. Click on the contact card
2. A sidebar should slide in showing all details
3. Click **Edit** to modify
4. Click **Delete** to remove

### Test 4: Test Other Views
1. **Dashboard Tab**: View metrics
2. **Kanban Tab**: See contacts by stage
3. **Settings Tab**: Create new stages/channels

---

## 🔧 Troubleshooting

### Error: "Table does not exist"
**Cause**: Migration hasn't been run
**Fix**: Go to Supabase SQL Editor and run the migration SQL

### Error: "Organization not found"
**Cause**: organizationSlug isn't valid
**Fix**: Make sure your organization exists in Supabase and use correct slug

### Error: "Permission denied" (RLS)
**Cause**: Row Level Security policies blocking access
**Fix**: Verify you're logged in with a valid Lark user that's in the organization_members table

### Contacts list shows but can't create
**Cause**: Missing user context
**Fix**: Ensure Lark authentication is working (check session)

---

## 📋 Quick Reference

### API Endpoints (Now Active)

#### Contacts
```
GET    /api/contacts?organization_slug=test-org
POST   /api/contacts (body: contactData + organization_slug)
PUT    /api/contacts/:id (body: contactData + organization_slug)
DELETE /api/contacts/:id?organization_slug=test-org
```

#### Stages
```
GET    /api/contact-stages?organization_slug=test-org
POST   /api/contact-stages (body: stageData + organization_slug)
DELETE /api/contact-stages/:id?organization_slug=test-org
```

#### Channels
```
GET    /api/traffic-channels?organization_slug=test-org
POST   /api/traffic-channels (body: channelData + organization_slug)
DELETE /api/traffic-channels/:id?organization_slug=test-org
```

### Database Connection

The API automatically:
- ✅ Validates organization_slug
- ✅ Applies organization isolation (RLS)
- ✅ Tracks audit fields (created_by, updated_by)
- ✅ Handles soft deletes

---

## ✨ You're Almost There!

Once you:
1. ✅ Run the database migration
2. ✅ Create seed data (stages & channels)
3. ✅ Restart the app

The Contact Management tool will be **fully functional**! 🚀

---

## 📞 Common Questions

**Q: Can I use the tool without Supabase?**
A: No, it requires Supabase PostgreSQL database. That's by design for enterprise data isolation.

**Q: How do I backup my contacts?**
A: Use the Import/Export feature (Phase 2) or export directly from Supabase SQL Editor.

**Q: Can I use it without Lark?**
A: The tool expects authenticated Lark users. For local testing, use external OAuth mode.

**Q: How many contacts can I store?**
A: No hard limit. Supabase free tier: up to 500MB, paid tiers unlimited.

---

## 🎯 Next Phase

After this setup is complete:
- ✅ Phase 2: Avatar upload
- ✅ Phase 2: Drag-and-drop Kanban
- ✅ Phase 2: Real-time collaboration
- ✅ Phase 2: Import/Export
- ✅ Phase 2: Third-party integrations

**Status**: Foundation ready, awaiting Supabase setup!
