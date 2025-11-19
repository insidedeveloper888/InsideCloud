# 名单管理 (Contact List Management) - UI/UX Mockups

**Version**: 1.0
**Date**: 2025-11-18
**Mobile-First Design**: All mockups are designed for mobile (375px width) with responsive scaling

---

## 1. Contact List View (Mobile)

### Layout: Bottom Navigation + List View

```
┌─────────────────────────────┐
│ ▦ 名单管理      ⚙️            │  (Header with menu)
├─────────────────────────────┤
│ [🔍 Search Contacts      ]  │  (Search bar)
│ [⊙ Filters ▾]  [📋 List/Board]  (Toggle & Filters)
├─────────────────────────────┤
│                             │
│ 📇 Alexandra Tan       ✓ ⋯  │  (Contact card)
│    Customer | Lead          │
│    Phone: +60 12 XXX 1234   │
│    Referred by: John Doe    │
│                             │
│ 📇 John Doe           ⋯     │
│    Supplier | Won           │
│    Email: john@email.com    │
│    Traffic: Online Ads      │
│                             │
│ 📇 Company XYZ        ⋯     │  (More contacts...)
│    Customer | Prospect      │
│    Contact Person: Alex     │
│    Phone: +60 11 XXX 5678   │
│                             │
│ [+ Add Contact]             │  (Action button)
├─────────────────────────────┤
│ 🏠  📊  📋  ⚙️              │  (Bottom navigation)
│ List Analytics Kanban Settings│
└─────────────────────────────┘
```

### Contact Card Details (List View)

**Display Elements**:
- Avatar (initials or photo) - color-coded
- First Name + Last Name (bold)
- Contact Type badge (customer, supplier, COI, internal)
- Current Stage badge (with stage color)
- Primary info: Phone 1 or Email
- Secondary info: Traffic source or Referred by
- Three-dot menu for quick actions (edit, delete, call, email)

---

## 2. Contact Detail Sidebar (Mobile)

### Full-Screen Detail View (Slides from right)

```
┌─────────────────────────────┐
│ ← Alexandra Tan      [⋯]    │  (Header with back & menu)
├─────────────────────────────┤
│                             │
│        AT                   │  (Large avatar - initials)
│     (initials style)        │
│                             │
│ Alexandra Tan               │  (Name)
│ Customer | Lead (blue badge)│
│ 📍 Assigned: John Doe       │
│ 🏢 Department: Sales        │
│ 🌐 Traffic: LinkedIn        │
│ 🔗 Referred by: Mark Wilson │
│                             │
├─────────────────────────────┤
│ 📋 CONTACT INFORMATION      │
│                             │
│ Phone 1:  +60 12 1234 5678  │
│ Phone 2:  +60 11 8765 4321  │
│ Email:    alex@email.com    │
│ Gender:   Female            │
│                             │
│ 🏢 COMPANY INFO             │
│ Company:  Tech Solutions    │
│ Entity:   Company           │
│ Contact Person: Sandra      │
│ Person Phone: +60 12 XXX    │
│                             │
│ 📍 ADDRESS                  │
│ Line 1:   123 Business Ave  │
│ Line 2:   Suite 456         │
│ City:     Kuala Lumpur      │
│ State:    Selangor          │
│ Postal:   50000             │
│                             │
│ 📝 NOTES                    │
│ [Notes text area...]        │
│                             │
│ 📅 ACTIVITY                 │
│ Last contact: Nov 18, 2 days│
│ Last activity: Call         │
│                             │
│ [Edit] [Delete] [Archive]   │  (Action buttons)
├─────────────────────────────┤
│ Recent Activities:          │
│ ─────────────────           │
│ ☎️  Call - Nov 18, 10:30 AM │
│ 📝 Note - Nov 16, 3:45 PM   │
│ 📧 Email - Nov 14, 9:00 AM  │
└─────────────────────────────┘
```

---

## 3. Contact Form (Create/Edit) - Mobile

