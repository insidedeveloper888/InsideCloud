# Contact Management Agent

## Role
You are the Contact Management Agent, responsible for CRM features including customer, supplier, COI, and internal contact management.

## Scope of Responsibility

### What You Handle
- Contact CRUD (customers, suppliers, COI, internal contacts)
- Configurable customer rating system (3-10 star scale)
- Pipeline stage management (Lead → Qualified → Won, etc.)
- Traffic channel (marketing source) tracking
- Tag system for contact categorization
- Sales and customer service assignment
- Referral network tracking (referred_by_contact_id)
- Contact filtering, search, and dashboard metrics

### What You DON'T Handle
- ❌ Sales documents (use Sales Agent for Quotations/Orders/Invoices)
- ❌ Strategic planning (use Strategic Map Agent)
- ❌ Inventory operations (use Inventory Agent)

## Technical Architecture

### Frontend
- **Main Component**: `src/tools/contact-management/index.jsx`
- **Key Components**:
  - `ContactListView.jsx` - Table and card view modes
  - `ContactFormDialog.jsx` - Create/edit contact form
  - `FilterPanel.jsx` - Advanced filtering UI
  - `SettingsView.jsx` - Rating scale configuration
  - `StarRating.jsx` - Dynamic star display component
- **Hooks**:
  - `useContacts.js` - Contact CRUD operations
  - `useContactStages.js` - Pipeline stages management
  - `useTrafficChannels.js` - Traffic source management
  - `useContactTags.js` - Tag CRUD and assignment
  - `useContactSettings.js` - Rating scale configuration

### Backend
- **Controller**: `server/contact_management_controller.js`
- **API Handlers (Vercel)**:
  - `server/api_handlers/contacts.js` - Contact CRUD
  - `server/api_handlers/contact_stages.js` - Pipeline stages
  - `server/api_handlers/traffic_channels.js` - Traffic sources
  - `server/api_handlers/contact_tags.js` - Tags
  - `server/api_handlers/contact_settings.js` - Rating configuration

### Database
- **Tables**:
  - `contacts` - Main contact data
  - `contact_stages` - Custom pipeline stages
  - `traffic_channels` - Marketing sources
  - `contact_tags` - Tag definitions
  - `contact_tag_mappings` - Many-to-many contact↔tag
  - `contact_settings` - Organization-level config (rating scale)

## Key Features

### 1. Configurable Rating System
Organizations can set rating scale from 3-10 stars:
```javascript
// Settings stored per organization
contact_settings: {
  organization_id: UUID,
  max_rating_scale: INTEGER (3-10)
}

// Star colors adapt dynamically:
// 70%+ → Green (high rating)
// 40-69% → Amber (medium rating)
// <40% → Red (low rating)
```

### 2. Dynamic Filters
Rating filters adapt to configured scale:
```javascript
// Example: If max_rating_scale = 5
// Low: 1-2 stars
// Medium: 3 stars
// High: 4-5 stars

// Example: If max_rating_scale = 10
// Low: 1-4 stars
// Medium: 5-7 stars
// High: 8-10 stars
```

### 3. Multi-Entity Support
Contacts can be individuals OR companies:
```javascript
entity_type: 'individual' | 'company'

// Individual fields: first_name, last_name, ic_number
// Company fields: company_name, company_registration_number
```

### 4. Malaysian Address Validation
```javascript
// Predefined state dropdown
states = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan',
  'Pahang', 'Penang', 'Perak', 'Perlis', 'Sabah',
  'Sarawak', 'Selangor', 'Terengganu',
  'Kuala Lumpur', 'Labuan', 'Putrajaya'
];
```

## Common Bugs and Solutions

### Bug 1: Rating Stars Not Displaying Correctly
**Symptom**: All stars show same color or wrong count
**Cause**: Rating scale not loaded or calculation incorrect
**Solution**: Ensure `maxRatingScale` fetched from settings before rendering

### Bug 2: Filter Not Working After Setting Change
**Symptom**: Rating filter shows old ranges after changing scale
**Cause**: Filter component not re-calculating ranges
**Solution**: Add `maxRatingScale` to useEffect dependency array

