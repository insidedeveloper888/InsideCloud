# InsideCloud Design System

**Version**: 1.0
**Last Updated**: 2025-11-14
**Framework**: Tailwind CSS 3.4 + shadcn/ui

---

## Overview

This design system defines the visual language and component standards for InsideCloud. It ensures consistency across all tools and provides guidelines for designers and developers.

---

## Color Palette

### Primary Colors (Lark Brand)

```css
/* Primary Blue - Lark brand color */
primary-50:  #e3f2fd
primary-100: #bbdefb
primary-500: #0C6DCD  /* Main brand color */
primary-700: #084891
primary-900: #05325e
```

**Usage**:
- Primary actions (Save, Submit, Confirm)
- Links and interactive elements
- Active states and selections
- Brand elements

**Examples**:
```jsx
<Button className="bg-primary-500 text-white hover:bg-primary-700">
  Save Changes
</Button>

<a className="text-primary-500 hover:underline">Learn More</a>
```

---

### Secondary Colors

```css
/* Purple Accent */
secondary-500: #a855f7
secondary-600: #9333ea
```

**Usage**:
- Secondary actions
- Accent highlights
- Special features or premium indicators
- Decorative elements

**Examples**:
```jsx
<Badge className="bg-secondary-500 text-white">Premium</Badge>
```

---

### Semantic Colors

```css
/* Success */
success: #22c55e
success-light: #86efac
success-dark: #16a34a

/* Error/Destructive */
error: #ef4444
error-light: #fca5a5
error-dark: #dc2626

/* Warning */
warning: #f59e0b
warning-light: #fbbf24
warning-dark: #d97706

/* Info */
info: #3b82f6
info-light: #93c5fd
info-dark: #2563eb
```

**Usage**:
- Success: Confirmations, successful operations
- Error: Validation errors, failed operations, destructive actions
- Warning: Cautions, important notices
- Info: Informational messages, tips

**Examples**:
```jsx
<Alert className="bg-success text-white">
  Profile updated successfully!
</Alert>

<Button variant="destructive" className="bg-error hover:bg-error-dark">
  Delete Account
</Button>
```

---

### Neutral/Gray Scale

```css
/* Neutrals */
neutral-50:  #f9fafb  /* Lightest background */
neutral-100: #f3f4f6  /* Light background */
neutral-200: #e5e7eb  /* Borders, dividers */
neutral-300: #d1d5db  /* Disabled states */
neutral-400: #9ca3af  /* Placeholder text */
neutral-500: #6b7280  /* Secondary text */
neutral-600: #4b5563  /* Body text */
neutral-700: #374151  /* Headings */
neutral-800: #1f2937  /* Dark headings */
neutral-900: #111827  /* Darkest text */
```

**Usage**:
- neutral-50/100: Page backgrounds, card backgrounds
- neutral-200/300: Borders, dividers, disabled states
- neutral-400/500: Secondary text, placeholders, icons
- neutral-600/700/800/900: Primary text, headings

**Examples**:
```jsx
<div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6">
  <h2 className="text-neutral-900 font-bold text-2xl">Heading</h2>
  <p className="text-neutral-600">Body text</p>
  <p className="text-neutral-500 text-sm">Secondary text</p>
</div>
```

---

## Typography

### Font Families

```css
/* Primary Font */
font-inter: 'Inter', sans-serif

/* Headings (Optional) */
font-space: 'Space Grotesk', sans-serif

/* Code */
font-mono: 'Space Mono', monospace
```

**Configuration** (tailwind.config.js):
```javascript
fontFamily: {
  'space': ['Space Grotesk', 'sans-serif'],
  'inter': ['Inter', 'sans-serif'],
  'mono': ['Space Mono', 'monospace'],
}
```

---

### Type Scale

| Class | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-xs` | 12px | 16px | 400 | Captions, labels |
| `text-sm` | 14px | 20px | 400 | Body text (small) |
| `text-base` | 16px | 24px | 400 | Body text (default) |
| `text-lg` | 18px | 28px | 400 | Large body text |
| `text-xl` | 20px | 28px | 600 | Small headings (h4) |
| `text-2xl` | 24px | 32px | 700 | Medium headings (h3) |
| `text-3xl` | 30px | 36px | 700 | Large headings (h2) |
| `text-4xl` | 36px | 40px | 800 | Extra large headings (h1) |

---

### Text Styles

**Headings**:
```jsx
<h1 className="text-4xl font-bold text-neutral-900">Page Title</h1>
<h2 className="text-3xl font-bold text-neutral-900">Section Title</h2>
<h3 className="text-2xl font-semibold text-neutral-800">Subsection</h3>
<h4 className="text-xl font-semibold text-neutral-800">Card Title</h4>
```

**Body Text**:
```jsx
<p className="text-base text-neutral-600">Default body text</p>
<p className="text-sm text-neutral-500">Secondary body text</p>
<p className="text-xs text-neutral-400">Caption or label</p>
```

**Code**:
```jsx
<code className="font-mono text-sm bg-neutral-100 px-2 py-1 rounded">
  npm install