### Multi-Step Form with Sections

**Step 1: Basic Information**
```
┌─────────────────────────────┐
│ ← Create Contact   [Save]   │  (Header)
├─────────────────────────────┤
│                             │
│ 📸 [Avatar Upload]          │  (Avatar upload)
│                             │
│ Contact Type: [▾ Customer]  │  (Dropdown)
│                             │
│ * First Name                │  (Required fields marked with *)
│ [________________]          │
│                             │
│ * Last Name                 │
│ [________________]          │
│                             │
│ Gender: [▾ Select...]       │  (Dropdown)
│                             │
│ * Phone 1                   │
│ [________________]          │
│                             │
│ Phone 2 (optional)          │
│ [________________]          │
│                             │
│ Email (optional)            │
│ [________________]          │
│                             │
│ [Next: Company Info]        │  (Navigation)
└─────────────────────────────┘
```

**Step 2: Company Information**
```
┌─────────────────────────────┐
│ ← Create Contact   [Save]   │
├─────────────────────────────┤
│                             │
│ * Entity Type:              │
│ ◯ Individual  ◉ Company    │  (Radio buttons)
│                             │
│ Company Name (if Company):  │
│ [________________]          │
│                             │
│ Industry (optional):        │
│ [________________]          │
│                             │
│ Contact Person Name:        │
│ [________________]          │
│                             │
│ Contact Person Phone:       │
│ [________________]          │
│                             │
│ [Next: Address & Details]   │
└─────────────────────────────┘
```

**Step 3: Address & Assignment**
```
┌─────────────────────────────┐
│ ← Create Contact   [Save]   │
├─────────────────────────────┤
│                             │
│ Address Line 1:             │
│ [________________]          │
│                             │
│ Address Line 2:             │
│ [________________]          │
│                             │
│ City:                       │
│ [________________]          │
│                             │
│ State:                      │
│ [________________]          │
│                             │
│ Postal Code:                │
│ [________________]          │
│                             │
│ * Traffic Source:           │
│ [▾ Select Channel]          │  (Dropdown with custom channels)
│                             │
│ Department:                 │
│ [▾ Sales]                   │  (Dropdown)
│                             │
│ Assigned To:                │
│ [▾ Select Sales Rep]        │
│                             │
│ * Current Stage:            │
│ [▾ Lead]                    │  (Dropdown - custom stages)
│                             │
│ Referred By:                │
│ [🔍 Search Contacts...]     │  (Autocomplete)
│                             │
│ [Save Contact]              │
└─────────────────────────────┘
```

---

## 4. Pipeline Kanban View (Mobile)

### Horizontal Scroll (Optimized for Mobile)

```
┌─────────────────────────────┐
│ 📊 Pipeline        [⊕]      │  (Header with add)
├─────────────────────────────┤
│ Lead │ Prospect │ Appt...   │  (Stage headers - scroll horizontal)
│ ←─────────────────────────→│
│      │          │          │
│ [AT] │ [JD]     │ [CX]    │
│ Alex │ John     │ Company │
│      │          │          │
│ [SG] │ [MJ]     │          │
│ Sarah│ Michael  │          │
│      │          │          │
│ [LC] │          │          │
│ Lisa │          │          │
│      │          │          │
└─────────────────────────────┘
```

### Full-Screen Kanban (Landscape or Tab)

```
┌─────────────────────────────────────────────────┐
│ Lead (3)    │ Prospect (2) │ Appt (1) │ Won (0) │
├─────────────┼──────────────┼──────────┼─────────┤
│ [AT]        │ [JD]         │ [CX]     │         │
│ Alexandra T │ John Doe     │ Company  │         │
│             │              │ XYZ      │         │
│             │ [MJ]         │          │         │
│             │ Michael J    │          │         │
│             │              │          │         │
│ [SG]        │              │          │         │
│ Sarah G     │              │          │         │
│             │              │          │         │
│ [LC]        │              │          │         │
│ Lisa Chen   │              │          │         │
└─────────────┴──────────────┴──────────┴─────────┘
```

