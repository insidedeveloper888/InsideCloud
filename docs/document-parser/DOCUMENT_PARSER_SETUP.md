# Document Parser Product Setup

This document outlines the complete setup of the Document Parser product in the InsideCloud application.

## Overview

Document Parser is a new product module that allows users to upload and parse documents to extract structured information. It's now fully integrated into the InsideCloud product ecosystem.

## Database Setup

### Product Record
- **Table**: `public.products`
- **Product ID**: `45216e94-0edc-49cc-bbac-57e67c2d838e`
- **Product Key**: `document_parser`
- **Product Name**: `Document Parser`
- **Category**: `analytics`
- **Status**: Active
- **Created**: 2025-11-18

### Organization Access Records
- **Table**: `public.organization_product_access`
- **Enabled For**: All organizations (2 records created)
- **Access Level**: Full access (`is_enabled: true`)

**Setup Script**: `/Users/jackytok/Desktop/InsideCloud/scripts/setup-document-parser.js`

To run setup again:
```bash
node scripts/setup-document-parser.js
```

## Frontend Components

### Main Component
**File**: `src/tools/document-parser/index.jsx`

**Key Features**:
- Document upload interface with drag-and-drop support
- File type validation (PDF, DOC, DOCX, TXT, CSV)
- Loading states and error handling
- Placeholder for parsed documents list
- Development notice indicating WIP status

**Props**:
```javascript
{
  organizationSlug: string  // Organization identifier
}
```

**Future Implementation**:
- API endpoint: `/api/document-parser/upload`
- Document parsing logic
- Results display and visualization
- Database storage integration

### Styling
**File**: `src/tools/document-parser/index.css`

Responsive design with:
- Mobile-first approach
- Loading animations
- File input styling
- Hover effects

## Integration Points

### 1. Dashboard (src/pages/home/index.js)

**DashboardContent Component** (lines 78-88):
- New product card added to dashboard
- Icon: FileText (lucide-react)
- Click handler: `onNavigate('document_parser')`
- Active status: Enabled (not "Coming Soon")

```jsx
<div
  className="bg-white rounded-3xl min-h-[200px] transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-xl flex flex-col justify-center items-center p-8 shadow-sm"
  onClick={() => onNavigate && onNavigate('document_parser')}
>
  <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center mb-4">
    <FileText size={56} />
  </div>
  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
    Document Parser
  </h3>
</div>
```

### 2. Navigation Tabs (src/pages/home/index.js)

**navItems Array** (line 711):
- Added to admin-only navigation
- Section: 'Product'
- Label: 'Document Parser'
- Icon: FileText

```javascript
{
  key: 'document_parser',
  label: 'Document Parser',
  icon: FileText,
  section: 'Product'
}
```

### 3. View Renderer (src/pages/home/index.js)

**renderActiveView Switch Statement** (lines 941-946):
- Case: `'document_parser'`
- Component: `DocumentParser`
- Props: `organizationSlug`

```javascript
case 'document_parser':
  return (
    <DocumentParser
      organizationSlug={selectedOrganizationSlug}
    />
  );
```

### 4. Component Import (src/pages/home/index.js)

**Line 40**:
```javascript
import DocumentParser from '../../tools/document-parser/index.jsx';
```

## Navigation Flow

Users can access Document Parser through:

1. **Dashboard Card** (All users when viewing dashboard)
   - Click on "Document Parser" card
   - Navigates to `document_parser` view

2. **Navigation Tab** (Admin users only)
   - Appears in top navigation bar
   - Section: Products
   - Label: Document Parser

3. **Organization Slug Propagation**
   - Automatically passed to component
   - Used for API calls and data isolation

## File Structure

```
src/tools/document-parser/
├── index.jsx           # Main component
├── index.css           # Styling
└── components/         # For future sub-components
    ├── (FileUploader)
    ├── (ParsedResults)
    └── (DocumentList)

docs/
└── DOCUMENT_PARSER_SETUP.md  # This file

scripts/
└── setup-document-parser.js  # Database setup script
```

## Next Steps for Development

### Phase 1: Backend API
- [ ] Create `/api/document-parser/upload` endpoint
- [ ] Implement file upload handler
- [ ] Add file validation and storage
- [ ] Create database schema for documents

### Phase 2: Parsing Engine
- [ ] Integrate document parsing library
- [ ] Implement text extraction
- [ ] Add structured data extraction
- [ ] Create result formatting

### Phase 3: Frontend Features
- [ ] Implement results display component
- [ ] Add document list view
- [ ] Create results visualization
- [ ] Add document download/export

### Phase 4: Database Integration
- [ ] Create `documents` table
- [ ] Create `document_results` table
- [ ] Add RLS policies
- [ ] Implement organization isolation

### Phase 5: Testing & Deployment
- [ ] Unit tests for components
- [ ] Integration tests for API
- [ ] E2E testing
- [ ] Performance optimization
- [ ] Production deployment

## Access Control

**Current Implementation**: Role-based
- Admin users: Full access (dashboard + navigation)
- Regular users: Dashboard only

**Future Implementation**: Product-based access control
- Will use `organization_product_access` table
- Per-organization, per-product fine-grained access
- Roles can restrict feature access within product

## API Endpoints (To Be Implemented)

```
POST   /api/document-parser/upload
GET    /api/document-parser/documents
GET    /api/document-parser/documents/:id
GET    /api/document-parser/results/:id
DELETE /api/document-parser/documents/:id
```

## Environment Variables

No additional environment variables required at this stage.

When implementing backend features, you may need:
- `DOCUMENT_PARSER_API_KEY` (for parsing service)
- `FILE_STORAGE_PATH` (for uploaded documents)
- `MAX_FILE_SIZE` (upload limit, default: 10MB)

## Testing

### Manual Testing Checklist
- [ ] Dashboard card displays correctly
- [ ] Click dashboard card navigates to Document Parser
- [ ] Top navigation shows tab for admin users
- [ ] Click nav tab navigates to Document Parser
- [ ] Component loads without errors
- [ ] File selection works
- [ ] UI is responsive on mobile

### Component State Testing
- [ ] File selection updates state
- [ ] Error messages display
- [ ] Loading state shows spinner
- [ ] Empty state displays correctly
- [ ] Development notice is visible

## Troubleshooting

### Build Errors
If you encounter build errors:
1. Run `npm install` to ensure dependencies
2. Check for TypeScript/ESLint warnings
3. Build output location: `build/` directory

### Navigation Issues
If Document Parser doesn't appear in navigation:
1. Verify `isAdmin` is true
2. Check `navItems` includes document_parser entry
3. Verify `renderActiveView` has case for 'document_parser'

### Database Issues
If Supabase setup fails:
1. Verify `.env` file has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
2. Run setup script: `node scripts/setup-document-parser.js`
3. Check Supabase console for records

## References

- Product ID: `45216e94-0edc-49cc-bbac-57e67c2d838e`
- Supabase Tables: `products`, `organization_product_access`
- Main Files: `src/pages/home/index.js`, `src/tools/document-parser/`
- Setup Script: `scripts/setup-document-parser.js`

## Related Documents

- [Architecture Overview](./ARCHITECTURE.md)
- [Strategic Map Setup](./strategic-map/strategic-map-solution-summary.md)
- [API Structure](../api/README.md)