</code>
```

---

## Spacing Scale

Tailwind uses a 4px base unit. Common spacings:

| Class | Size | Usage |
|-------|------|-------|
| `p-1`, `m-1` | 4px | Tight spacing |
| `p-2`, `m-2` | 8px | Small spacing |
| `p-3`, `m-3` | 12px | Medium-small |
| `p-4`, `m-4` | 16px | Default spacing |
| `p-6`, `m-6` | 24px | Medium spacing |
| `p-8`, `m-8` | 32px | Large spacing |
| `p-12`, `m-12` | 48px | Extra large |
| `p-16`, `m-16` | 64px | Maximum spacing |

**Examples**:
```jsx
<Card className="p-6">                    {/* 24px padding */}
  <h2 className="mb-4">Title</h2>         {/* 16px bottom margin */}
  <p className="mt-2">Text</p>            {/* 8px top margin */}
</Card>
```

---

## Border Radius

| Class | Size | Usage |
|-------|------|-------|
| `rounded` | 4px | Small elements (badges, tags) |
| `rounded-md` | 6px | Inputs, small buttons |
| `rounded-lg` | 8px | Default buttons, cards |
| `rounded-xl` | 12px | Large cards, modals |
| `rounded-2xl` | 16px | Feature cards |
| `rounded-3xl` | 24px | Hero cards, special elements |
| `rounded-full` | 9999px | Pills, avatars, circular buttons |

**Examples**:
```jsx
<Button className="rounded-lg">Default Button</Button>
<Card className="rounded-xl">Card</Card>
<Avatar className="rounded-full">JT</Avatar>
```

---

## Shadows

| Class | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | 0 1px 2px rgba(0,0,0,0.05) | Subtle elevation |
| `shadow` | 0 1px 3px rgba(0,0,0,0.1) | Default cards |
| `shadow-md` | 0 4px 6px rgba(0,0,0,0.1) | Elevated cards |
| `shadow-lg` | 0 10px 15px rgba(0,0,0,0.1) | Modals, popovers |
| `shadow-xl` | 0 20px 25px rgba(0,0,0,0.1) | Heavy elevation |

**Examples**:
```jsx
<Card className="shadow-sm hover:shadow-md transition-shadow">
  Hover to elevate
</Card>
```

---

## Components

### Button

**Variants**:

```jsx
// Primary (default)
<Button className="bg-primary-500 text-white hover:bg-primary-700">
  Primary Action
</Button>

// Secondary
<Button className="bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-neutral-300">
  Secondary Action
</Button>

// Destructive
<Button className="bg-error text-white hover:bg-red-600">
  Delete
</Button>

// Outline
<Button className="border border-primary-500 text-primary-500 hover:bg-primary-50">
  Outline
</Button>

// Ghost
<Button className="text-primary-500 hover:bg-primary-50">
  Ghost Button
</Button>
```

**Sizes**:
```jsx
<Button size="sm">Small</Button>      {/* h-8 px-3 text-xs */}
<Button size="default">Default</Button> {/* h-10 px-4 text-sm */}
<Button size="lg">Large</Button>      {/* h-12 px-8 text-base */}
```

---

### Card

```jsx
// Default card
<Card className="rounded-xl shadow-sm">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Interactive card (hover effect)
<Card className="rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
  <CardContent className="p-6">
    Click me!
  </CardContent>
</Card>

// Highlighted card
<Card className="rounded-xl border-2 border-primary-500 bg-primary-50">
  <CardContent className="p-6">
    Important card
  </CardContent>
</Card>
```

---

### Badge

```jsx
<Badge className="bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
  New
</Badge>

<Badge className="bg-success text-white px-3 py-1 rounded-full text-xs">
  Active
</Badge>

<Badge className="bg-neutral-200 text-neutral-700 px-3 py-1 rounded-full text-xs">
  Inactive
</Badge>
```

---

### Table

```jsx
<table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm">
  <thead>
    <tr className="bg-primary-500 text-white">
      <th className="px-4 py-3 text-left font-semibold">Name</th>
      <th className="px-4 py-3 text-left font-semibold">Status</th>
      <th className="px-4 py-3 text-left font-semibold">Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-neutral-200 hover:bg-neutral-50 transition-colors">
      <td className="px-4 py-3">Item 1</td>
      <td className="px-4 py-3">Active</td>
      <td className="px-4 py-3">
        <Button size="sm">Edit</Button>
      </td>
    </tr>
  </tbody>
</table>
```

---

### Form Inputs

```jsx
// Text input
<input
  type="text"
  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
  placeholder="Enter text..."
/>

