# Contact Management - Component Architecture Explanation

## Overview

The Contact Management tool has several components, some actively used and some unused alternatives. This document explains their purposes and current status.

---

## ✅ **Actively Used Components**

### 1. **ContactFormDialog.jsx** (CURRENT)
**Purpose:** Main form for creating and editing contacts
**Type:** Modal dialog (popup)
**Features:**
- Single-page form with all fields visible
- Clean Tailwind CSS styling
- Conditional fields (entity_type determines if company fields show)
- Integrates with MemberSelect for assignments
- Avatar URL input (file upload coming soon)

**Why it's used:**
- Simple, single-page interface
- All fields accessible without navigating steps
- Faster for users who know what they want to enter

---

### 2. **ContactListView.jsx** (CURRENT)
**Purpose:** Main view for displaying contacts
**Type:** Multi-mode list view
**Features:**
- **Table view** - Dense list with columns
- **Card view** - Spacious cards with more visual emphasis
- **Search** - Filter contacts by name, email, phone, company
- **Filter Panel** (NEW) - Sidebar with advanced filters
- **Pagination** - 10 items per page
- Responsive view mode switching

**Recently Added:**
- ✅ FilterPanel integration (collapsible sidebar)
- ✅ Filter by contact type, stage, and traffic source
- ✅ Active filter count badge on filter button

---

### 3. **FilterPanel.jsx** (NOW INTEGRATED)
**Purpose:** Advanced filtering sidebar
**Type:** Collapsible side panel
**Features:**
- Filter by **Contact Type** (Customer, Supplier, COI, Internal)
- Filter by **Stage** (with color indicators)
- Filter by **Traffic Source** (channels)
- Expandable/collapsible sections
- "Clear all" button when filters active
- Active filter count displayed

**Recently Updated:**
- ✅ Converted from CSS to Tailwind CSS (following ADR-002)
- ✅ Integrated into ContactListView
- ✅ Toggle button with active filter count badge

---

### 4. **ContactAvatar.jsx** (CURRENT)
**Purpose:** Display contact avatars with initials fallback
**Type:** Reusable avatar component
**Features:**
- Shows avatar image if `avatar_url` exists
- Shows colored circle with initials if no image
- Random color assigned by backend
- Three sizes: `sm`, `md`, `lg`

**Used in:**
- Contact list table view
- Contact list card view
- Member selection dropdowns

---

### 5. **MemberSelect.jsx** (CURRENT)
**Purpose:** Custom dropdown for selecting organization members
**Type:** Custom select with avatars
**Features:**
- Shows member avatars in dropdown options
- Used for Sales Person and Customer Service assignment
- Native HTML `<select>` can't show images, so custom component needed

---

## ⏸️ **Unused Alternative Components**

### 6. **ContactForm.jsx** (NOT USED)
**Purpose:** Multi-step wizard form for creating/editing contacts
**Type:** 3-step wizard modal
**Structure:**
- **Step 1:** Basic Information (name, phone, email, gender)
- **Step 2:** Company Information (entity type, company name, contact person)
- **Step 3:** Address & Assignment (address, channel, department, stage)

**Why it's NOT used:**
- **User experience:** Multi-step forms can feel slower
- **Use case:** Better for complex forms where users might not have all info at once
- **Current preference:** Single-page form (ContactFormDialog) is faster

**When to use this instead:**
- If users frequently abandon forms (break it into smaller steps)
- If form becomes too long and overwhelming
- If data collection happens in stages (e.g., initial contact, then follow-up)

**How to switch:**
1. In `ContactListView.jsx`, replace `ContactFormDialog` with `ContactForm`
2. Update import statement
3. Pass same props (contact, stages, channels, onSubmit, onCancel)

---

### 7. **ContactDetailSidebar.jsx** (NOT USED)
**Purpose:** Right sidebar showing detailed contact information
**Type:** Slide-in detail panel
**Features:**
- Shows full contact details in a side panel
- Avatar display at top
- Organized sections: Contact Info, Company, Address, Assignment, Notes
- Edit and Delete buttons at bottom
- Uses deprecated `assigned_department` field (needs update)

