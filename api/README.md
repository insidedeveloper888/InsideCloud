# API Directory - Unified Serverless Function

## Overview

This directory contains a **unified serverless function** architecture to work within Vercel's Hobby plan limit of 12 serverless functions.

### Architecture

- **Single Deployment**: Only `[...path].js` is deployed as a serverless function
- **Modular Code**: Individual handler files (`get_user_access_token.js`, etc.) remain separate for maintainability
- **Internal Routing**: The unified handler dispatches requests to appropriate modules based on the URL path

### File Structure

```
api/
├── [...path].js              # ⚡ SINGLE SERVERLESS FUNCTION (deployed to Vercel)
├── _utils.js                 # Shared utilities (underscore prefix = not deployed)
├── _supabase_helper.js       # Supabase client (underscore prefix = not deployed)
│
├── handlers/                 # Handler modules subdirectory (not auto-deployed)
│   ├── get_user_access_token.js
│   ├── get_sign_parameters.js
│   ├── get_organization_config.js
│   ├── get_organization_members.js
│   ├── get_bitable_tables.js
│   ├── get_audit_logs.js
│   ├── get_supabase_members.js
│   ├── organization.js
│   ├── current_user.js
│   ├── strategic_map_v2.js
│   └── strategic_map_v2_batch.js
│
└── admin/                    # Admin endpoints subdirectory (not auto-deployed)
    └── organizations.js
```

**Important**: Files in subdirectories and files with underscore prefix are NOT deployed as serverless functions.

### Available Routes

All routes are handled by the single unified function:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/get_user_access_token` | GET | Get Lark user access token |
| `/api/get_sign_parameters` | GET | Get Lark JSAPI signature |
| `/api/get_organization_config` | GET | Get organization configuration |
| `/api/get_organization_members` | GET | Get organization members |
| `/api/get_bitable_tables` | GET | Get Lark Bitable tables |
| `/api/get_audit_logs` | GET | Get audit logs |
| `/api/get_supabase_members` | GET | Get Supabase members |
| `/api/organization` | GET | Get organization by slug |
| `/api/current_user` | GET | Get current user info |
| `/api/strategic_map_v2` | GET/POST/PUT/DELETE | Strategic map CRUD |
| `/api/strategic_map_v2/batch` | POST | Batch create strategic map items |
| `/api/admin/organizations` | GET/POST | Admin: manage organizations |

### Adding New Endpoints

To add a new endpoint:

1. Create a new handler file (e.g., `my_new_endpoint.js`)
2. Export a function that accepts `(req, res)` parameters
3. Add the route to `[...path].js`:

```javascript
const myNewEndpoint = require('./my_new_endpoint');

const routes = {
  // ... existing routes
  '/api/my_new_endpoint': myNewEndpoint,
};
```

### Development vs Production

- **Development (Koa)**: Routes are handled by `server/server.js`
- **Production (Vercel)**: Routes are handled by `api/[...path].js`

Both use the same handler code, ensuring consistency.

### Benefits

✅ **Function Count**: 1 function instead of 11+
✅ **Modular Code**: Each endpoint still has its own file
✅ **Maintainability**: Easy to add/modify endpoints
✅ **Vercel Compatibility**: Works within Hobby plan limits

### Troubleshooting

**Issue**: 404 errors on deployed Vercel app
**Solution**: Check that the route is registered in `[...path].js` routes map

**Issue**: Function not found during build
**Solution**: Ensure `vercel.json` points to `api/[...path].js`

**Issue**: New endpoint not working
**Solution**: Add the route to both `api/[...path].js` AND `server/server.js`