// Select dropdown
<select className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none">
  <option>Option 1</option>
  <option>Option 2</option>
</select>

// Checkbox
<input
  type="checkbox"
  className="w-5 h-5 text-primary-500 border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
/>
```

---

### Alert/Message

```jsx
// Success
<div className="bg-success-light border border-success-dark text-success-dark px-4 py-3 rounded-lg">
  <strong>Success!</strong> Your changes have been saved.
</div>

// Error
<div className="bg-error-light border border-error-dark text-error-dark px-4 py-3 rounded-lg">
  <strong>Error!</strong> Something went wrong.
</div>

// Warning
<div className="bg-warning-light border border-warning-dark text-warning-dark px-4 py-3 rounded-lg">
  <strong>Warning!</strong> Please review before proceeding.
</div>

// Info
<div className="bg-info-light border border-info-dark text-info-dark px-4 py-3 rounded-lg">
  <strong>Info:</strong> This feature is in beta.
</div>
```

---

## Responsive Design

### Breakpoints

| Breakpoint | Size | Usage |
|------------|------|-------|
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large desktops |

### Responsive Patterns

**Grid Layout**:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</div>
```

**Responsive Padding**:
```jsx
<div className="px-4 md:px-6 lg:px-8">
  {/* Content adapts padding based on screen size */}
</div>
```

**Responsive Typography**:
```jsx
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>
```

**Responsive Visibility**:
```jsx
<div className="block md:hidden">Mobile only</div>
<div className="hidden md:block">Desktop only</div>
```

---

## Animations & Transitions

### Transition Classes

```jsx
// Smooth transitions
<Button className="transition-colors duration-300 hover:bg-primary-700">
  Hover me
</Button>

// Multiple properties
<Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
  Hover to elevate
</Card>

// Opacity transition
<div className="transition-opacity duration-200 hover:opacity-80">
  Fade on hover
</div>
```

### Custom Animations (tailwind.config.js)

```javascript
animation: {
  'float': 'float 6s ease-in-out infinite',
  'glow': 'glow 2s ease-in-out infinite alternate',
  'spin-slow': 'spin-slow 8s linear infinite',
},
keyframes: {
  float: {
    '0%, 100%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-20px)' },
  },
  glow: {
    '0%, 100%': { boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)' },
    '50%': { boxShadow: '0 0 40px rgba(34, 211, 238, 0.6)' },
  },
}
```

**Usage**:
```jsx
<div className="animate-float">Floating element</div>
<div className="animate-spin-slow">Slow spinning icon</div>
```

---

## Accessibility

### Focus States

Always include visible focus indicators:
```jsx
<Button className="focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none">
  Accessible Button
</Button>
```

### Color Contrast

Ensure minimum contrast ratios:
- **Normal text**: 4.5:1
- **Large text (18px+)**: 3:1
- **UI components**: 3:1

### Semantic HTML

Use proper semantic elements:
```jsx
<nav>Navigation</nav>
<main>Main content</main>
<article>Article content</article>
<button>Button (not <div onClick>)</button>
```

### ARIA Labels

Provide labels for screen readers:
```jsx
<button aria-label="Close dialog">
  <X size={20} />
</button>

<input aria-describedby="email-helper" />
<small id="email-helper">We'll never share your email</small>
```

---

## Best Practices

### Do's ✅

- Use Tailwind utility classes instead of custom CSS
- Follow the established color palette
- Use responsive design patterns
- Include focus states for all interactive elements
- Use semantic HTML elements
- Provide alt text for images
- Test on mobile, tablet, and desktop
- Use consistent spacing (multiples of 4px)

### Don'ts ❌

- Don't use inline styles
- Don't use arbitrary values unless absolutely necessary
- Don't ignore accessibility (keyboard nav, screen readers)
- Don't use low-contrast color combinations
- Don't mix Material-UI and Tailwind CSS
- Don't create custom CSS files for components

---

## Migration from Material-UI

When replacing Material-UI components:

| Material-UI | Tailwind + shadcn/ui |
|-------------|----------------------|
| `<Button variant="contained">` | `<Button className="bg-primary-500 text-white">` |
| `<Button variant="outlined">` | `<Button className="border border-primary-500 text-primary-500">` |
| `<Card>` | `<Card className="rounded-xl shadow-sm">` |
| `<Typography variant="h1">` | `<h1 className="text-4xl font-bold">` |
| `<Box sx={{ p: 2 }}>` | `<div className="p-2">` |
| `<Grid container spacing={2}>` | `<div className="grid gap-2">` |

---

## Resources

- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **shadcn/ui Components**: https://ui.shadcn.com
- **Color Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Tailwind CSS Cheat Sheet**: https://nerdcave.com/tailwind-cheat-sheet

---

**Document Status**: Living Document
**Review Frequency**: Quarterly or after major design updates
**Next Review**: 2026-02-14
