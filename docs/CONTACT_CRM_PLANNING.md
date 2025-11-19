# 名单管理 (Contact List Management) Planning Document

**Product**: 名单管理 (Contact List Management) for InsideCloud
**Version**: 1.1
**Last Updated**: 2025-11-18
**Status**: Implementation Phase - MVP UI & Frontend Complete

---

## ✅ Implementation Progress (2025-11-18)

### Phase 1: MVP - Frontend & Database Complete ✅

#### Completed Components:
- ✅ **UI Mockups**: Mobile-first design document created (`MINGDAN_UI_MOCKUPS.md`)
- ✅ **Project Structure**: `/src/tools/contact-management/` directory setup
- ✅ **Database Schema**: Complete PostgreSQL migration file with all Phase 1 tables
- ✅ **Frontend Components** (10 major components):
  - Main App orchestrator with tab navigation
  - Contact List View (list/grid toggle, search, filters)
  - Contact Detail Sidebar (readonly view with edit/delete)
  - Contact Form (multi-step form: basic info, company, address)
  - Dashboard View (4 metric cards: pipeline, sales rep, traffic, activity)
  - Kanban Board View (drag-and-drop pipeline visualization)
  - Settings View (manage custom stages and traffic channels)
  - Search Bar component
  - Filter Panel component
  - Avatar utilities (initials generation, color coding)

- ✅ **Custom Hooks** (4 data management hooks):
  - `useContacts`: CRUD operations for contacts
  - `useStages`: CRUD operations for custom stages
  - `useChannels`: CRUD operations for traffic channels
  - `useRealtimeSync`: Supabase real-time synchronization setup

- ✅ **API Client**: Full API client methods for contacts, stages, channels
- ✅ **Styling**: Complete CSS for all components (mobile-responsive, Tailwind-compatible)
- ✅ **Backend Controller**: Contact management API controller with all endpoints

#### Implementation Files Created:
```
Frontend:
src/tools/contact-management/
├── index.jsx (Main orchestrator)
├── index.css (App styles)
├── api.js (API client)
├── components/
│   ├── ContactListView.jsx/.css
│   ├── ContactDetailSidebar.jsx/.css
│   ├── ContactForm.jsx/.css
│   ├── DashboardView.jsx/.css
│   ├── KanbanView.jsx/.css
│   ├── SettingsView.jsx/.css
│   ├── SearchBar.jsx/.css
│   └── FilterPanel.jsx/.css
├── hooks/
│   ├── useContacts.js
│   ├── useStages.js
│   ├── useChannels.js
│   └── useRealtimeSync.js
└── utils/
    └── avatarUtils.js

Backend:
server/
├── contact_management_controller.js (API endpoints)

Database:
docs/
├── contact-management-schema.sql (Complete migration)
└── MINGDAN_UI_MOCKUPS.md (UI specifications)
```

#### Ready for Next Phase:
- Next step: Integrate with Lark authentication
- Test API endpoints with frontend
- Setup database migrations in Supabase
- Create Vercel serverless function wrappers

---

## 🔄 Recent Changes (v1.1)

### Major Updates from v1.0:

1. **Product Renamed**: "Contact CRM" → "名单管理 (Contact List Management)"

2. **Contact Fields Overhaul**:
   - Split Name into First Name* and Last Name*
   - Added Gender (optional)
   - Phone → Phone 1* (required) and Phone 2 (optional)
   - Email now optional
   - Company → Company Name, Position removed
   - Added Entity Type* (Company/Individual)
   - Added Contact Person Name and Contact Person Phone (for companies)
   - Added full address fields: Address Line 1, Address Line 2, Postal Code, City, State

3. **New Contact Type**: Added **COI (Center of Influence)** - contacts who refer business but may not be customers

4. **Department Assignment**: Contacts can be assigned to Sales, Customer Service, or custom departments

5. **Referral System**: Added "Referred By" field (select from existing contacts) to track referral chains

6. **Customizable Opportunity Stages**:
   - Moved from Phase 2 to Phase 1
   - Organizations can create custom stages, reorder, set colors
   - Added `contact_stages` table
   - Added `contact_stage_history` table for tracking stage transitions

7. **Customizable Traffic Channels**:
   - Organizations can add custom traffic channels
   - Added `traffic_channels` table
   - Default channels provided as seed data

8. **Enhanced Pipeline Velocity Metrics**:
   - Track leap time between EACH stage transition (not just Lead → Won)
   - Dashboard shows: Lead → Prospect, Prospect → Appointment, Appointment → Nurture, Nurture → Won/Lost/Cold

9. **Avatar & Photo Upload**:
   - Upload contact photos to Supabase Storage
   - Default initials-based avatars (e.g., "AT" for Alex Tan)
   - Random background colors for default avatars
   - Avatar displayed in all contact cards and lists

10. **RBAC Moved to Phase 2**:
    - Basic admin checks remain in Phase 1
    - Full role-based permissions moved to Phase 2 enhancements

11. **Lark Messenger Integration** (Phase 2):
    - Follow-up reminders will integrate with Lark Messenger in future
    - Basic reminder system in Phase 1

