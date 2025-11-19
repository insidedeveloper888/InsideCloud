# 名单管理 (Contact List Management) - Quick Start Guide

**Created**: 2025-11-18
**Status**: Ready for Integration

---

## ⚡ Quick Integration (5 Steps)

### Step 1: Import the App Component

In your main app file (e.g., `src/pages/home/index.js`), import the contact management tool:

```javascript
import ContactManagementApp from '@/tools/contact-management';

// In your main layout/router:
<ContactManagementApp />
```

### Step 2: Setup Database Schema

Run the migration in Supabase:

```bash
# Copy the contents of docs/contact-management-schema.sql
# In Supabase SQL Editor, paste and execute
```

Or use the Supabase CLI:

```bash
supabase db push docs/contact-management-schema.sql
```

### Step 3: Create Backend Routes

Add routes to your Koa server (`server/server.js`):

```javascript
const contactController = require('./contact_management_controller');

// Contact routes
router.get('/api/contacts', contactController.getContacts);
router.post('/api/contacts', contactController.createContact);
router.put('/api/contacts/:id', contactController.updateContact);
router.delete('/api/contacts/:id', contactController.deleteContact);

// Stage routes
router.get('/api/contact-stages', contactController.getContactStages);
router.post('/api/contact-stages', contactController.createContactStage);
router.delete('/api/contact-stages/:id', contactController.deleteContactStage);

// Channel routes
router.get('/api/traffic-channels', contactController.getTrafficChannels);
router.post('/api/traffic-channels', contactController.createTrafficChannel);
router.delete('/api/traffic-channels/:id', contactController.deleteTrafficChannel);
```

### Step 4: Create Vercel Serverless Functions

Create corresponding files in `/api/` for production deployment:

```javascript
// api/contacts.js
const controller = require('../server/contact_management_controller');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Call controller.getContacts
  } else if (req.method === 'POST') {
    // Call controller.createContact
  }
  // ... etc
}
```

### Step 5: Test Locally

```bash
npm run start              # Starts both frontend and backend
# Visit: http://localhost:3000
# Navigate to the Contact Management tool in your app
```

---

## 🛠️ Configuration

### Required Environment Variables

```bash
# .env or .env.local
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

### Optional Customization

#### Change Primary Color
Edit `src/tools/contact-management/index.css`:
```css
/* Change from #1976D2 to your brand color */
--primary-color: #your-color;
```

#### Customize Default Stages
Add seed data after creating the database:
```sql
INSERT INTO contact_stages (organization_id, name, color, order_index)
VALUES
  (org_id, 'Lead', '#2196F3', 0),
  (org_id, 'Prospect', '#9C27B0', 1),
  (org_id, 'Appointment', '#00BCD4', 2),
  (org_id, 'Nurture', '#FFC107', 3),
  (org_id, 'Won', '#4CAF50', 4),
  (org_id, 'Lost', '#F44336', 5),
  (org_id, 'Cold', '#9E9E9E', 6);
```

#### Customize Default Channels
```sql
INSERT INTO traffic_channels (organization_id, name, is_enabled)
VALUES
  (org_id, 'LinkedIn', true),
  (org_id, 'Referral', true),
  (org_id, 'Online Ads', true),
  (org_id, 'Cold Call', true),
  (org_id, 'Events', true),
  (org_id, 'Email Marketing', true),
  (org_id, 'Website', true);
```

---

## 📋 Feature Checklist

### Phase 1 MVP (Complete ✅)
- ✅ Contact CRUD operations
- ✅ Search and advanced filtering
- ✅ Custom stages management
- ✅ Custom traffic channels
- ✅ Contact detail view
- ✅ Pipeline kanban board
- ✅ Dashboard with 4 metrics
- ✅ Mobile-responsive design
- ✅ Multi-tenant isolation
- ✅ Soft delete support

### Phase 2 Enhancements (Ready for development)
- ☐ Avatar upload to Supabase Storage
- ☐ Drag-and-drop kanban with persistence
- ☐ Activity logging (calls, emails, meetings, notes)
- ☐ Follow-up reminders
- ☐ Import/Export functionality (CSV, Excel)
- ☐ Real-time collaboration (Supabase Realtime)
- ☐ Advanced analytics
- ☐ Email integration (Lark Messenger)
- ☐ RBAC (Role-Based Access Control)
- ☐ Third-party integrations (Bukku, Xero, GHL)

---

## 🐛 Troubleshooting

### Issue: "Missing organization_slug"
**Cause**: Component not receiving OrganizationContext
**Fix**: Wrap app with OrganizationContextProvider:
```javascript
<OrganizationProvider>
  <ContactManagementApp />
</OrganizationProvider>
```

### Issue: API 404 errors
**Cause**: Routes not registered on backend
**Fix**: Ensure all controller methods are registered in `server.js`

### Issue: No data showing
**Cause**: RLS policies blocking queries
**Fix**: Verify user is in organization_members table and RLS is enabled

### Issue: Styles not applying
**Cause**: CSS not imported
**Fix**: Ensure `import './index.css'` is in main component

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `CONTACT_CRM_PLANNING.md` | Complete product specification |
| `MINGDAN_UI_MOCKUPS.md` | UI/UX wireframes and design |
| `contact-management-schema.sql` | Database migration |
| `CONTACT_MANAGEMENT_IMPLEMENTATION_SUMMARY.md` | Technical details |
| `CONTACT_MANAGEMENT_QUICK_START.md` | This file |

---

## 🚀 Deployment

### For Vercel Deployment

1. Create `/api/contacts.js`, `/api/contact-stages.js`, `/api/traffic-channels.js`
2. Update `vercel.json` to include new routes
3. Ensure environment variables are set in Vercel dashboard
4. Deploy: `npm run deploy`

### Database Migrations

Supabase automatically handles migrations:
```bash
supabase db push
```

---

## 💡 Development Tips

### Adding a New Field

1. Update database schema (add column to contacts table)
2. Update ContactForm.jsx (add form field)
3. Update ContactDetailSidebar.jsx (add display field)
4. Update API client if needed

### Adding a New Component

Follow the pattern:
```javascript
// components/MyComponent.jsx
import './MyComponent.css';

export default function MyComponent({ props }) {
  return (
    <div className="my-component">
      {/* JSX */}
    </div>
  );
}
```

### Testing a Hook

```javascript
// In your component
const {
  contacts,
  isLoading,
  error,
  addContact,
  updateContact,
  deleteContact
} = useContacts(organizationSlug);

// Use in handlers
const handleAdd = async (data) => {
  try {
    await addContact(data);
    // Success
  } catch (err) {
    console.error(err);
  }
};
```

---

## 📞 Support

For questions or issues with the Contact Management tool:

1. Check the implementation summary for detailed component docs
2. Review the planning document for feature specifications
3. Examine the UI mockups for design requirements
4. Check the Koa controller for API endpoint details

---

## ✅ Ready to Go!

The 名单管理 (Contact List Management) MVP is complete and ready for:
- ✅ Supabase database integration
- ✅ End-to-end testing
- ✅ Lark authentication integration
- ✅ Production deployment
- ✅ Phase 2 feature development

**Next Action**: Setup Supabase schema and run local tests!