**Card Details in Kanban**:
- Avatar (initials)
- Contact name
- Three-dot menu (edit, delete, call, email)
- Drag-to-move indicator

---

## 5. Dashboard View (Mobile)

### Swipeable Metric Cards

```
┌─────────────────────────────┐
│ 📊 Dashboard       [⚙️]     │  (Header with settings)
├─────────────────────────────┤
│                             │
│ 📈 PIPELINE METRICS         │  (Swipe left/right)
│ ─────────────────           │
│ Total Leads: 45             │
│ Lead → Prospect: 8 days     │
│ Prospect → Appt: 5 days     │
│ Appt → Won: 3 days          │
│                             │
│ [← Swipe →]                 │
│                             │
│ 👥 SALES REP PERFORMANCE    │
│ ─────────────────           │
│ John Doe:                   │
│  Won: 12  Pending: 5        │
│ Sarah Wong:                 │
│  Won: 8   Pending: 3        │
│ Michael J:                  │
│  Won: 5   Pending: 4        │
│                             │
│ 🌐 TRAFFIC SOURCE ROI       │
│ ─────────────────           │
│ LinkedIn: 18 won, $120K     │
│ Referral: 10 won, $80K      │
│ Cold Call: 5 won, $30K      │
│ Events: 4 won, $35K         │
│                             │
│ 📅 ACTIVITY TRACKER         │
│ ─────────────────           │
│ This Week:                  │
│  Calls: 23                  │
│  Emails: 17                 │
│  Meetings: 5                │
│  Notes: 12                  │
│                             │
└─────────────────────────────┘
```

---

## 6. Search & Filter View (Mobile)

### Filter Panel (Bottom Sheet Modal)

```
┌─────────────────────────────┐
│ 🔍 [Search Contacts...]     │  (Sticky search bar)
├─────────────────────────────┤
│                             │
│ FILTERS                     │  (Expandable sections)
│                             │
│ ▼ Contact Type              │
│  ☑️ Customer                │
│  ☑️ Supplier                │
│  ☑️ COI                     │
│  ☑️ Internal                │
│                             │
│ ▼ Current Stage             │
│  ☑️ Lead                    │
│  ☑️ Prospect                │
│  ☑️ Appointment             │
│  ☑️ Nurture                 │
│  ☑️ Won                     │
│  ☑️ Lost                    │
│  ☑️ Cold                    │
│                             │
│ ▼ Department                │
│  ☑️ Sales                   │
│  ☑️ Customer Service        │
│  ☑️ Operations              │
│                             │
│ ▼ Traffic Source            │
│  ☑️ LinkedIn                │
│  ☑️ Referral                │
│  ☑️ Online Ads              │
│  ☑️ Cold Call               │
│  ☑️ Events                  │
│                             │
│ ▼ Assigned To               │
│  ☑️ John Doe                │
│  ☑️ Sarah Wong              │
│  ☑️ Michael J               │
│  (Unassigned)              │
│                             │
│ ▼ Date Range                │
│  ◯ Last 7 days              │
│  ◉ Last 30 days             │
│  ◯ Last 90 days             │
│  ◯ Custom                   │
│                             │
│ [Clear All] [Apply Filters] │
│                             │
└─────────────────────────────┘
```

---

## 7. Settings & Management Views (Mobile)

### Stage Manager

```
┌─────────────────────────────┐
│ ⚙️ Custom Stages  [+]       │  (Header with add)
├─────────────────────────────┤
│                             │
│ 🔄 Drag to reorder          │
│                             │
│ ≡ Lead            ⋯         │  (Drag handle)
│   Color: Blue               │
│                             │
│ ≡ Prospect        ⋯         │
│   Color: Purple             │
│                             │
│ ≡ Appointment     ⋯         │
│   Color: Green              │
│                             │
│ ≡ Nurture         ⋯         │
│   Color: Yellow             │
│                             │
│ ≡ Won             ⋯         │
│   Color: Success Green      │
│                             │
│ ≡ Lost            ⋯         │
│   Color: Red                │
│                             │
│ ≡ Cold            ⋯         │
│   Color: Gray               │
│                             │
│ [+ Add Custom Stage]        │
│                             │
└─────────────────────────────┘
```