**Why it's NOT used:**
- **Current UX:** Users click "Edit" button directly → opens form dialog
- **Alternative UX:** Users would click row → opens detail sidebar → click "Edit" button → opens form
- More steps to edit a contact

**When to use this instead:**
- If you want a "view-only" mode before editing
- If you want to show more information than fits in table/card
- If you want to display related data (e.g., contact history, recent interactions)

**How to switch:**
1. Add `selectedContact` state in `ContactListView.jsx`
2. Add click handler to table rows/cards to set `selectedContact`
3. Render `ContactDetailSidebar` when `selectedContact` exists
4. Update the component to use `sales_person_individual_id` instead of `assigned_department`

**Code changes needed:**
```javascript
// In ContactListView.jsx
const [selectedContact, setSelectedContact] = useState(null);

// Click handler
const handleContactClick = (contact) => {
  setSelectedContact(contact);
};

// Render sidebar
{selectedContact && (
  <ContactDetailSidebar
    contact={selectedContact}
    stage={stages.find(s => s.id === selectedContact.current_stage_id)}
    onClose={() => setSelectedContact(null)}
    onEdit={() => {
      setEditingContact(selectedContact);
      setIsFormOpen(true);
      setSelectedContact(null);
    }}
    onDelete={() => handleDeleteClick(selectedContact.id)}
  />
)}
```

---

## Component Comparison

| Feature | ContactFormDialog | ContactForm | ContactDetailSidebar |
|---------|-------------------|-------------|---------------------|
| **Type** | Single-page modal | Multi-step wizard | Read-only sidebar |
| **Steps** | 1 page, all fields | 3 steps | View only |
| **Speed** | Fast (1 submit) | Slower (3 steps) | N/A (view mode) |
| **Use Case** | Quick edits | Guided data entry | View details first |
| **Status** | ✅ IN USE | ⏸️ NOT USED | ⏸️ NOT USED |
| **Styling** | Tailwind CSS | Custom CSS | Custom CSS |

---

## Recommendations

### Keep Using
- ✅ **ContactFormDialog** - Works well for current use case
- ✅ **ContactListView** - Core component with good UX
- ✅ **FilterPanel** - Now integrated, useful for large contact lists
- ✅ **ContactAvatar** - Needed for visual identification
- ✅ **MemberSelect** - Needed for avatar dropdowns

### Consider Using Later
- ⏸️ **ContactForm** - If form becomes too long or complex
- ⏸️ **ContactDetailSidebar** - If you want a "preview before edit" flow

### Modernize If Using
Both unused components use custom CSS and need updating:
1. Convert to Tailwind CSS (follow ADR-002)
2. Update deprecated fields (`assigned_department` → `sales_person_individual_id`)
3. Remove references to non-existent CSS files

---

## File Upload Feature (Next to Implement)

The current avatar system uses:
- **Input:** URL text field
- **Storage:** Just stores the URL string
- **Display:** `<img src={avatar_url}>`

**Planned enhancement:**
1. Replace URL input with file upload
2. Upload to Supabase Storage or CDN
3. Get back a permanent URL
4. Store that URL in `avatar_url` column
5. Display recommended resolution (e.g., 200x200px)
6. Show image preview before upload

This will be implemented next.

---

## Summary

**Active Components:**
- ContactFormDialog, ContactListView, FilterPanel, ContactAvatar, MemberSelect

**Unused but Available:**
- ContactForm (multi-step wizard)
- ContactDetailSidebar (detail view panel)

**Why unused components exist:**
- Developed during MVP phase as alternatives
- Single-page form won and sidebar detail view wasn't needed
- Good to have as options if UX requirements change

**Action needed for unused components:**
- Keep as-is for now (potential future use)
- Update if you decide to use them (CSS → Tailwind, deprecated fields)
- Or delete if never planning to use them
