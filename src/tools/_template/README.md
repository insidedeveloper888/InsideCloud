# Tool Template

This is a template for creating new Lark integration tools in InsideCloud.

## How to Use This Template

### 1. Copy the Template
```bash
cp -r src/tools/_template src/tools/your-tool-name
```

### 2. Update the Component
Edit `src/tools/your-tool-name/index.jsx`:
- Replace `ToolTemplate` with your component name (PascalCase)
- Update the API endpoint (`/api/your_tool_endpoint`)
- Implement your tool's functionality
- Customize the UI

### 3. Create Backend API

**Vercel (Production):**
Create `api/your_tool_name.js`:
```javascript
const { getOrganizationBySlug } = require('../server/organization_helper');
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  const organizationSlug = req.query.organization_slug;

  // Validate organization
  const org = await getOrganizationBySlug(organizationSlug);
  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  // Your tool logic here
  const data = await yourToolLogic(org);

  res.json({ success: true, data });
};
```

**Koa (Development):**
Add route to `server/server.js`:
```javascript
router.get('/api/your_tool_endpoint', async (ctx) => {
  const organizationSlug = ctx.query.organization_slug;

  // Same logic as Vercel function
  const org = await getOrganizationBySlug(organizationSlug);
  if (!org) {
    ctx.status = 404;
    ctx.body = { error: 'Organization not found' };
    return;
  }

  // Your tool logic
  const data = await yourToolLogic(org);
  ctx.body = { success: true, data };
});
```

### 4. Add to Home Dashboard

Edit `src/pages/home/index.js`:

```javascript
// Import your tool
import YourToolName from '../../tools/your-tool-name';

// Add to view cases
const renderView = () => {
  switch (view) {
    case 'your_tool':
      return <YourToolName />;
    // ... other cases
  }
};

// Add card to dashboard
<Grid item xs={12} sm={6} md={4}>
  <Card
    className="cursor-pointer hover:shadow-lg transition-shadow"
    onClick={() => onNavigate('your_tool')}
  >
    <CardContent className="p-6 text-center">
      <div className="text-4xl mb-4">🔧</div>
      <h3 className="text-xl font-bold">Your Tool Name</h3>
      <p className="text-gray-600 mt-2">Tool description</p>
    </CardContent>
  </Card>
</Grid>
```

### 5. Create Documentation

Create `docs/tools/your-tool-name/README.md`:
```markdown
# Your Tool Name

## Purpose
What this tool does and why it's useful

## Features
- Feature 1
- Feature 2

## Technical Details
- Database tables used
- Lark API endpoints called
- Key algorithms/logic

## Usage
How to use from user perspective
```

### 6. Test Your Tool

```bash
npm run start
# Navigate to http://localhost:3000
# Select organization
# Click on your tool card
```

## Template Features

This template includes:

- ✅ Organization context integration
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Tailwind CSS styling
- ✅ shadcn/ui components
- ✅ API integration pattern
- ✅ JSDoc documentation

## Tool-Specific Customization

### Custom Components
Create in `components/`:
```javascript
// components/YourCustomComponent.jsx
import React from 'react';

export const YourCustomComponent = ({ data }) => {
  return <div>{/* Your component */}</div>;
};
```

### Custom Hooks
Create in `hooks/`:
```javascript
// hooks/useYourData.js
import { useState, useEffect } from 'react';

export const useYourData = (organizationSlug) => {
  const [data, setData] = useState([]);
  // Your hook logic
  return { data };
};
```

### Utilities
Create in `utils/`:
```javascript
// utils/helpers.js
export const formatData = (data) => {
  // Your utility function
  return formatted;
};
```

## Best Practices

1. **Follow naming conventions**: PascalCase for components, camelCase for utilities
2. **Use Tailwind CSS**: Avoid inline styles or CSS files
3. **Include JSDoc comments**: Document all functions and components
4. **Handle errors gracefully**: Show user-friendly error messages
5. **Test responsiveness**: Ensure mobile, tablet, desktop views work
6. **Validate organization context**: Always check `organizationSlug` exists
7. **Update both APIs**: Koa (dev) and Vercel (prod) should match

## Need Help?

- **Architecture Guide**: See [ARCHITECTURE.md](../../../ARCHITECTURE.md)
- **Design System**: See [docs/architecture/design-system.md](../../../docs/architecture/design-system.md)
- **Lark APIs**: See [docs/lark/lark-api-overview.md](../../../docs/lark/lark-api-overview.md)