### Traffic Channel Manager

```
┌─────────────────────────────┐
│ 🌐 Traffic Channels [+]     │
├─────────────────────────────┤
│                             │
│ ☑️ LinkedIn                 │  (Enabled)
│ ☑️ Referral                 │
│ ☑️ Online Ads               │
│ ☑️ Cold Call                │
│ ☑️ Events                   │
│ ☑️ Email Marketing          │
│ ☑️ Direct Contact           │
│ ☑️ Phone Call               │
│ ☑️ Website                  │
│                             │
│ [+ Add Custom Channel]      │
│                             │
└─────────────────────────────┘
```

---

## 8. Mobile-Specific Design Patterns

### Touch & Interaction:
- **Bottom navigation**: Persistent across all views
- **Floating Action Button**: Add contact button (always accessible)
- **Swipe actions**: Left swipe for edit, right swipe for delete/archive
- **Long press**: Open context menu with quick actions
- **Pull-to-refresh**: Refresh contact list

### Responsive Breakpoints:
- **Mobile (375px-599px)**: Full-screen list, sheet modals, bottom navigation
- **Tablet (600px-1024px)**: Split view (list + detail), horizontal kanban
- **Desktop (1025px+)**: Full layout with sidebar navigation

### Color-Coding System:
- **Contact Types**: Customer (blue), Supplier (orange), COI (purple), Internal (green)
- **Stages**: Lead (blue), Prospect (purple), Appt (cyan), Nurture (yellow), Won (green), Lost (red), Cold (gray)
- **Traffic Sources**: LinkedIn (blue), Referral (green), Events (orange), etc.

### Accessibility:
- Minimum touch target: 48x48px
- High contrast text (WCAG AA)
- Clear focus indicators
- Screen reader support (aria labels)
- Mobile font sizes (16px minimum for inputs)

---

## 9. Empty States & Loading

### Empty Contact List

```
┌─────────────────────────────┐
│ 📇 No Contacts Yet          │
│                             │
│ Start by adding your first  │
│ contact to get started.     │
│                             │
│ [+ Add First Contact]       │
│                             │
└─────────────────────────────┘
```

### Loading State

```
┌─────────────────────────────┐
│ ⟳ Loading Contacts...       │
│                             │
│ ▒▒▒ (skeleton loaders)      │
│ ▒▒▒                         │
│ ▒▒▒                         │
│                             │
└─────────────────────────────┘
```

---

## 10. Bottom Navigation Structure

```
┌─────────────────────────────┐
│ 🏠  📊  📋  ⚙️              │
│ Dashboard                   │
│ (0 = home, 1 = analytics)   │
│ (2 = kanban, 3 = settings)  │
└─────────────────────────────┘
```

**Routes**:
- Tab 0: `/tools/mingdan/` (Contact List - default)
- Tab 1: `/tools/mingdan/dashboard` (Analytics)
- Tab 2: `/tools/mingdan/kanban` (Pipeline Board)
- Tab 3: `/tools/mingdan/settings` (Settings)

---

## Implementation Notes

1. **Mobile-First Approach**: Design starts at 375px, scales up responsively
2. **Gesture Support**: Swipe, drag, long-press for common actions
3. **Keyboard Dismissal**: Auto-dismiss keyboard when scrolling
4. **Native-Like Feel**: Momentum scrolling, smooth transitions
5. **Offline Support**: Cache contacts for offline access (Phase 2)
6. **Accessibility**: WCAG 2.1 AA compliance required
7. **Performance**: Lazy loading for lists, pagination at 50 items per page

---

**Status**: Ready for implementation
**Next Step**: Create React component skeleton structure