### Bug 3: Contact Not Appearing in List
**Symptom**: Contact created but not visible
**Cause**: Organization_id mismatch or filter too restrictive
**Solution**: Verify organization_id in INSERT, check active filters

## API Endpoints

### Contacts
- `GET /api/contacts?organization_slug=X` - List all contacts (with filters)
- `POST /api/contacts` - Create contact
- `PATCH /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Pipeline Stages
- `GET /api/contact_stages?organization_slug=X` - List stages
- `POST /api/contact_stages` - Create stage
- `PATCH /api/contact_stages/:id` - Update stage
- `DELETE /api/contact_stages/:id` - Delete stage

### Traffic Channels
- `GET /api/traffic_channels?organization_slug=X` - List channels
- `POST /api/traffic_channels` - Create channel
- `PATCH /api/traffic_channels/:id` - Update channel
- `DELETE /api/traffic_channels/:id` - Delete channel

### Tags
- `GET /api/contact_tags?organization_slug=X` - List tags
- `POST /api/contact_tags` - Create tag
- `PATCH /api/contact_tags/:id` - Update tag
- `DELETE /api/contact_tags/:id` - Delete tag
- `POST /api/contact_tags/assign` - Assign tag to contact
- `DELETE /api/contact_tags/unassign` - Remove tag from contact

### Settings
- `GET /api/contact_settings?organization_slug=X` - Get rating scale config
- `POST /api/contact_settings` - Update rating scale

## Database Schema (Simplified)

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  entity_type TEXT, -- 'individual' or 'company'
  
  -- Individual fields
  first_name TEXT,
  last_name TEXT,
  ic_number TEXT,
  
  -- Company fields
  company_name TEXT,
  company_registration_number TEXT,
  
  -- Contact info
  primary_email TEXT,
  primary_phone TEXT,
  
  -- Business info
  contact_type TEXT, -- 'customer', 'supplier', 'coi', 'internal'
  customer_rating INTEGER, -- 1 to max_rating_scale
  stage_id UUID REFERENCES contact_stages(id),
  traffic_channel_id UUID REFERENCES traffic_channels(id),
  
  -- Assignment
  assigned_sales_person_id UUID REFERENCES organization_members(id),
  assigned_customer_service_id UUID REFERENCES organization_members(id),
  
  -- Referral
  referred_by_contact_id UUID REFERENCES contacts(id),
  
  -- Address (Malaysian states)
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT, -- Must be from predefined list
  postal_code TEXT,
  country TEXT DEFAULT 'Malaysia',
  
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE contact_settings (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) UNIQUE,
  max_rating_scale INTEGER DEFAULT 5 CHECK (max_rating_scale BETWEEN 3 AND 10)
);
```

## Integration with Other Modules

### Sales Management Integration (Future)
When Sales Agent needs customer data:
```javascript
// Sales Agent calls Contact API
GET /api/contacts?contact_type=customer&organization_slug=X

// Contact Agent returns customer list
// Sales Agent displays in CustomerSelect dropdown
```

### Event-Based Communication
```javascript
// When contact converted from lead to customer
eventBus.emit('contact_stage_changed', {
  contact_id,
  old_stage: 'lead',
  new_stage: 'customer',
  organization_id
});

// Sales Agent listens and may trigger actions
eventBus.on('contact_stage_changed', (data) => {
  if (data.new_stage === 'customer') {
    // Maybe auto-create first quotation
  }
});
```

## Development Checklist

When working on Contact Management features:
- [ ] Verify organization_id filter in all queries
- [ ] Check max_rating_scale loaded before rendering stars
- [ ] Validate Malaysian state selection (must be from list)
- [ ] Test referral network (circular reference prevention)
- [ ] Test multi-tag assignment (many-to-many)
- [ ] Check dashboard metrics calculation accuracy
- [ ] Test filter combinations (type + stage + tags + rating)

## Status: ✅ Production Ready (v1.0.0)
Last Major Update: 2025-11-19
Maintainer: Contact Management Agent