12. **Third-Party Software Integrations** (Phase 2):
    - **Cloud Software Auto-Sync**:
      - Bukku Accounting Software (OAuth, real-time webhooks)
      - Xero Accounting Software (API integration, two-way sync)
      - Go High Level CRM (pipelines, tags, conversation history)
    - **Non-Cloud Software File Imports**:
      - Autocount Accounting Software (CSV/Excel import)
      - SQL Accounting Software (CSV/Excel import with parsers)
    - **Pre-Built CSV Templates**:
      - Industry-specific templates (Real Estate, Insurance, Professional Services, Retail, Manufacturing)
      - Template library with validation and auto-mapping
    - **Database Support**:
      - Added sync tracking fields: `bukku_customer_id`, `xero_contact_id`, `ghl_contact_id`
      - Added `sync_source` field to track contact origin
      - Indexes for external IDs

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Feature Requirements](#2-feature-requirements)
3. [Database Schema Design](#3-database-schema-design)
4. [Backend API Architecture](#4-backend-api-architecture)
5. [Frontend Component Structure](#5-frontend-component-structure)
6. [Lark Integration Strategy](#6-lark-integration-strategy)
7. [UI/UX Design Guidelines](#7-uiux-design-guidelines)
8. [Import/Export Specifications](#8-importexport-specifications)
9. [Dashboard & Analytics](#9-dashboard--analytics)
10. [Implementation Timeline](#10-implementation-timeline)
11. [Security & Compliance](#11-security--compliance)

---

## 1. Executive Summary

### 1.1 Product Vision

A comprehensive, multi-tenant Contact List Management system (名单管理) that enables organizations to:
- Manage business contacts (customers, suppliers, internal team members, centers of influence)
- Track referral networks and relationships between contacts
- Assign contacts to departments (Sales, Customer Service) and team members
- Track sales pipeline and opportunities with visual Kanban board
- Monitor traffic sources and conversion metrics with customizable channels
- Customize opportunity stages per organization
- Log activities and manage follow-ups (future: Lark Messenger integration)
- Generate insights through analytics dashboards

### 1.2 Target Users

- **Sales Teams**: Track leads, manage pipeline, close deals
- **Account Managers**: Nurture customer relationships, schedule follow-ups
- **Business Owners**: Monitor sales performance, ROI by channel
- **Administrators**: Manage team access, configure custom fields

### 1.3 Key Success Metrics

- **Adoption Rate**: 80%+ of organization members using 名单管理 within 3 months
- **Data Quality**: 90%+ contacts with complete required fields
- **Pipeline Velocity**: Track leap time between each funnel stage:
  - Lead → Prospect (average days)
  - Prospect → Appointment (average days)
  - Appointment → Nurture (average days)
  - Nurture → Won/Lost/Cold (average days)
- **Conversion Rate**: Measure stage-to-stage conversion percentages
- **Referral Network Growth**: Track referrals generated by COI contacts
- **User Satisfaction**: NPS score > 50

### 1.4 Integration with Existing Platform

名单管理 (Contact List Management) will be the **third major tool** in InsideCloud, following:
1. Strategic Map (goal planning)
2. Document Parser (accounting exports)
3. **名单管理 (Contact List Management)** ← NEW

It will leverage the existing multi-tenant architecture, authentication system, and UI component library.

---

## 2. Feature Requirements

### 2.1 Phase 1 - MVP (Essential Features)

#### 2.1.1 Contact Management

**Core CRUD Operations**:
- ✅ Create, Read, Update, Delete contacts
- ✅ Contact types: Customer, Supplier, Internal (synced from Lark), COI (Center of Influence)
- ✅ Contact fields:
  - **Personal**: First Name*, Last Name*, Gender (optional)
  - **Contact Info**: Email (optional), Phone 1*, Phone 2 (optional)
  - **Business**: Company Name, Industry, Entity Type (Company/Individual)
  - **Company Contact**: Contact Person Name, Contact Person Phone (for company entities)
  - **Address**: Address Line 1, Address Line 2, Postal Code, City, State
  - **Source**: Traffic Channel (customizable per organization)
  - **Status**: Customizable opportunity stages per organization (default: Lead, Prospect, Nurture, Appointment, Won, Lost, Cold)
  - **Assignment**: Assigned Department (Sales, Customer Service, etc.), Assigned Person (from organization members)
  - **Referral**: Referred By (select from existing contacts)
  - **Avatar**: Photo upload or initials-based default avatar
  - **Notes**: Rich text notes field
  - **Timestamps**: Created At, Updated At, Last Contact Date

**Contact Types**:
```
- Customer: External customer or potential customer
- Supplier: Vendor or service provider
- COI: Center of Influence - contacts who refer business to you but may not be customers themselves
- Internal: Team member synced from Lark (read-only from sync)
```

**Traffic Channels** (customizable per organization, default options):
```
- Direct (website)
- Organic Search (SEO)
- Paid Search (Google Ads)
- Social Media - Facebook
- Social Media - LinkedIn
- Social Media - Instagram
- Email Marketing
- Referral
- Event/Trade Show
- Cold Outreach
- Partner Referral
- Content Marketing
- Webinar
- Other

Note: Organizations can add/edit/remove traffic channels in settings
```

**Department Assignment**:
```
- Sales: Contacts handled by sales team
- Customer Service: Contacts handled by customer service team
- Custom departments can be added per organization
```

#### 2.1.2 Pipeline & Opportunity Management

**Opportunity Stages** (Customizable per Organization):
```
Default Stages:
1. Lead: Initial contact, not yet qualified
2. Prospect: Qualified lead, potential customer
3. Nurture: Engaged, needs more time/information
4. Appointment: Meeting scheduled
5. Won: Deal closed successfully
6. Lost: Deal lost to competitor or rejected
7. Cold: Contact unresponsive, put on hold

Organizations can:
- Add custom stages
- Rename existing stages
- Reorder stages
- Set stage-specific colors
- Archive unused stages
```

**Stage Transition Tracking**:
- ✅ Track leap time between each stage transition:
  - Lead → Prospect (days)
  - Prospect → Appointment (days)
  - Appointment → Nurture (days)
  - Nurture → Won/Lost/Cold (days)
- ✅ Automatic timestamp recording on stage change
- ✅ Stage history log for each contact
- ✅ Analytics dashboard showing average time per stage

**Kanban Board**:
- ✅ Drag-and-drop interface to move contacts between customizable stages
- ✅ Visual cards showing contact name, company, value estimate, avatar
- ✅ Column totals (count + estimated value)
- ✅ Color coding by contact type
- ✅ Quick actions on cards (view details, add note, schedule follow-up)
- ✅ Dynamic columns based on organization's custom stages

**Opportunities** (Custom Deals):
- ✅ Create custom opportunities linked to contacts
- ✅ Fields: Deal Name, Estimated Value, Expected Close Date, Stage
- ✅ Multiple opportunities per contact
- ✅ Won/Lost reason tracking
- ✅ Track referrals: Link opportunity to COI contact who referred it

#### 2.1.3 Tagging System

- ✅ Create custom tags per organization
- ✅ Tag colors for visual organization
- ✅ Multiple tags per contact
- ✅ Filter by tags
- ✅ Tag suggestions based on contact data

**Tag Categories** (recommended):
- Industry tags (e.g., Healthcare, Finance, Tech)
- Priority tags (Hot Lead, VIP, Follow Up Needed)
- Event tags (Attended Webinar 2024, Trade Show Lead)
- Status tags (Existing Customer, Churned, Re-engagement)

#### 2.1.4 Follow-Up & Reminders

**Phase 1 (MVP)**:
- ✅ Schedule follow-up reminders with date + time
- ✅ Reminder types: Call, Email, Meeting, Task
- ✅ Basic notification system (browser notifications + in-app)
- ✅ Overdue reminder highlighting
- ✅ Snooze functionality
- ✅ Bulk follow-up scheduling

**Phase 2 (Future Enhancement)**:
- 🔄 Integration with Lark Messenger:
  - Send reminder notifications via Lark Messenger
  - Create Lark To-Do items from reminders
  - Sync Lark calendar events with reminders
  - Two-way sync: Update reminder status from Lark

#### 2.1.5 Activity Logging

**Activity Types**:
- ✅ Meeting notes (date, attendees, summary, action items)
- ✅ Call logs (date, duration, outcome)
- ✅ Email summaries (manual entry for now, link to email)
- ✅ General notes
- ✅ Status change history (automatic)

**Activity Timeline**:
- ✅ Chronological activity feed per contact
- ✅ Filter by activity type
- ✅ Rich text editor for notes
- ✅ @mention team members
- ✅ Attach links (meeting recordings, documents)

#### 2.1.6 Search & Filtering

**Advanced Filters**:
- ✅ Filter by contact type, stage, assigned person, tags
- ✅ Filter by traffic source
- ✅ Date range filters (created, last contacted)
- ✅ Search by name, email, phone, company
- ✅ Saved filter presets
- ✅ Combine multiple filters (AND/OR logic)

**Search Features**:
- ✅ Global search across all fields
- ✅ Fuzzy matching for typo tolerance
- ✅ Recent searches history
- ✅ Search suggestions

#### 2.1.7 Import/Export

**Import**:
- ✅ CSV import with field mapping
- ✅ Excel import (.xlsx, .xls)
- ✅ Duplicate detection (by email or phone)
- ✅ Merge or skip duplicates option
- ✅ Validation and error reporting
- ✅ Preview before final import
- ✅ Bulk tag assignment on import

**Export**:
- ✅ Export filtered contacts to CSV
- ✅ Export to Excel with formatting
- ✅ Select specific fields to export
- ✅ Export activity history
- ✅ Timestamped export files

#### 2.1.8 Dashboard & Analytics

**Dashboard Widgets** (see Section 9 for details):
1. **Pipeline Metrics**: Total value by stage, conversion rates, **leap time per stage transition**
2. **Sales Rep Performance**: Contacts per rep, follow-up rates
3. **Traffic Source ROI**: Lead sources, cost per acquisition
4. **Activity Tracking**: Upcoming follow-ups, overdue tasks
5. **Referral Network**: COI contacts and their referral contributions

#### 2.1.9 Avatar & Photo Management

- ✅ Upload contact photos (JPEG, PNG, max 5MB)
- ✅ Default avatar generator:
  - Uses contact's initials (e.g., "AT" for Alex Tan)
  - Random solid background color per contact
  - White text for initials
- ✅ Avatar display in all contact cards, lists, and detail views
- ✅ Crop/resize functionality for uploaded photos
- ✅ Storage in Supabase Storage bucket: `contact-avatars`

### 2.2 Phase 2 - Enhancements (Future)

#### 2.2.1 Custom Fields
- ✅ User-defined custom fields (text, number, date, dropdown, checkbox)
- ✅ Field groups (collapsible sections)
- ✅ Conditional field visibility
- ✅ Field validation rules

#### 2.2.2 File Attachments
- ✅ Upload files to contacts (PDFs, images, documents)
- ✅ Meeting recording links storage
- ✅ File preview
- ✅ Version control for documents

#### 2.2.3 Lark Calendar Integration
- ✅ Sync appointments to Lark calendar
- ✅ Create Lark meetings from 名单管理
- ✅ Two-way sync for meeting updates

#### 2.2.4 Email Integration
- ✅ Gmail API integration
- ✅ Outlook/Exchange integration
- ✅ Auto-log emails to contact timeline
- ✅ Send emails from 名单管理
- ✅ Email templates

#### 2.2.5 Advanced Reporting
- ✅ Custom report builder
- ✅ Sales forecasting
- ✅ Trend analysis
- ✅ Export reports to PDF
- ✅ Scheduled report emails

#### 2.2.6 Automation & Workflows
- ✅ Auto-assign contacts based on rules
- ✅ Auto-tagging based on criteria
- ✅ Automated follow-up reminders
- ✅ Stage progression automation
- ✅ Notification workflows

#### 2.2.7 Role-Based Access Control (RBAC)

**Note**: Basic admin checks will be implemented in Phase 1. Full RBAC with granular permissions will be added in Phase 2.

**Roles**:
- **Owner**: Full access, can delete organization
- **Admin**: Full 名单管理 access, can manage members
- **Member**: Can view and edit contacts, cannot manage tags or settings
- **Read-Only**: View-only access

**Permission Matrix**:

| Action | Owner | Admin | Member | Read-Only |
|--------|-------|-------|--------|-----------|
| Create Contact | ✅ | ✅ | ✅ | ❌ |
| Edit Contact | ✅ | ✅ | ✅ (own only) | ❌ |
| Delete Contact | ✅ | ✅ | ❌ | ❌ |
| Manage Tags | ✅ | ✅ | ❌ | ❌ |
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| Import/Export | ✅ | ✅ | ❌ | ❌ |
| Customize Stages/Channels | ✅ | ✅ | ❌ | ❌ |
| Lark Sync | ✅ | ✅ | ❌ | ❌ |

#### 2.2.8 Third-Party Software Integrations

**Cloud Software Integrations** (Auto-Sync):

##### 2.2.8.1 Bukku Accounting Software Integration
- ✅ OAuth 2.0 authentication with Bukku
- ✅ Auto-sync customers and suppliers as contacts
- ✅ Map Bukku customer fields to 名单管理 contact fields
- ✅ Sync frequency: Real-time webhooks or hourly scheduled sync
- ✅ Conflict resolution: Last updated wins
- ✅ Track sync status per contact (`bukku_synced`, `last_bukku_sync_at`)

**Integration Flow**:
```
User enables Bukku integration → OAuth authorization
  ↓
名单管理 fetches customer/supplier list from Bukku API
  ↓
Map Bukku fields to contact fields:
  - Bukku customer name → first_name + last_name
  - Bukku phone → phone_1
  - Bukku email → email
  - Bukku address → address fields
  - Contact type: 'customer' or 'supplier'
  ↓
Create/update contacts in 名单管理
  ↓
Enable webhook for real-time updates
```

##### 2.2.8.2 Xero Accounting Software Integration
- ✅ Xero API OAuth 2.0 integration
- ✅ Sync contacts from Xero's Contact endpoint
- ✅ Two-way sync: Update Xero when contact changes in 名单管理
- ✅ Support for Xero contact groups → tags in 名单管理
- ✅ Sync invoices as opportunities

**API Endpoints**:
- `GET /api/xero/contacts` - List all Xero contacts
- `POST /api/xero/sync` - Trigger manual sync
- `PUT /api/xero/webhook` - Handle Xero webhooks

##### 2.2.8.3 Go High Level CRM Integration
- ✅ GHL API v2 integration
- ✅ Two-way sync for contacts and opportunities
- ✅ Sync GHL pipelines → 名单管理 custom stages
- ✅ Sync GHL tags → 名单管理 tags
- ✅ Import conversation history as activities

**Sync Mapping**:
```
GHL Contact → 名单管理 Contact
- firstName + lastName → first_name, last_name
- email → email
- phone → phone_1
- source → traffic_source_id
- tags → contact_tags
- opportunityStage → current_stage_id
```

**Non-Cloud Software File Imports**:

##### 2.2.8.4 Autocount Accounting Software Import
- ✅ Pre-built parser for Autocount customer/supplier export format
- ✅ Support for Autocount CSV/Excel export files
- ✅ Field mapping UI with Autocount-specific templates
- ✅ Import wizard: Upload → Preview → Map → Import

**Supported Export Files**:
- Customer List Export (CSV)
- Supplier List Export (CSV)
- Sales Document Export (extract customers from invoices)

##### 2.2.8.5 SQL Accounting Software Import
- ✅ Leverage existing Document Parser infrastructure
- ✅ Support for SQL Accounting customer/supplier exports
- ✅ Pre-built field mappings for SQL Accounting structure
- ✅ Batch import with duplicate detection

**Note**: Use the same parser architecture from Document Parser tool:
```
src/tools/mingdan/parsers/
├── accounting/
│   ├── bukku.js           # Bukku API parser
│   ├── xero.js            # Xero API parser
│   ├── autocount.js       # Autocount CSV parser
│   └── sql-accounting.js  # SQL Accounting CSV parser
```

##### 2.2.8.6 Pre-Built CSV Templates
- ✅ Create industry-specific CSV templates:
  - Real Estate template (property details, client info)
  - Insurance template (policy holder info, coverage details)
  - Professional Services template (client, project info)
  - Retail template (customer loyalty, purchase history)
  - Manufacturing template (B2B customer, supplier details)

- ✅ Template library in 名单管理:
  - Download pre-built templates
  - Fill in Excel/Google Sheets
  - Upload and auto-map fields
  - One-click import with validation

**Template Features**:
- Pre-filled example data
- Data validation rules (dropdowns for contact_type, entity_type, etc.)
- Conditional formatting for required fields
- Instructions tab in Excel

---

## 3. Database Schema Design

### 3.1 Core Tables

#### 3.1.1 `contacts` Table

```sql
CREATE TABLE contacts (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-Tenant Context
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Contact Type
  contact_type TEXT NOT NULL CHECK (contact_type IN ('customer', 'supplier', 'coi', 'internal')),

  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', NULL)), -- Optional

  -- Contact Information
  email TEXT, -- Optional
  phone_1 TEXT NOT NULL,
  phone_2 TEXT,

  -- Business Information
  company_name TEXT,
  industry TEXT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('company', 'individual')),

  -- Contact Person (for company entities)
  contact_person_name TEXT,
  contact_person_phone TEXT,

  -- Address Information
  address_line_1 TEXT,
  address_line_2 TEXT,
  postal_code TEXT,
  city TEXT,
  state TEXT,

  -- Source & Assignment
  traffic_source_id UUID REFERENCES traffic_channels(id) ON DELETE SET NULL, -- Customizable per org
  assigned_department TEXT, -- 'sales', 'customer_service', or custom
  assigned_to_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Referral System
  referred_by_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL, -- Self-referencing FK

  -- Pipeline Status (references customizable stages)
  current_stage_id UUID REFERENCES contact_stages(id) ON DELETE SET NULL,

  -- Avatar
  avatar_url TEXT, -- Supabase Storage URL for uploaded photo
  avatar_color TEXT, -- Background color for initials avatar (e.g., '#3B82F6')

  -- Lark Integration
  lark_user_id TEXT, -- For 'internal' contacts synced from Lark
  lark_department_id TEXT,
  is_lark_synced BOOLEAN DEFAULT FALSE,
  last_lark_sync_at TIMESTAMPTZ,

  -- Third-Party Software Integration (Phase 2)
  bukku_customer_id TEXT, -- Bukku customer/supplier ID
  is_bukku_synced BOOLEAN DEFAULT FALSE,
  last_bukku_sync_at TIMESTAMPTZ,

  xero_contact_id TEXT, -- Xero contact ID (UUID)
  is_xero_synced BOOLEAN DEFAULT FALSE,
  last_xero_sync_at TIMESTAMPTZ,

  ghl_contact_id TEXT, -- Go High Level contact ID
  is_ghl_synced BOOLEAN DEFAULT FALSE,
  last_ghl_sync_at TIMESTAMPTZ,

  sync_source TEXT, -- 'manual', 'bukku', 'xero', 'ghl', 'lark', 'import'
  external_id TEXT, -- Generic external system ID

  -- Contact Tracking
  last_contact_date TIMESTAMPTZ,
  last_activity_type TEXT, -- 'call', 'email', 'meeting', 'note'

  -- Notes
  notes TEXT, -- General notes field

  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  updated_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  deleted_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Soft Delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Indexes for Performance
CREATE INDEX idx_contacts_org ON contacts(organization_id, is_deleted);
CREATE INDEX idx_contacts_assigned_to ON contacts(assigned_to_individual_id);
CREATE INDEX idx_contacts_stage ON contacts(organization_id, current_stage_id, is_deleted);
CREATE INDEX idx_contacts_email ON contacts(organization_id, email) WHERE is_deleted = FALSE;
CREATE INDEX idx_contacts_phone ON contacts(organization_id, phone_1) WHERE is_deleted = FALSE;
CREATE INDEX idx_contacts_lark_user ON contacts(lark_user_id) WHERE lark_user_id IS NOT NULL;
CREATE INDEX idx_contacts_traffic_source ON contacts(organization_id, traffic_source_id, is_deleted);
CREATE INDEX idx_contacts_referred_by ON contacts(referred_by_contact_id) WHERE referred_by_contact_id IS NOT NULL;
CREATE INDEX idx_contacts_department ON contacts(organization_id, assigned_department, is_deleted);
CREATE INDEX idx_contacts_name ON contacts(organization_id, first_name, last_name, is_deleted);

-- Third-Party Integration Indexes (Phase 2)
CREATE INDEX idx_contacts_bukku ON contacts(bukku_customer_id) WHERE bukku_customer_id IS NOT NULL;
CREATE INDEX idx_contacts_xero ON contacts(xero_contact_id) WHERE xero_contact_id IS NOT NULL;
CREATE INDEX idx_contacts_ghl ON contacts(ghl_contact_id) WHERE ghl_contact_id IS NOT NULL;
CREATE INDEX idx_contacts_sync_source ON contacts(organization_id, sync_source, is_deleted);

-- Unique Constraint for Active Records (email or phone)
CREATE UNIQUE INDEX contacts_unique_email
  ON contacts(organization_id, email)
  WHERE is_deleted = FALSE AND email IS NOT NULL;

CREATE UNIQUE INDEX contacts_unique_phone
  ON contacts(organization_id, phone_1)
  WHERE is_deleted = FALSE AND phone_1 IS NOT NULL;
```

#### 3.1.2 `tags` Table

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Tag Information
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6', -- Hex color code
  description TEXT,

  -- Category for organization
  category TEXT, -- 'industry', 'priority', 'event', 'status', 'custom'

  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Soft Delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_tags_org ON tags(organization_id, is_deleted);

-- Unique Constraint
CREATE UNIQUE INDEX tags_unique_name
  ON tags(organization_id, name)
  WHERE is_deleted = FALSE;
```

#### 3.1.3 `contact_stages` Table (Customizable Opportunity Stages)

```sql
CREATE TABLE contact_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Stage Information
  name TEXT NOT NULL, -- e.g., 'Lead', 'Prospect', 'Won', etc.
  description TEXT,
  color TEXT NOT NULL DEFAULT '#3B82F6', -- Hex color for Kanban column
  display_order INTEGER NOT NULL DEFAULT 0, -- Order in Kanban board

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE, -- Default stage for new contacts

  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Soft Delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_contact_stages_org ON contact_stages(organization_id, is_deleted, is_active);
CREATE INDEX idx_contact_stages_order ON contact_stages(organization_id, display_order) WHERE is_deleted = FALSE;

-- Unique Constraint
CREATE UNIQUE INDEX contact_stages_unique_name
  ON contact_stages(organization_id, name)
  WHERE is_deleted = FALSE;
```

#### 3.1.4 `traffic_channels` Table (Customizable Traffic Sources)

```sql
CREATE TABLE traffic_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Channel Information
  name TEXT NOT NULL, -- e.g., 'Organic Search', 'Referral', etc.
  description TEXT,
  color TEXT DEFAULT '#6B7280', -- Hex color for visualization

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Soft Delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_traffic_channels_org ON traffic_channels(organization_id, is_deleted, is_active);

-- Unique Constraint
CREATE UNIQUE INDEX traffic_channels_unique_name
  ON traffic_channels(organization_id, name)
  WHERE is_deleted = FALSE;
```

#### 3.1.5 `contact_tags` Table (Many-to-Many)

```sql
CREATE TABLE contact_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Prevent duplicates
  CONSTRAINT contact_tags_unique UNIQUE (contact_id, tag_id)
);

-- Indexes
CREATE INDEX idx_contact_tags_contact ON contact_tags(contact_id);
CREATE INDEX idx_contact_tags_tag ON contact_tags(tag_id);
```

#### 3.1.6 `contact_stage_history` Table (Track Stage Transitions)

```sql
CREATE TABLE contact_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  -- Stage Transition
  from_stage_id UUID REFERENCES contact_stages(id) ON DELETE SET NULL,
  to_stage_id UUID NOT NULL REFERENCES contact_stages(id) ON DELETE SET NULL,

  -- Timing
  transitioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  days_in_previous_stage INTEGER, -- Calculated: days between previous transition and this one

  -- Audit
  transitioned_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL
);

-- Indexes for Analytics
CREATE INDEX idx_stage_history_contact ON contact_stage_history(contact_id, transitioned_at DESC);
CREATE INDEX idx_stage_history_org ON contact_stage_history(organization_id, transitioned_at DESC);
CREATE INDEX idx_stage_history_stages ON contact_stage_history(from_stage_id, to_stage_id);
```

#### 3.1.7 `opportunities` Table

```sql
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  -- Opportunity Details
  name TEXT NOT NULL,
  description TEXT,
  estimated_value DECIMAL(15, 2),
  expected_close_date DATE,

  -- Stage (references customizable stages)
  stage_id UUID NOT NULL REFERENCES contact_stages(id) ON DELETE SET NULL,

  -- Won/Lost Tracking
  actual_close_date DATE,
  won_lost_reason TEXT,

  -- Referral Tracking
  referred_by_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL, -- Track COI referrals

  -- Assignment
  assigned_to_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  updated_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Soft Delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_opportunities_org ON opportunities(organization_id, is_deleted);
CREATE INDEX idx_opportunities_contact ON opportunities(contact_id, is_deleted);
CREATE INDEX idx_opportunities_stage ON opportunities(organization_id, stage_id, is_deleted);
CREATE INDEX idx_opportunities_assigned_to ON opportunities(assigned_to_individual_id);
CREATE INDEX idx_opportunities_referred_by ON opportunities(referred_by_contact_id) WHERE referred_by_contact_id IS NOT NULL;
```

#### 3.1.8 `activities` Table

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  -- Activity Type
  activity_type TEXT NOT NULL CHECK (
    activity_type IN ('call', 'email', 'meeting', 'note', 'status_change')
  ),

  -- Activity Details
  subject TEXT,
  description TEXT, -- Rich text content
  activity_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Meeting/Call Specific
  duration_minutes INTEGER, -- For calls and meetings
  attendees TEXT[], -- Array of names or individual IDs
  meeting_link TEXT, -- Zoom, Teams, Lark Meeting link
  recording_link TEXT, -- Meeting recording URL

  -- Email Specific
  email_subject TEXT,
  email_link TEXT, -- Link to email thread in Gmail/Outlook

  -- Status Change Tracking
  old_value TEXT, -- For status_change type
  new_value TEXT, -- For status_change type

  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Soft Delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_activities_contact ON activities(contact_id, is_deleted);
CREATE INDEX idx_activities_org ON activities(organization_id, is_deleted);
CREATE INDEX idx_activities_date ON activities(contact_id, activity_date DESC);
CREATE INDEX idx_activities_type ON activities(contact_id, activity_type, is_deleted);
```

#### 3.1.9 `follow_up_reminders` Table

```sql
CREATE TABLE follow_up_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  -- Reminder Details
  reminder_type TEXT NOT NULL CHECK (
    reminder_type IN ('call', 'email', 'meeting', 'task')
  ),
  title TEXT NOT NULL,
  description TEXT,
  reminder_date TIMESTAMPTZ NOT NULL,

  -- Assignment
  assigned_to_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Status
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  is_snoozed BOOLEAN NOT NULL DEFAULT FALSE,
  snoozed_until TIMESTAMPTZ,

  -- Notification
  notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
  notification_sent_at TIMESTAMPTZ,

  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  updated_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Soft Delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_reminders_contact ON follow_up_reminders(contact_id, is_deleted);
CREATE INDEX idx_reminders_assigned ON follow_up_reminders(assigned_to_individual_id, is_deleted);
CREATE INDEX idx_reminders_date ON follow_up_reminders(reminder_date) WHERE is_completed = FALSE AND is_deleted = FALSE;
CREATE INDEX idx_reminders_org ON follow_up_reminders(organization_id, is_deleted);
```

### 3.2 Phase 2 Tables

#### 3.2.1 `contact_custom_fields` Table

```sql
CREATE TABLE contact_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  -- Field Definition
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (
    field_type IN ('text', 'number', 'date', 'boolean', 'dropdown', 'multi_select')
  ),

  -- Field Value (stored as JSONB for flexibility)
  field_value JSONB,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicates
  CONSTRAINT contact_custom_fields_unique UNIQUE (contact_id, field_name)
);

CREATE INDEX idx_custom_fields_contact ON contact_custom_fields(contact_id);
CREATE INDEX idx_custom_fields_org ON contact_custom_fields(organization_id);
```

#### 3.2.2 `custom_field_definitions` Table

```sql
CREATE TABLE custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Field Configuration
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (
    field_type IN ('text', 'number', 'date', 'boolean', 'dropdown', 'multi_select')
  ),
  field_options JSONB, -- For dropdown/multi_select: ["Option 1", "Option 2"]

  -- Validation
  is_required BOOLEAN DEFAULT FALSE,
  validation_rules JSONB, -- Min/max, regex, etc.

  -- Display
  display_order INTEGER DEFAULT 0,
  field_group TEXT, -- Group fields together

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_field_defs_org ON custom_field_definitions(organization_id, is_active);
```

#### 3.2.3 `contact_attachments` Table

```sql
CREATE TABLE contact_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  -- File Information
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL, -- Supabase Storage URL
  file_size INTEGER, -- Bytes
  file_type TEXT, -- MIME type

  -- Categorization
  attachment_type TEXT, -- 'contract', 'proposal', 'meeting_recording', 'other'
  description TEXT,

  -- Audit
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Soft Delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_attachments_contact ON contact_attachments(contact_id, is_deleted);
CREATE INDEX idx_attachments_org ON contact_attachments(organization_id, is_deleted);
```

#### 3.2.4 `integration_credentials` Table (Third-Party Integrations)

```sql
CREATE TABLE integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Integration Type
  integration_type TEXT NOT NULL CHECK (
    integration_type IN ('bukku', 'xero', 'ghl', 'lark')
  ),

  -- OAuth Credentials (encrypted)
  access_token TEXT, -- Encrypted access token
  refresh_token TEXT, -- Encrypted refresh token
  token_expires_at TIMESTAMPTZ,

  -- API Configuration
  api_endpoint TEXT, -- Base API URL if custom
  api_version TEXT, -- API version (e.g., 'v2', 'v3')

  -- Sync Configuration
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sync_frequency TEXT DEFAULT 'hourly', -- 'realtime', 'hourly', 'daily', 'manual'
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT, -- 'success', 'failed', 'pending'
  last_sync_error TEXT, -- Error message if sync failed

  -- Mapping Configuration (stored as JSONB)
  field_mappings JSONB, -- Custom field mappings per integration
  sync_filters JSONB, -- Filters for what to sync (e.g., only customers, not suppliers)

  -- Webhook Configuration
  webhook_url TEXT, -- Webhook endpoint for this organization
  webhook_secret TEXT, -- Secret for webhook verification

  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Prevent duplicate integrations per type
  CONSTRAINT integration_credentials_unique UNIQUE (organization_id, integration_type)
);

-- Indexes
CREATE INDEX idx_integration_creds_org ON integration_credentials(organization_id, is_enabled);
CREATE INDEX idx_integration_creds_type ON integration_credentials(organization_id, integration_type);
CREATE INDEX idx_integration_creds_sync ON integration_credentials(last_sync_at) WHERE is_enabled = TRUE;
```

#### 3.2.5 `integration_sync_logs` Table (Sync History)

```sql
CREATE TABLE integration_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_credential_id UUID NOT NULL REFERENCES integration_credentials(id) ON DELETE CASCADE,

  -- Sync Details
  sync_type TEXT NOT NULL, -- 'full_sync', 'incremental', 'webhook_event'
  sync_direction TEXT NOT NULL, -- 'inbound' (from external → 名单管理), 'outbound' (名单管理 → external)

  -- Sync Results
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'partial', 'failed'

  -- Statistics
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,

  -- Error Details
  error_message TEXT,
  error_details JSONB, -- Detailed error information per record

  -- Audit
  triggered_by TEXT, -- 'scheduled', 'manual', 'webhook', 'auto'
  triggered_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL
);

-- Indexes for querying logs
CREATE INDEX idx_sync_logs_org ON integration_sync_logs(organization_id, started_at DESC);
CREATE INDEX idx_sync_logs_cred ON integration_sync_logs(integration_credential_id, started_at DESC);
CREATE INDEX idx_sync_logs_status ON integration_sync_logs(organization_id, status);
```

### 3.3 Database Triggers

#### 3.3.1 Auto-Update `updated_at` Timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ... repeat for other tables
```

#### 3.3.2 Auto-Log Status Changes

```sql
CREATE OR REPLACE FUNCTION log_contact_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_stage IS DISTINCT FROM NEW.current_stage THEN
    INSERT INTO activities (
      organization_id,
      contact_id,
      activity_type,
      subject,
      activity_date,
      old_value,
      new_value,
      created_by_individual_id
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      'status_change',
      'Status changed from ' || OLD.current_stage || ' to ' || NEW.current_stage,
      NOW(),
      OLD.current_stage,
      NEW.current_stage,
      NEW.updated_by_individual_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_contact_status_change_trigger
  AFTER UPDATE ON contacts
  FOR EACH ROW
  WHEN (OLD.current_stage IS DISTINCT FROM NEW.current_stage)
  EXECUTE FUNCTION log_contact_status_change();
```

#### 3.3.3 Update `last_contact_date` on Activity

```sql
CREATE OR REPLACE FUNCTION update_last_contact_date()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contacts
  SET
    last_contact_date = NEW.activity_date,
    last_activity_type = NEW.activity_type
  WHERE id = NEW.contact_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_last_contact_trigger
  AFTER INSERT ON activities
  FOR EACH ROW
  WHEN (NEW.activity_type IN ('call', 'email', 'meeting'))
  EXECUTE FUNCTION update_last_contact_date();
```

### 3.4 Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_reminders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access data from their organizations
CREATE POLICY contacts_org_policy ON contacts
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE individual_id = auth.uid() AND is_deleted = FALSE
    )
  );

CREATE POLICY tags_org_policy ON tags
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE individual_id = auth.uid() AND is_deleted = FALSE
    )
  );

-- Repeat similar policies for all tables...

-- Policy: Service role bypasses RLS (for server-side operations)
-- This is handled by using SUPABASE_SERVICE_ROLE_KEY in backend
```

---

## 4. Backend API Architecture

### 4.1 Controller Structure

Following the existing pattern from `strategic_map_controller.js`, create controllers for each entity:

```
server/
├── controllers/
│   ├── contacts_controller.js
│   ├── opportunities_controller.js
│   ├── activities_controller.js
│   ├── tags_controller.js
│   ├── reminders_controller.js
│   └── lark_sync_controller.js
├── api_handlers/
│   ├── contacts.js
│   ├── opportunities.js
│   ├── activities.js
│   ├── tags.js
│   ├── reminders.js
│   ├── dashboard.js
│   ├── import_contacts.js
│   ├── export_contacts.js
│   └── lark_sync.js
└── server.js (Koa routes)

api/
├── contacts.js (Vercel)
├── opportunities.js
├── activities.js
├── tags.js
├── reminders.js
├── dashboard.js
├── import_contacts.js
├── export_contacts.js
└── lark_sync.js
```

### 4.2 ContactsController Implementation

```javascript
// server/controllers/contacts_controller.js
const { createClient } = require('@supabase/supabase-js');
const { getOrganizationInfo } = require('../organization_helper');

class ContactsController {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get all contacts for organization with optional filtering
   */
  async getContacts(organizationSlug, filters = {}) {
    const org = await getOrganizationInfo(organizationSlug);
    if (!org) {
      throw new Error('Organization not found');
    }

    let query = this.supabase
      .from('contacts')
      .select(`
        *,
        assigned_to:individuals!assigned_to_individual_id(id, name, avatar_url),
        contact_tags(
          tag:tags(id, name, color)
        )
      `)
      .eq('organization_id', org.id)
      .eq('is_deleted', false);

    // Apply filters
    if (filters.contact_type) {
      query = query.eq('contact_type', filters.contact_type);
    }
    if (filters.current_stage) {
      query = query.eq('current_stage', filters.current_stage);
    }
    if (filters.assigned_to_individual_id) {
      query = query.eq('assigned_to_individual_id', filters.assigned_to_individual_id);
    }
    if (filters.traffic_source) {
      query = query.eq('traffic_source', filters.traffic_source);
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
    }

    // Sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data,
      metadata: {
        total: data.length,
        organizationId: org.id
      }
    };
  }

  /**
   * Get single contact by ID
   */
  async getContactById(contactId, organizationSlug) {
    const org = await getOrganizationInfo(organizationSlug);
    if (!org) {
      throw new Error('Organization not found');
    }

    const { data, error } = await this.supabase
      .from('contacts')
      .select(`
        *,
        assigned_to:individuals!assigned_to_individual_id(id, name, email, avatar_url),
        contact_tags(
          tag:tags(id, name, color, category)
        ),
        activities(
          id, activity_type, subject, description, activity_date, duration_minutes,
          created_by:individuals!created_by_individual_id(id, name, avatar_url)
        ),
        opportunities(
          id, name, estimated_value, expected_close_date, stage
        ),
        follow_up_reminders(
          id, reminder_type, title, reminder_date, is_completed, is_snoozed
        )
      `)
      .eq('id', contactId)
      .eq('organization_id', org.id)
      .eq('is_deleted', false)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Contact not found');

    return { success: true, data };
  }

  /**
   * Create new contact
   */
  async createContact(organizationSlug, contactData, individualId) {
    const org = await getOrganizationInfo(organizationSlug);
    if (!org) {
      throw new Error('Organization not found');
    }

    const insertData = {
      organization_id: org.id,
      created_by_individual_id: individualId,
      updated_by_individual_id: individualId,
      ...contactData
    };

    const { data, error } = await this.supabase
      .from('contacts')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // If tags provided, create tag associations
    if (contactData.tag_ids && contactData.tag_ids.length > 0) {
      await this.addTagsToContact(data.id, contactData.tag_ids, individualId);
    }

    return { success: true, data };
  }

  /**
   * Update contact
   */
  async updateContact(contactId, organizationSlug, updates, individualId) {
    const org = await getOrganizationInfo(organizationSlug);
    if (!org) {
      throw new Error('Organization not found');
    }

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by_individual_id: individualId
    };

    // Remove tag_ids from update data (handled separately)
    delete updateData.tag_ids;

    const { data, error } = await this.supabase
      .from('contacts')
      .update(updateData)
      .eq('id', contactId)
      .eq('organization_id', org.id)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) throw error;

    // Update tags if provided
    if (updates.tag_ids !== undefined) {
      await this.updateContactTags(contactId, updates.tag_ids, individualId);
    }

    return { success: true, data };
  }

  /**
   * Soft delete contact
   */
  async deleteContact(contactId, organizationSlug, individualId) {
    const org = await getOrganizationInfo(organizationSlug);
    if (!org) {
      throw new Error('Organization not found');
    }

    const { data, error } = await this.supabase
      .from('contacts')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by_individual_id: individualId
      })
      .eq('id', contactId)
      .eq('organization_id', org.id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  }

  /**
   * Add tags to contact
   */
  async addTagsToContact(contactId, tagIds, individualId) {
    const insertData = tagIds.map(tagId => ({
      contact_id: contactId,
      tag_id: tagId,
      created_by_individual_id: individualId
    }));

    const { error } = await this.supabase
      .from('contact_tags')
      .insert(insertData);

    if (error) throw error;
  }

  /**
   * Update contact tags (replace all)
   */
  async updateContactTags(contactId, tagIds, individualId) {
    // Delete existing tags
    await this.supabase
      .from('contact_tags')
      .delete()
      .eq('contact_id', contactId);

    // Add new tags
    if (tagIds.length > 0) {
      await this.addTagsToContact(contactId, tagIds, individualId);
    }
  }

  /**
   * Get pipeline metrics
   */
  async getPipelineMetrics(organizationSlug) {
    const org = await getOrganizationInfo(organizationSlug);
    if (!org) {
      throw new Error('Organization not found');
    }

    const { data, error } = await this.supabase
      .from('contacts')
      .select('current_stage')
      .eq('organization_id', org.id)
      .eq('is_deleted', false);

    if (error) throw error;

    // Count by stage
    const stageCount = data.reduce((acc, contact) => {
      acc[contact.current_stage] = (acc[contact.current_stage] || 0) + 1;
      return acc;
    }, {});

    // Get opportunities value by stage
    const { data: opps, error: oppsError } = await this.supabase
      .from('opportunities')
      .select('stage, estimated_value')
      .eq('organization_id', org.id)
      .eq('is_deleted', false);

    if (oppsError) throw oppsError;

    const stageValue = opps.reduce((acc, opp) => {
      acc[opp.stage] = (acc[opp.stage] || 0) + (parseFloat(opp.estimated_value) || 0);
      return acc;
    }, {});

    return {
      success: true,
      data: {
        stageCount,
        stageValue,
        totalContacts: data.length,
        totalValue: Object.values(stageValue).reduce((sum, val) => sum + val, 0)
      }
    };
  }
}

module.exports = ContactsController;
```

### 4.3 API Endpoints

#### 4.3.1 Contacts API

```
GET    /api/contacts                         # List all contacts with filters
GET    /api/contacts/:id                     # Get single contact details
POST   /api/contacts                         # Create new contact
PUT    /api/contacts/:id                     # Update contact
DELETE /api/contacts/:id                     # Soft delete contact
GET    /api/contacts/pipeline                # Get pipeline metrics
```

#### 4.3.2 Opportunities API

```
GET    /api/opportunities                    # List opportunities
GET    /api/opportunities/:id                # Get opportunity details
POST   /api/opportunities                    # Create opportunity
PUT    /api/opportunities/:id                # Update opportunity
DELETE /api/opportunities/:id                # Delete opportunity
PUT    /api/opportunities/:id/stage          # Move opportunity to new stage
```

#### 4.3.3 Activities API

```
GET    /api/activities?contact_id=xxx        # Get activities for contact
POST   /api/activities                       # Create activity
PUT    /api/activities/:id                   # Update activity
DELETE /api/activities/:id                   # Delete activity
```

#### 4.3.4 Tags API

```
GET    /api/tags                             # List all tags for organization
POST   /api/tags                             # Create new tag
PUT    /api/tags/:id                         # Update tag
DELETE /api/tags/:id                         # Delete tag
```

#### 4.3.5 Reminders API

```
GET    /api/reminders                        # List reminders (upcoming, overdue)
POST   /api/reminders                        # Create reminder
PUT    /api/reminders/:id                    # Update reminder
PUT    /api/reminders/:id/complete           # Mark reminder as complete
PUT    /api/reminders/:id/snooze             # Snooze reminder
DELETE /api/reminders/:id                    # Delete reminder
```

#### 4.3.6 Dashboard API

```
GET    /api/dashboard/metrics                # Get all dashboard metrics
GET    /api/dashboard/pipeline               # Pipeline-specific metrics
GET    /api/dashboard/sales-rep              # Sales rep performance
GET    /api/dashboard/traffic-source         # Traffic source analytics
GET    /api/dashboard/activities             # Activity tracking metrics
```

#### 4.3.7 Import/Export API

```
POST   /api/contacts/import                  # Import contacts from CSV/Excel
GET    /api/contacts/export                  # Export contacts to CSV
POST   /api/contacts/import/validate         # Validate import file before processing
GET    /api/contacts/export/template         # Download CSV template
```

#### 4.3.8 Contact Stages API (Customizable)

```
GET    /api/contact-stages                   # List all stages for organization
POST   /api/contact-stages                   # Create new custom stage
PUT    /api/contact-stages/:id               # Update stage (name, color, order)
DELETE /api/contact-stages/:id               # Archive stage
PUT    /api/contact-stages/reorder           # Reorder stages
```

#### 4.3.9 Traffic Channels API (Customizable)

```
GET    /api/traffic-channels                 # List all channels for organization
POST   /api/traffic-channels                 # Create new channel
PUT    /api/traffic-channels/:id             # Update channel
DELETE /api/traffic-channels/:id             # Delete channel
```

#### 4.3.10 Lark Sync API

```
POST   /api/lark/sync-contacts               # Sync contacts from Lark
GET    /api/lark/contacts                    # Get Lark contacts list
POST   /api/lark/sync-single/:lark_user_id   # Sync single Lark user
```

### 4.4 API Handler Pattern

```javascript
// api/contacts.js (Vercel serverless)
const { handleCors, okResponse, failResponse } = require('./_utils');
const ContactsController = require('../server/controllers/contacts_controller');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  const controller = new ContactsController(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const method = req.method;
    const { organization_slug } = req.query;

    if (!organization_slug) {
      return res.status(400).json(failResponse('organization_slug is required'));
    }

    if (method === 'GET') {
      const { id, ...filters } = req.query;

      if (id) {
        // Get single contact
        const result = await controller.getContactById(id, organization_slug);
        return res.status(200).json(result);
      } else {
        // List contacts with filters
        const result = await controller.getContacts(organization_slug, filters);
        return res.status(200).json(result);
      }
    }

    if (method === 'POST') {
      const { individual_id, ...contactData } = req.body;
      const result = await controller.createContact(organization_slug, contactData, individual_id);
      return res.status(201).json(result);
    }

    if (method === 'PUT') {
      const { id } = req.query;
      const { individual_id, ...updates } = req.body;

      if (!id) {
        return res.status(400).json(failResponse('Contact ID is required'));
      }

      const result = await controller.updateContact(id, organization_slug, updates, individual_id);
      return res.status(200).json(result);
    }

    if (method === 'DELETE') {
      const { id } = req.query;
      const individualId = req.body.individual_id;

      if (!id) {
        return res.status(400).json(failResponse('Contact ID is required'));
      }

      const result = await controller.deleteContact(id, organization_slug, individualId);
      return res.status(200).json(result);
    }

    return res.status(405).json(failResponse('Method not allowed'));
  } catch (error) {
    console.error('Contacts API error:', error);
    return res.status(500).json(failResponse(error.message || 'Internal server error'));
  }
};
```

---

## 5. Frontend Component Structure

### 5.1 Directory Structure

Following **ADR-001** (tool-based structure):

```
src/tools/mingdan/                       # 名单管理 (Contact List Management)
├── index.jsx                          # Main orchestrator component
├── components/
│   ├── ContactList.jsx                # List view with table/card toggle
│   ├── ContactListItem.jsx            # Single contact card/row with avatar
│   ├── ContactForm.jsx                # Create/edit contact form (new fields)
│   ├── ContactDetail.jsx              # Contact detail sidebar
│   ├── AvatarUpload.jsx               # Photo upload component
│   ├── KanbanBoard.jsx                # Pipeline Kanban view (customizable stages)
│   ├── KanbanColumn.jsx               # Single stage column
│   ├── KanbanCard.jsx                 # Contact card in Kanban with avatar
│   ├── ActivityTimeline.jsx           # Activity feed for contact
│   ├── ActivityForm.jsx               # Add activity form
│   ├── SearchBar.jsx                  # Search and filters
│   ├── FilterPanel.jsx                # Advanced filter panel
│   ├── TagSelector.jsx                # Tag multi-select component
│   ├── TagManager.jsx                 # Create/edit tags
│   ├── StageManager.jsx               # Customize opportunity stages (NEW)
│   ├── ChannelManager.jsx             # Customize traffic channels (NEW)
│   ├── ReferralSelector.jsx           # Select referring contact (NEW)
│   ├── Dashboard.jsx                  # Analytics dashboard
│   ├── PipelineMetrics.jsx            # Pipeline widget with stage transitions
│   ├── SalesRepPerformance.jsx        # Rep performance widget
│   ├── TrafficSourceROI.jsx           # Traffic source widget
│   ├── ActivityTracker.jsx            # Activity tracking widget
│   ├── ReferralNetwork.jsx            # COI referral tracking widget (NEW)
│   ├── ImportExport.jsx               # Import/export UI
│   ├── ReminderList.jsx               # List of reminders
│   ├── ReminderForm.jsx               # Create reminder
│   └── QuickActions.jsx               # Floating action button
├── hooks/
│   ├── useContacts.js                 # Contact CRUD operations
│   ├── useOpportunities.js            # Opportunity management
│   ├── useActivities.js               # Activity logging
│   ├── useTags.js                     # Tag management
│   ├── useStages.js                   # Custom stages CRUD (NEW)
│   ├── useChannels.js                 # Custom channels CRUD (NEW)
│   ├── useReminders.js                # Reminder operations
│   ├── useRealtimeSync.js             # Supabase realtime
│   ├── useDashboard.js                # Dashboard metrics
│   ├── useAvatar.js                   # Avatar upload/generation (NEW)
│   └── useImportExport.js             # Import/export logic
├── utils/
│   ├── constants.js                   # Constants (default stages, channels, colors)
│   ├── validators.js                  # Form validation (updated fields)
│   ├── formatters.js                  # Data formatters
│   └── avatarGenerator.js             # Generate initials avatars (NEW)
└── api.js                             # API client methods
```

### 5.2 Main Orchestrator Component

```javascript
// src/tools/mingdan/index.jsx
import React, { useState, useEffect } from 'react';
import { useContacts } from './hooks/useContacts';
import { useStages } from './hooks/useStages';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import ContactList from './components/ContactList';
import KanbanBoard from './components/KanbanBoard';
import Dashboard from './components/Dashboard';
import SearchBar from './components/SearchBar';
import ContactDetail from './components/ContactDetail';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';

const Mingdan = ({ organizationSlug }) => {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'kanban', 'dashboard'
  const [selectedContact, setSelectedContact] = useState(null);
  const [filters, setFilters] = useState({});

  const {
    contacts,
    isLoading,
    createContact,
    updateContact,
    deleteContact,
    reloadContacts
  } = useContacts(organizationSlug, filters);

  // Load organization-specific custom stages
  const { stages } = useStages(organizationSlug);

  // Realtime sync
  useRealtimeSync(organizationSlug, reloadContacts);

  const handleContactClick = (contact) => {
    setSelectedContact(contact);
  };

  const handleCloseDetail = () => {
    setSelectedContact(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">名单管理</h1>
          <button
            onClick={() => setSelectedContact({ isNew: true })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + New Contact
          </button>
        </div>

        {/* Search Bar */}
        <SearchBar filters={filters} onFilterChange={setFilters} />

        {/* View Tabs */}
        <Tabs value={currentView} onValueChange={setCurrentView} className="mt-4">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="kanban">Pipeline Kanban</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {currentView === 'list' && (
          <ContactList
            contacts={contacts}
            onContactClick={handleContactClick}
            onUpdate={updateContact}
            onDelete={deleteContact}
          />
        )}

        {currentView === 'kanban' && (
          <KanbanBoard
            contacts={contacts}
            onContactClick={handleContactClick}
            onStageChange={(contactId, newStage) => {
              updateContact(contactId, { current_stage: newStage });
            }}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard organizationSlug={organizationSlug} />
        )}
      </div>

      {/* Contact Detail Sidebar */}
      {selectedContact && (
        <ContactDetail
          contact={selectedContact}
          organizationSlug={organizationSlug}
          onClose={handleCloseDetail}
          onCreate={createContact}
          onUpdate={updateContact}
          onDelete={deleteContact}
        />
      )}
    </div>
  );
};

export default ContactCRM;
```

### 5.3 API Client

```javascript
// src/tools/contact-crm/api.js
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || '';

// Contacts
export const loadContacts = async (organizationSlug, filters = {}) => {
  const params = new URLSearchParams({ organization_slug: organizationSlug, ...filters });
  const response = await axios.get(`${API_BASE}/api/contacts?${params}`, {
    withCredentials: true
  });
  return response.data;
};

export const getContact = async (organizationSlug, contactId) => {
  const response = await axios.get(
    `${API_BASE}/api/contacts?organization_slug=${organizationSlug}&id=${contactId}`,
    { withCredentials: true }
  );
  return response.data;
};

export const createContact = async (organizationSlug, contactData, individualId) => {
  const response = await axios.post(
    `${API_BASE}/api/contacts`,
    { organization_slug: organizationSlug, individual_id: individualId, ...contactData },
    { withCredentials: true }
  );
  return response.data;
};

export const updateContact = async (organizationSlug, contactId, updates, individualId) => {
  const response = await axios.put(
    `${API_BASE}/api/contacts?id=${contactId}`,
    { organization_slug: organizationSlug, individual_id: individualId, ...updates },
    { withCredentials: true }
  );
  return response.data;
};

export const deleteContact = async (organizationSlug, contactId, individualId) => {
  const response = await axios.delete(
    `${API_BASE}/api/contacts?id=${contactId}&organization_slug=${organizationSlug}`,
    { data: { individual_id: individualId }, withCredentials: true }
  );
  return response.data;
};

// Tags
export const loadTags = async (organizationSlug) => {
  const response = await axios.get(
    `${API_BASE}/api/tags?organization_slug=${organizationSlug}`,
    { withCredentials: true }
  );
  return response.data;
};

export const createTag = async (organizationSlug, tagData, individualId) => {
  const response = await axios.post(
    `${API_BASE}/api/tags`,
    { organization_slug: organizationSlug, individual_id: individualId, ...tagData },
    { withCredentials: true }
  );
  return response.data;
};

// Activities
export const loadActivities = async (organizationSlug, contactId) => {
  const response = await axios.get(
    `${API_BASE}/api/activities?organization_slug=${organizationSlug}&contact_id=${contactId}`,
    { withCredentials: true }
  );
  return response.data;
};

export const createActivity = async (organizationSlug, activityData, individualId) => {
  const response = await axios.post(
    `${API_BASE}/api/activities`,
    { organization_slug: organizationSlug, individual_id: individualId, ...activityData },
    { withCredentials: true }
  );
  return response.data;
};

// Reminders
export const loadReminders = async (organizationSlug, filters = {}) => {
  const params = new URLSearchParams({ organization_slug: organizationSlug, ...filters });
  const response = await axios.get(`${API_BASE}/api/reminders?${params}`, {
    withCredentials: true
  });
  return response.data;
};

export const createReminder = async (organizationSlug, reminderData, individualId) => {
  const response = await axios.post(
    `${API_BASE}/api/reminders`,
    { organization_slug: organizationSlug, individual_id: individualId, ...reminderData },
    { withCredentials: true }
  );
  return response.data;
};

// Dashboard
export const loadDashboardMetrics = async (organizationSlug) => {
  const response = await axios.get(
    `${API_BASE}/api/dashboard/metrics?organization_slug=${organizationSlug}`,
    { withCredentials: true }
  );
  return response.data;
};

// Import/Export
export const importContacts = async (organizationSlug, file, fieldMapping, individualId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('organization_slug', organizationSlug);
  formData.append('field_mapping', JSON.stringify(fieldMapping));
  formData.append('individual_id', individualId);

  const response = await axios.post(`${API_BASE}/api/contacts/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    withCredentials: true
  });
  return response.data;
};

export const exportContacts = async (organizationSlug, filters = {}) => {
  const params = new URLSearchParams({ organization_slug: organizationSlug, ...filters });
  const response = await axios.get(`${API_BASE}/api/contacts/export?${params}`, {
    responseType: 'blob',
    withCredentials: true
  });
  return response.data;
};
```

### 5.4 Custom Hooks

```javascript
// src/tools/contact-crm/hooks/useContacts.js
import { useState, useEffect, useCallback } from 'react';
import * as ContactAPI from '../api';

export function useContacts(organizationSlug, filters = {}) {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('/api/current_user', { withCredentials: true });
        if (response.data?.code === 0) {
          setCurrentUser(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      }
    };
    fetchUser();
  }, []);

  // Load contacts
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await ContactAPI.loadContacts(organizationSlug, filters);
      if (result.success) {
        setContacts(result.data);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [organizationSlug, JSON.stringify(filters)]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create contact
  const createContact = useCallback(async (contactData) => {
    const tempId = `temp_${Date.now()}`;
    const tempContact = { id: tempId, ...contactData };

    // Optimistic update
    setContacts(prev => [tempContact, ...prev]);

    try {
      const individualId = currentUser?.individual_id || null;
      const result = await ContactAPI.createContact(organizationSlug, contactData, individualId);

      if (result.success) {
        // Replace temp with real
        setContacts(prev => prev.map(c => c.id === tempId ? result.data : c));
      }
    } catch (err) {
      // Rollback
      setContacts(prev => prev.filter(c => c.id !== tempId));
      alert(`Failed to create contact: ${err.message}`);
    }
  }, [organizationSlug, currentUser]);

  // Update contact
  const updateContact = useCallback(async (contactId, updates) => {
    const oldContact = contacts.find(c => c.id === contactId);

    // Optimistic update
    setContacts(prev => prev.map(c =>
      c.id === contactId ? { ...c, ...updates } : c
    ));

    try {
      const individualId = currentUser?.individual_id || null;
      const result = await ContactAPI.updateContact(organizationSlug, contactId, updates, individualId);

      if (result.success) {
        setContacts(prev => prev.map(c => c.id === contactId ? result.data : c));
      }
    } catch (err) {
      // Rollback
      setContacts(prev => prev.map(c => c.id === contactId ? oldContact : c));
      alert(`Failed to update contact: ${err.message}`);
    }
  }, [organizationSlug, contacts, currentUser]);

  // Delete contact
  const deleteContact = useCallback(async (contactId) => {
    const deletedContact = contacts.find(c => c.id === contactId);

    // Optimistic update
    setContacts(prev => prev.filter(c => c.id !== contactId));

    try {
      const individualId = currentUser?.individual_id || null;
      await ContactAPI.deleteContact(organizationSlug, contactId, individualId);
    } catch (err) {
      // Rollback
      setContacts(prev => [...prev, deletedContact]);
      alert(`Failed to delete contact: ${err.message}`);
    }
  }, [organizationSlug, contacts, currentUser]);

  return {
    contacts,
    isLoading,
    error,
    createContact,
    updateContact,
    deleteContact,
    reloadContacts: loadData
  };
}
```

---

## 6. Lark Integration Strategy

### 6.1 Sync Strategy

**Goal**: Sync internal contacts from Lark to CRM as "Internal" type.

**Approach**:
1. Use existing Lark Contact API v3 endpoints (already documented in `/docs/lark/lark-contact-apis.md`)
2. Fetch all users from Lark organization
3. Create/update contacts with `contact_type = 'internal'`
4. Mark as `is_lark_synced = true`
5. Store `lark_user_id` for reference
6. Sync on-demand (manual button click) or scheduled (cron job)

### 6.2 Lark Sync Implementation

```javascript
// server/controllers/lark_sync_controller.js
const { getLarkAccessToken } = require('../organization_helper');
const axios = require('axios');

class LarkSyncController {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Sync all Lark users to contacts
   */
  async syncLarkContacts(organizationSlug) {
    const org = await getOrganizationInfo(organizationSlug);
    if (!org) {
      throw new Error('Organization not found');
    }

    // Get Lark access token
    const larkToken = await getLarkAccessToken(org.id);
    if (!larkToken) {
      throw new Error('Lark credentials not configured');
    }

    // Fetch all Lark users
    const larkUsers = await this.fetchAllLarkUsers(larkToken);

    let syncedCount = 0;
    let errorCount = 0;

    for (const larkUser of larkUsers) {
      try {
        await this.syncSingleLarkUser(org.id, larkUser);
        syncedCount++;
      } catch (err) {
        console.error(`Failed to sync Lark user ${larkUser.user_id}:`, err);
        errorCount++;
      }
    }

    // Update last sync timestamp
    await this.supabase
      .from('organizations')
      .update({ last_lark_sync_at: new Date().toISOString() })
      .eq('id', org.id);

    return {
      success: true,
      data: {
        syncedCount,
        errorCount,
        totalUsers: larkUsers.length
      }
    };
  }

  /**
   * Fetch all users from Lark
   */
  async fetchAllLarkUsers(larkToken) {
    const allUsers = [];
    let pageToken = null;

    do {
      const response = await axios.get('https://open.feishu.cn/open-apis/contact/v3/users', {
        headers: { Authorization: `Bearer ${larkToken}` },
        params: {
          page_size: 100,
          page_token: pageToken,
          user_id_type: 'user_id'
        }
      });

      if (response.data.code === 0 && response.data.data) {
        allUsers.push(...response.data.data.items);
        pageToken = response.data.data.page_token;
      } else {
        break;
      }
    } while (pageToken);

    return allUsers;
  }

  /**
   * Sync single Lark user to contact
   */
  async syncSingleLarkUser(organizationId, larkUser) {
    // Check if contact exists
    const { data: existing } = await this.supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('lark_user_id', larkUser.user_id)
      .eq('is_deleted', false)
      .maybeSingle();

    const contactData = {
      organization_id: organizationId,
      contact_type: 'internal',
      name: larkUser.name || 'Unknown',
      email: larkUser.email || larkUser.enterprise_email,
      phone: larkUser.mobile,
      position: larkUser.job_title,
      company: larkUser.company || '',
      lark_user_id: larkUser.user_id,
      lark_department_id: larkUser.department_ids?.[0] || null,
      is_lark_synced: true,
      last_lark_sync_at: new Date().toISOString()
    };

    if (existing) {
      // Update existing
      await this.supabase
        .from('contacts')
        .update(contactData)
        .eq('id', existing.id);
    } else {
      // Insert new
      await this.supabase
        .from('contacts')
        .insert(contactData);
    }
  }
}

module.exports = LarkSyncController;
```

### 6.3 Lark Department Mapping to Tags

Map Lark departments to contact tags:

```javascript
async syncLarkDepartmentsToTags(organizationId, larkToken) {
  // Fetch all departments from Lark
  const response = await axios.get('https://open.feishu.cn/open-apis/contact/v3/departments', {
    headers: { Authorization: `Bearer ${larkToken}` },
    params: { page_size: 100 }
  });

  const departments = response.data.data.items;

  for (const dept of departments) {
    // Check if tag exists
    const { data: existingTag } = await this.supabase
      .from('tags')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('name', dept.name)
      .eq('category', 'department')
      .eq('is_deleted', false)
      .maybeSingle();

    if (!existingTag) {
      // Create tag for department
      await this.supabase
        .from('tags')
        .insert({
          organization_id: organizationId,
          name: dept.name,
          color: '#10B981', // Green for departments
          category: 'department',
          description: `Lark department: ${dept.name}`
        });
    }
  }
}
```

### 6.4 Future: Lark Calendar Integration (Phase 2)

Sync appointments to Lark calendar:

```javascript
async syncAppointmentToLarkCalendar(contact, appointment) {
  // Create Lark calendar event when appointment stage is reached
  const larkToken = await getLarkAccessToken(contact.organization_id);

  const eventData = {
    summary: `Meeting with ${contact.name}`,
    description: appointment.notes || '',
    start_time: {
      timestamp: Math.floor(new Date(appointment.scheduled_date).getTime() / 1000).toString()
    },
    end_time: {
      timestamp: Math.floor((new Date(appointment.scheduled_date).getTime() + 3600000) / 1000).toString()
    },
    attendees: [
      { type: 'user', user_id: contact.lark_user_id }
    ]
  };

  await axios.post('https://open.feishu.cn/open-apis/calendar/v4/calendars/primary/events', eventData, {
    headers: { Authorization: `Bearer ${larkToken}` }
  });
}
```

---

## 7. UI/UX Design Guidelines

### 7.1 Design System

Following **ADR-002** (Tailwind CSS + shadcn/ui):

**Color Palette**:
```javascript
colors: {
  // Contact Type Colors
  customer: '#3B82F6',    // Blue-500
  supplier: '#10B981',    // Green-500
  coi: '#F59E0B',         // Amber-500 (Center of Influence)
  internal: '#8B5CF6',    // Purple-500

  // Pipeline Stage Colors (Note: These are customizable per organization)
  // Default colors:
  lead: '#9CA3AF',        // Gray-400
  prospect: '#60A5FA',    // Blue-400
  nurture: '#34D399',     // Green-400
  appointment: '#FBBF24', // Yellow-400
  won: '#10B981',         // Green-500
  lost: '#EF4444',        // Red-500
  cold: '#6B7280',        // Gray-500

  // Avatar Background Colors (for initials-based avatars)
  avatarColors: [
    '#3B82F6',  // Blue-500
    '#10B981',  // Green-500
    '#F59E0B',  // Amber-500
    '#8B5CF6',  // Purple-500
    '#EF4444',  // Red-500
    '#06B6D4',  // Cyan-500
    '#EC4899',  // Pink-500
    '#6366F1',  // Indigo-500
  ],

  // UI Colors
  primary: '#3B82F6',     // Blue-500
  primaryHover: '#2563EB', // Blue-600
  background: '#F9FAFB',  // Gray-50
  card: '#FFFFFF',
  border: '#E5E7EB',      // Gray-200
  text: '#111827',        // Gray-900
  textSecondary: '#6B7280' // Gray-500
}
```

**Avatar System**:
```javascript
// Generate initials avatar
function generateAvatar(firstName, lastName) {
  const initials = (firstName[0] + lastName[0]).toUpperCase();
  const colorIndex = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % 8;
  const backgroundColor = avatarColors[colorIndex];

  return {
    initials,
    backgroundColor,
    textColor: '#FFFFFF' // White text
  };
}

// Example: Alex Tan → "AT" with random background color
```

### 7.2 Kanban Board Design

**Layout**:
- Horizontal scrolling for dynamic stage columns (customizable per organization)
- Fixed column width: 320px
- Drag-and-drop using `react-beautiful-dnd`
- Card height: auto-expanding
- Column header shows count + total value
- Column colors based on organization's custom stage colors

**Card Design**:
```jsx
<div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
  <div className="flex items-start gap-3">
    {/* Avatar */}
    <div className="flex-shrink-0">
      {contact.avatar_url ? (
        <img
          src={contact.avatar_url}
          alt={`${contact.first_name} ${contact.last_name}`}
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
          style={{ backgroundColor: contact.avatar_color }}
        >
          {contact.first_name[0]}{contact.last_name[0]}
        </div>
      )}
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      {/* Contact Type Badge & Actions */}
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${typeColor}`}>
          {contact.contact_type}
        </span>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Contact Name */}
      <h3 className="font-semibold text-gray-900 mb-1 truncate">
        {contact.first_name} {contact.last_name}
      </h3>

      {/* Company */}
      {contact.company_name && (
        <p className="text-sm text-gray-600 mb-2 truncate">{contact.company_name}</p>
      )}

      {/* Department & Assigned To */}
      {contact.assigned_department && (
        <p className="text-xs text-gray-500 mb-1">
          {contact.assigned_department} • {contact.assigned_to?.name || 'Unassigned'}
        </p>
      )}

      {/* Referred By (for COI tracking) */}
      {contact.referred_by && (
        <p className="text-xs text-blue-600 mb-2">
          🔗 Referred by {contact.referred_by.first_name} {contact.referred_by.last_name}
        </p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-2">
        {contact.tags.map(tag => (
          <span
            key={tag.id}
            className="px-2 py-0.5 rounded text-xs"
            style={{ backgroundColor: tag.color + '20', color: tag.color }}
          >
            {tag.name}
          </span>
        ))}
      </div>
    </div>
  </div>
</div>
```

### 7.3 Contact List View

**Table Layout** (default view):
- Sticky header with column sorting
- Columns: Name, Company, Type, Stage, Assigned To, Last Contact, Tags, Actions
- Row hover shows quick actions
- Checkbox for bulk selection

**Card Layout** (optional toggle):
- Grid of contact cards
- 3 columns on desktop, 2 on tablet, 1 on mobile
- Same card design as Kanban

### 7.4 Contact Detail Sidebar

**Right-side sliding panel** (width: 600px):

**Sections**:
1. **Header**: Name, type badge, edit/delete buttons
2. **Contact Info**: Email, phone, company, position (editable inline)
3. **Pipeline**: Current stage with stage selector
4. **Tags**: Tag chips with add/remove
5. **Activity Timeline**: Chronological feed of all activities
6. **Opportunities**: List of linked deals
7. **Reminders**: Upcoming follow-ups
8. **Notes**: Rich text editor for general notes

### 7.5 Dashboard Layout

**4-column grid** (responsive):

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Pipeline   │  Sales Rep  │  Traffic    │  Activity   │
│  Metrics    │ Performance │  Source ROI │  Tracker    │
├─────────────┼─────────────┼─────────────┼─────────────┤
│  (Stage     │  (Contacts  │  (Lead      │  (Upcoming  │
│   counts    │   per rep,  │   sources,  │   tasks,    │
│   & values) │   conv rate)│   conv %)   │   overdue)  │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

Each widget:
- White card with shadow
- Header with title and refresh button
- Visualization (chart, list, or metrics)
- "View Details" link

### 7.6 Responsive Design

**Breakpoints**:
- Mobile: < 640px (1 column, stacked layout)
- Tablet: 640px - 1024px (2 columns)
- Desktop: > 1024px (3-4 columns)

**Mobile Optimizations**:
- Bottom navigation for view switching
- Floating action button for "New Contact"
- Swipe gestures for Kanban columns
- Collapsible filter panel

---

## 8. Import/Export Specifications

### 8.1 Contact Creation Methods

**Phase 1 - Manual Creation Only**:
- ✅ Manual contact entry via ContactForm component
- ✅ CSV/Excel import with field mapping (see 8.2)

**Phase 2 - Cloud Software Integrations** (Auto-Sync):
- 🔄 **Bukku Accounting Software** - Automatic contact sync from customers/suppliers
- 🔄 **Xero Accounting Software** - API integration for real-time contact sync
- 🔄 **Go High Level CRM** - Two-way sync for contacts and opportunities

**Phase 2 - Non-Cloud Software Imports** (File-Based):
- 🔄 **Autocount Accounting Software** - Import from exported CSV/Excel files
- 🔄 **SQL Accounting Software** - Import from exported CSV/Excel files
- 🔄 Pre-built CSV templates optimized for 名单管理 structure

### 8.2 CSV Import Format (Phase 1)

**Template Structure**:
```csv
First Name*,Last Name*,Gender,Email,Phone 1*,Phone 2,Company Name,Industry,Entity Type*,Contact Person Name,Contact Person Phone,Address Line 1,Address Line 2,Postal Code,City,State,Contact Type*,Stage,Traffic Channel,Assigned Department,Assigned To Email,Referred By Email,Tags,Notes
John,Doe,male,john@example.com,+1234567890,,Acme Corp,Technology,company,Jane Smith,+0987654321,123 Main St,,10001,New York,NY,customer,lead,Referral,sales,sales@company.com,,,Met at conference
Alex,Tan,male,alex@example.com,+1122334455,+1122334466,,Finance,individual,,,,456 Oak Ave,,90001,Los Angeles,CA,coi,prospect,Organic Search,sales,sales@company.com,john@example.com,"VIP,Hot Lead",COI - refers many customers
```

**Required Fields** (marked with *):
- First Name
- Last Name
- Phone 1
- Contact Type (customer, supplier, coi, internal)
- Entity Type (company, individual)

**Field Mapping UI**:
1. User uploads CSV/Excel
2. System detects columns
3. User maps CSV columns to CRM fields
4. Preview first 5 rows
5. Validate data (show errors)
6. Confirm and import

### 8.2 Import Logic

```javascript
// server/controllers/import_controller.js
async importContacts(organizationSlug, file, fieldMapping, individualId) {
  const org = await getOrganizationInfo(organizationSlug);
  if (!org) {
    throw new Error('Organization not found');
  }

  // Parse CSV/Excel
  const rows = await parseFile(file);

  const results = {
    total: rows.length,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  for (const [index, row] of rows.entries()) {
    try {
      // Map row to contact data
      const contactData = {};
      for (const [csvColumn, crmField] of Object.entries(fieldMapping)) {
        contactData[crmField] = row[csvColumn];
      }

      // Validate required fields
      if (!contactData.name || !contactData.contact_type) {
        results.errors.push({
          row: index + 2, // +2 for header row and 0-index
          error: 'Missing required fields: name or contact_type'
        });
        results.skipped++;
        continue;
      }

      // Check for duplicate
      const { data: existing } = await this.supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', org.id)
        .eq('email', contactData.email)
        .eq('is_deleted', false)
        .maybeSingle();

      if (existing) {
        // Update existing contact
        await this.supabase
          .from('contacts')
          .update({
            ...contactData,
            updated_by_individual_id: individualId,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        results.updated++;
      } else {
        // Create new contact
        await this.supabase
          .from('contacts')
          .insert({
            organization_id: org.id,
            ...contactData,
            created_by_individual_id: individualId
          });

        results.imported++;
      }
    } catch (err) {
      results.errors.push({
        row: index + 2,
        error: err.message
      });
      results.skipped++;
    }
  }

  return { success: true, data: results };
}
```

### 8.3 Export Logic

```javascript
// server/controllers/export_controller.js
async exportContacts(organizationSlug, filters = {}) {
  const org = await getOrganizationInfo(organizationSlug);
  if (!org) {
    throw new Error('Organization not found');
  }

  // Fetch contacts with filters
  let query = this.supabase
    .from('contacts')
    .select(`
      *,
      assigned_to:individuals!assigned_to_individual_id(name, email),
      contact_tags(tag:tags(name))
    `)
    .eq('organization_id', org.id)
    .eq('is_deleted', false);

  // Apply filters (same as list API)
  // ...

  const { data: contacts, error } = await query;
  if (error) throw error;

  // Convert to CSV
  const csv = convertToCSV(contacts);

  return csv;
}

function convertToCSV(contacts) {
  const headers = [
    'Name', 'Email', 'Phone', 'Mobile', 'Company', 'Position',
    'Contact Type', 'Stage', 'Traffic Source', 'Assigned To',
    'Tags', 'Last Contact Date', 'Notes', 'Created At'
  ];

  const rows = contacts.map(contact => [
    contact.name,
    contact.email || '',
    contact.phone || '',
    contact.mobile || '',
    contact.company || '',
    contact.position || '',
    contact.contact_type,
    contact.current_stage,
    contact.traffic_source || '',
    contact.assigned_to?.name || '',
    contact.contact_tags?.map(ct => ct.tag.name).join('; ') || '',
    contact.last_contact_date || '',
    contact.notes || '',
    contact.created_at
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}
```

### 8.4 Duplicate Detection

**Strategy**: Match by email (case-insensitive)

**Options**:
1. **Skip duplicates**: Do not import if email exists
2. **Update duplicates**: Update existing contact with new data
3. **Create duplicates**: Allow multiple contacts with same email (not recommended)

User selects strategy in import UI.

---

## 9. Dashboard & Analytics

### 9.1 Pipeline Metrics Widget

**Metrics**:
- Total contacts by stage (count)
- Total estimated value by stage (sum of opportunities)
- Conversion rates (stage-to-stage %)
- Average time in each stage (days)

**Visualization**:
- Horizontal bar chart showing counts per stage
- Stacked bar chart for values
- Funnel chart for conversion rates

**API Endpoint**:
```javascript
GET /api/dashboard/pipeline?organization_slug=xxx

Response:
{
  "success": true,
  "data": {
    "stages": {
      "lead": { "count": 45, "value": 125000 },
      "prospect": { "count": 30, "value": 180000 },
      "nurture": { "count": 20, "value": 95000 },
      "appointment": { "count": 15, "value": 120000 },
      "won": { "count": 10, "value": 250000 },
      "lost": { "count": 5, "value": 40000 },
      "cold": { "count": 8, "value": 20000 }
    },
    "conversionRates": {
      "lead_to_prospect": 66.7,
      "prospect_to_nurture": 66.7,
      "nurture_to_appointment": 75.0,
      "appointment_to_won": 66.7
    },
    "averageDaysInStage": {
      "lead": 7,
      "prospect": 14,
      "nurture": 21,
      "appointment": 5,
      "won": 0,
      "lost": 0,
      "cold": 0
    }
  }
}
```

### 9.2 Sales Rep Performance Widget

**Metrics**:
- Contacts per sales rep
- Won deals per rep
- Total value closed per rep
- Follow-up completion rate per rep
- Average response time

**Visualization**:
- Leaderboard table (sortable)
- Bar chart for comparison

**API Endpoint**:
```javascript
GET /api/dashboard/sales-rep?organization_slug=xxx

Response:
{
  "success": true,
  "data": {
    "reps": [
      {
        "individual_id": "uuid-1",
        "name": "John Sales",
        "totalContacts": 50,
        "wonDeals": 10,
        "totalValue": 250000,
        "followUpRate": 95,
        "avgResponseHours": 2.5
      },
      // ...
    ]
  }
}
```

### 9.3 Traffic Source ROI Widget

**Metrics**:
- Lead count by traffic source
- Conversion rate by source (lead → won %)
- Average deal value by source
- Cost per acquisition (if cost data available)

**Visualization**:
- Pie chart for lead distribution
- Table with conversion metrics

**API Endpoint**:
```javascript
GET /api/dashboard/traffic-source?organization_slug=xxx

Response:
{
  "success": true,
  "data": {
    "sources": {
      "Organic Search": {
        "leadCount": 45,
        "wonCount": 12,
        "conversionRate": 26.7,
        "avgValue": 25000,
        "totalValue": 300000
      },
      "Referral": {
        "leadCount": 30,
        "wonCount": 15,
        "conversionRate": 50.0,
        "avgValue": 30000,
        "totalValue": 450000
      },
      // ...
    }
  }
}
```

### 9.4 Activity Tracker Widget

**Metrics**:
- Upcoming follow-ups (next 7 days)
- Overdue reminders
- Recent activities (last 7 days)
- Activity breakdown by type (calls, emails, meetings)

**Visualization**:
- List of upcoming tasks with checkboxes
- Count badges for overdue items
- Activity timeline

**API Endpoint**:
```javascript
GET /api/dashboard/activities?organization_slug=xxx

Response:
{
  "success": true,
  "data": {
    "upcomingReminders": [
      {
        "id": "uuid",
        "contact_name": "John Doe",
        "reminder_type": "call",
        "title": "Follow up on proposal",
        "reminder_date": "2025-11-20T10:00:00Z"
      },
      // ...
    ],
    "overdueCount": 5,
    "recentActivities": [
      {
        "id": "uuid",
        "contact_name": "Jane Smith",
        "activity_type": "meeting",
        "subject": "Product demo",
        "activity_date": "2025-11-17T14:00:00Z"
      },
      // ...
    ],
    "activityBreakdown": {
      "call": 25,
      "email": 40,
      "meeting": 15,
      "note": 30
    }
  }
}
```

---

## 10. Implementation Timeline

### 10.1 Phase 1 - MVP (8-10 weeks)

#### Week 1-2: Database & Backend Foundation
- ✅ Create database schema (contacts, tags, contact_tags, opportunities, activities, follow_up_reminders)
- ✅ Implement RLS policies
- ✅ Create database triggers (status change logging, updated_at)
- ✅ Set up ContactsController
- ✅ Implement basic CRUD API endpoints
- ✅ Set up Vercel + Koa dual deployment

**Deliverable**: Working backend API with Postman tests

#### Week 3-4: Frontend Core Components
- ✅ Create tool directory structure
- ✅ Build ContactList component (table view)
- ✅ Build ContactForm component
- ✅ Build ContactDetail sidebar
- ✅ Implement API client (api.js)
- ✅ Implement useContacts hook with optimistic updates
- ✅ Add Supabase Realtime sync

**Deliverable**: Basic contact CRUD UI working

#### Week 5: Kanban Board
- ✅ Implement KanbanBoard component
- ✅ Integrate react-beautiful-dnd
- ✅ Build KanbanCard component
- ✅ Implement drag-and-drop stage changes
- ✅ Add stage-based filtering

**Deliverable**: Working pipeline Kanban view

#### Week 6: Tags & Activities
- ✅ Build TagManager component
- ✅ Implement TagSelector
- ✅ Create TagsController backend
- ✅ Build ActivityTimeline component
- ✅ Implement ActivityForm
- ✅ Create ActivitiesController backend
- ✅ Add activity logging to contact detail

**Deliverable**: Tagging and activity logging functional

#### Week 7: Reminders & Search
- ✅ Build ReminderList and ReminderForm
- ✅ Implement RemindersController
- ✅ Add browser notifications
- ✅ Build SearchBar with advanced filters
- ✅ Implement FilterPanel
- ✅ Add saved filter presets

**Deliverable**: Follow-up reminders and search working

#### Week 8: Import/Export
- ✅ Build ImportExport UI
- ✅ Implement CSV/Excel parsing backend
- ✅ Add field mapping interface
- ✅ Implement duplicate detection
- ✅ Build export to CSV functionality
- ✅ Create import/export templates

**Deliverable**: Contact import and export functional

#### Week 9: Dashboard & Analytics
- ✅ Build Dashboard component
- ✅ Implement PipelineMetrics widget
- ✅ Build SalesRepPerformance widget
- ✅ Implement TrafficSourceROI widget
- ✅ Build ActivityTracker widget
- ✅ Create DashboardController backend
- ✅ Add chart visualizations (recharts or chart.js)

**Deliverable**: Analytics dashboard complete

#### Week 10: Lark Sync & Polish
- ✅ Implement LarkSyncController
- ✅ Build Lark sync UI
- ✅ Test internal contact sync
- ✅ Map Lark departments to tags
- ✅ UI polish and responsive design
- ✅ Bug fixes and performance optimization
- ✅ Documentation updates

**Deliverable**: MVP ready for production

### 10.2 Phase 2 - Enhancements (6-8 weeks)

#### Week 11-12: Custom Fields
- ✅ Build custom field definition UI
- ✅ Implement field types (text, number, date, dropdown, etc.)
- ✅ Add custom fields to contact form
- ✅ Backend support for JSONB storage
- ✅ Field validation and conditional visibility

#### Week 13-14: File Attachments
- ✅ Set up Supabase Storage bucket
- ✅ Implement file upload UI
- ✅ Build AttachmentsController
- ✅ Add file preview
- ✅ Store meeting recording links

#### Week 15-16: Lark Calendar Integration
- ✅ Implement Lark Calendar API integration
- ✅ Sync appointments to Lark
- ✅ Two-way sync for meeting updates
- ✅ Auto-create Lark meetings from CRM

#### Week 17-18: Email Integration
- ✅ Implement Gmail API integration
- ✅ Auto-log emails to contact timeline
- ✅ Send emails from CRM
- ✅ Email templates
- ✅ Outlook/Exchange integration (optional)

### 10.3 Testing Checkpoints

**Week 5**: Internal alpha testing with team (5-10 users)
- Test basic CRUD operations
- Validate multi-tenant isolation
- Check Realtime sync

**Week 8**: Beta testing with select customers (20-30 users)
- Test import/export with real data
- Validate search and filtering
- Gather UX feedback

**Week 10**: Production readiness review
- Security audit
- Performance testing (1000+ contacts)
- Load testing (50+ concurrent users)
- Documentation review

---

## 11. Security & Compliance

### 11.1 Multi-Tenant Data Isolation

**Enforcement Layers**:

1. **Database Level** (RLS Policies):
   ```sql
   CREATE POLICY contacts_org_policy ON contacts
     FOR ALL
     USING (
       organization_id IN (
         SELECT organization_id FROM organization_members
         WHERE individual_id = auth.uid()
       )
     );
   ```

2. **Backend Level** (Organization Validation):
   ```javascript
   const org = await getOrganizationInfo(organizationSlug);
   if (!org) throw new Error('Organization not found');

   // All queries MUST filter by organization_id
   .eq('organization_id', org.id)
   ```

3. **Frontend Level** (Context Provider):
   ```javascript
   // Only show data for current organization
   const { currentOrganization } = useOrganization();
   ```

### 11.2 Role-Based Access Control (RBAC)

**Roles**:
- **Owner**: Full access, can delete organization
- **Admin**: Full CRM access, can manage members
- **Member**: Can view and edit contacts, cannot manage tags or settings
- **Read-Only**: View-only access (future)

**Permission Matrix**:

| Action | Owner | Admin | Member | Read-Only |
|--------|-------|-------|--------|-----------|
| Create Contact | ✅ | ✅ | ✅ | ❌ |
| Edit Contact | ✅ | ✅ | ✅ (own only) | ❌ |
| Delete Contact | ✅ | ✅ | ❌ | ❌ |
| Manage Tags | ✅ | ✅ | ❌ | ❌ |
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| Import/Export | ✅ | ✅ | ❌ | ❌ |
| Lark Sync | ✅ | ✅ | ❌ | ❌ |

**Implementation**:
```javascript
// Backend check
if (action === 'DELETE_CONTACT' && !ctx.session.is_admin) {
  return res.status(403).json(failResponse('Permission denied'));
}

// Frontend UI
{currentUser?.is_admin && (
  <Button onClick={handleDeleteContact}>Delete</Button>
)}
```

### 11.3 Audit Trail

**All operations logged**:
- Who created the contact (`created_by_individual_id`)
- Who last updated the contact (`updated_by_individual_id`)
- Who deleted the contact (`deleted_by_individual_id`)
- When each action occurred (`created_at`, `updated_at`, `deleted_at`)

**Audit Log Query**:
```sql
-- Get audit trail for a contact
SELECT
  c.id,
  c.name,
  c.created_at,
  creator.name AS created_by,
  c.updated_at,
  updater.name AS updated_by,
  c.deleted_at,
  deleter.name AS deleted_by
FROM contacts c
LEFT JOIN individuals creator ON c.created_by_individual_id = creator.id
LEFT JOIN individuals updater ON c.updated_by_individual_id = updater.id
LEFT JOIN individuals deleter ON c.deleted_by_individual_id = deleter.id
WHERE c.id = 'uuid';
```

### 11.4 Data Privacy & GDPR Compliance

**Right to Access**:
- Export all contact data via export API
- Provide audit trail on request

**Right to Erasure** ("Right to be Forgotten"):
- Hard delete option (admin only):
  ```sql
  DELETE FROM contacts WHERE id = 'uuid';
  ```
- Cascading deletes remove all related data (tags, activities, reminders)

**Data Minimization**:
- Only collect necessary fields
- Optional fields clearly marked
- No automatic third-party data enrichment without consent

**Consent Tracking** (Phase 2):
- Add `consent_to_contact` boolean field
- Track consent date and method
- Respect opt-out requests

### 11.5 Input Validation & XSS Prevention

**Backend Validation**:
```javascript
// Validate contact data
function validateContactData(data) {
  const errors = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (!['customer', 'supplier', 'internal'].includes(data.contact_type)) {
    errors.push('Invalid contact type');
  }

  // Sanitize HTML in notes field
  if (data.notes) {
    data.notes = sanitizeHtml(data.notes, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      allowedAttributes: { 'a': ['href'] }
    });
  }

  return errors;
}
```

**Frontend Validation**:
- Use HTML5 input validation
- Real-time validation feedback
- Sanitize user input before rendering

### 11.6 Rate Limiting

**API Rate Limits**:
- General endpoints: 100 requests/minute per organization
- Import endpoint: 10 requests/hour per organization
- Export endpoint: 20 requests/hour per organization
- Lark sync: 5 requests/hour per organization

**Implementation**:
```javascript
// Using express-rate-limit middleware
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  keyGenerator: (req) => req.query.organization_slug,
  message: 'Too many requests, please try again later.'
});

app.use('/api/', apiLimiter);
```

### 11.7 Secure File Uploads (Phase 2)

**File Upload Security**:
- Max file size: 10MB per file
- Allowed file types: PDF, DOCX, XLSX, PNG, JPG, MP4 (videos)
- Virus scanning before storage (ClamAV integration)
- Presigned URLs for temporary access
- File name sanitization

**Supabase Storage Policies**:
```sql
-- Users can only upload to their organization's folder
CREATE POLICY contact_attachments_upload_policy
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'contact-attachments' AND
    (storage.foldername(name))[1] IN (
      SELECT slug FROM organizations
      JOIN organization_members ON organizations.id = organization_members.organization_id
      WHERE organization_members.individual_id = auth.uid()
    )
  );
```

---

## 12. Appendix

### 12.1 Traffic Source Options

Predefined list of traffic channels:

```javascript
export const TRAFFIC_SOURCES = [
  'Direct (website)',
  'Organic Search (SEO)',
  'Paid Search (Google Ads)',
  'Paid Search (Bing Ads)',
  'Social Media - Facebook',
  'Social Media - LinkedIn',
  'Social Media - Instagram',
  'Social Media - Twitter/X',
  'Email Marketing',
  'Referral',
  'Event/Trade Show',
  'Cold Outreach',
  'Partner Referral',
  'Content Marketing',
  'Webinar',
  'Podcast',
  'YouTube',
  'Other'
];
```

### 12.2 Sample API Responses

**Get Contacts**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "organization_id": "uuid-org",
      "contact_type": "customer",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "company": "Acme Corp",
      "position": "CEO",
      "current_stage": "prospect",
      "traffic_source": "Referral",
      "assigned_to": {
        "id": "uuid-2",
        "name": "Sales Rep",
        "email": "sales@company.com"
      },
      "contact_tags": [
        { "tag": { "id": "uuid-3", "name": "VIP", "color": "#3B82F6" } }
      ],
      "last_contact_date": "2025-11-15T10:00:00Z",
      "created_at": "2025-11-01T08:00:00Z",
      "updated_at": "2025-11-15T10:00:00Z"
    }
  ],
  "metadata": {
    "total": 1,
    "organizationId": "uuid-org"
  }
}
```

**Create Contact**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-new",
    "organization_id": "uuid-org",
    "contact_type": "customer",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "current_stage": "lead",
    "created_at": "2025-11-18T12:00:00Z",
    "updated_at": "2025-11-18T12:00:00Z"
  }
}
```

### 12.3 Environment Variables

Required environment variables:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...

# Lark
REACT_APP_ALLOW_EXTERNAL_BROWSER=true  # Enable OAuth for dev

# API
REACT_APP_API_BASE=http://localhost:8989  # Dev mode
# Production: leave empty for relative paths

# Session
SESSION_SECRET=your-random-secret-key
```

### 12.4 Libraries & Dependencies

**Backend**:
```json
{
  "@supabase/supabase-js": "^2.38.0",
  "axios": "^1.6.0",
  "koa": "^2.14.0",
  "koa-router": "^12.0.0",
  "koa-session": "^6.4.0",
  "csv-parser": "^3.0.0",
  "xlsx": "^0.18.5",
  "sanitize-html": "^2.11.0"
}
```

**Frontend**:
```json
{
  "react": "^18.2.0",
  "axios": "^1.6.0",
  "react-beautiful-dnd": "^13.1.1",
  "recharts": "^2.10.0",
  "lucide-react": "^0.294.0",
  "tailwindcss": "^3.4.0",
  "framer-motion": "^10.16.0"
}
```

### 12.5 Testing Scenarios

**Critical Test Cases**:

1. **Multi-Tenant Isolation**:
   - User A creates contact in Org 1
   - User B from Org 2 cannot see User A's contact
   - API requests with wrong organization_slug fail

2. **Realtime Sync**:
   - User A updates contact
   - User B sees update within 1 second
   - No duplicate items in User B's view

3. **Import Duplicates**:
   - Import CSV with 100 contacts
   - 20 duplicates detected (by email)
   - User chooses "Update duplicates"
   - Verify 80 created, 20 updated

4. **Kanban Drag-Drop**:
   - Move contact from "Lead" to "Prospect"
   - Status change logged in activity timeline
   - Real-time update to other users

5. **Permission Checks**:
   - Member user tries to delete contact
   - API returns 403 Forbidden
   - Delete button hidden in UI for members

---

## Summary

This Contact CRM planning document provides a complete blueprint for implementing a professional, multi-tenant contact management system within the InsideCloud platform.

**Key Highlights**:
- ✅ Multi-tenant architecture with RLS and organization-level isolation
- ✅ Complete CRUD for contacts, tags, opportunities, activities, reminders
- ✅ Pipeline Kanban board with drag-and-drop
- ✅ Advanced filtering, search, and tagging
- ✅ Import/Export functionality
- ✅ Analytics dashboard with 4 key widgets
- ✅ Lark integration for internal contacts
- ✅ Realtime collaboration with Supabase
- ✅ RBAC and audit trails for security
- ✅ Phase 1 (MVP) + Phase 2 (Enhancements) roadmap

**Next Steps**:
1. Review and approve this planning document
2. Create GitHub project board with tasks
3. Begin Week 1 implementation (database schema)
4. Set up staging environment for testing

---

**Document Status**: Draft for Review
**Author**: Development Team
**Reviewers**: Product Owner, Tech Lead
**Approval Required**: Yes
**Target Start Date**: TBD
