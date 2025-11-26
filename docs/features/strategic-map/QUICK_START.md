# Strategic Map v2 - Quick Start Guide

## TL;DR - What Just Happened?

Your Strategic Map tool now has a complete backend! Here's what was built:

✅ **Backend API** - 5 new endpoints for CRUD operations with auto-cascading
✅ **Frontend Dual-Mode** - Works with API or localStorage (your choice)
✅ **Migration Tool** - One-click migration from localStorage to database
✅ **Database Schema** - Complete PostgreSQL schema ready to deploy

---

## Quick Start (3 Steps)

### Step 1: Run Database Migration

Go to Supabase and run the SQL file:

1. **Open**: https://supabase.com/dashboard/project/rituzypqhjawhyrxoddj
2. **Navigate**: SQL Editor → New Query
3. **Copy/Paste**: `/supabase/migrations/0002_strategic_map_tables.sql`
4. **Run**: Click "Run" button

**Verification**:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('strategic_map_items', 'strategic_map_audit_log');
```
Should return 2 rows.

---

### Step 2: Test in LocalStorage Mode (Default)

No changes needed! Your app already works:

```bash
npm run start
```

Open Strategic Map tool:
- Should see blue badge: **"Local Storage Mode"**
- Create/edit/delete items as usual
- Data saved to browser localStorage

---

### Step 3: Enable API Mode (Optional)

Add to `.env`:
```bash
REACT_APP_USE_STRATEGIC_MAP_API=true
```

Restart:
```bash
npm run start
```

Open Strategic Map tool:
- Should see green badge: **"Database Mode"**
- Create item in Yearly view
- Check December column → Should see auto-cascaded item!

---

## What Changed?

### New Files Created
```
api/strategic_map_v2.js              # API endpoint handler
api/strategic_map_v2_batch.js        # Batch migration endpoint
server/strategic_map_controller.js   # Business logic
src/tools/strategic-map/api.js       # API client
src/tools/strategic-map/MigrationTool.jsx  # Migration UI
supabase/migrations/0002_strategic_map_tables.sql  # Database schema
```

### Updated Files
```
server/server.js                     # Added v2 routes
src/tools/strategic-map/index.jsx    # Now uses API client
```

### Nothing Broken
- Old v1 API still works
- LocalStorage mode still works (default)
- All existing data preserved

---

## API Endpoints

All routes use `/api/strategic_map_v2` prefix:

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `?organization_slug=xxx` | Fetch all items |
| POST | ` ` | Create new item |
| PUT | `?id=xxx` | Update item |
| DELETE | `?id=xxx&organization_slug=xxx` | Delete item |
| POST | `/batch` | Migrate multiple items |

**Auth**: Lark token via `Authorization: Bearer <token>` or `lk_token` cookie

---

## Migration Tool Usage

### Add to Your Admin Page

```jsx
import MigrationTool from './tools/strategic-map/MigrationTool';

function AdminPage() {
  const { currentOrgSlug } = useAuth(); // Your auth hook

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <MigrationTool organizationSlug={currentOrgSlug} />
    </div>
  );
}
```

### Migration Flow

1. User clicks **"Check Data in localStorage"**
2. Tool shows: "Found X items"
3. User clicks **"Start Migration"**
4. Tool shows progress
5. Success! Shows "Created X items"
6. Optionally clear localStorage

---

## Configuration

### Environment Variables

```bash
# .env file

# API Mode (default: false = localStorage only)
REACT_APP_USE_STRATEGIC_MAP_API=true

# API Base URL (default: empty = same origin)
REACT_APP_API_BASE=http://localhost:8989

# Supabase (already configured)
SUPABASE_URL=https://rituzypqhjawhyrxoddj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
```

---

## Testing

### Test Backend (Terminal)
```bash
# Create item
curl -X POST "http://localhost:8989/api/strategic_map_v2" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "organization_slug": "test",
    "text": "Test Goal",
    "timeframe": "yearly",
    "categoryIndex": 0,
    "yearIndex": 0
  }'

# Fetch items
curl "http://localhost:8989/api/strategic_map_v2?organization_slug=test"
```

### Test Frontend (Browser)
1. Open Strategic Map tool
2. Create item in Yearly view, row 0, column 0
3. Check Monthly view → December column
4. Should see cascaded item (blue background)
5. Edit yearly item → December should update too
6. Delete yearly item → December should delete too

---

## Troubleshooting

### "Loading..." forever
- Check browser console for errors
- Verify `REACT_APP_USE_STRATEGIC_MAP_API` is set correctly
- Check network tab for failed API calls

### "Authentication required" error
- Ensure you're logged in with Lark
- Check `lk_token` cookie exists
- Try clearing cookies and re-login

### Items not appearing
- Check organization_slug matches your current org
- Verify database migration ran successfully
- Check Supabase logs for errors

### Cascade not working
- Only Yearly → December is implemented
- Monthly → Weekly: Coming soon
- Weekly → Daily: Coming soon

---

## Performance Tips

### For Large Datasets
Use timeframe filter:
```javascript
// Only load yearly items
await StrategicMapAPI.loadItems(organizationSlug, 'yearly');
```

### For Offline Support
Keep localStorage mode:
```bash
REACT_APP_USE_STRATEGIC_MAP_API=false
```

### For Real-Time Sync
Coming soon! Will use Supabase Realtime subscriptions.

---

## Next Steps

1. ✅ Run database migration
2. ✅ Test in both modes
3. ✅ Migrate user data
4. ⏳ Implement Monthly → Weekly cascade
5. ⏳ Implement Weekly → Daily cascade
6. ⏳ Add real-time sync
7. ⏳ Add offline PWA support

---

## FAQ

**Q: Do I need to migrate right away?**
A: No! LocalStorage mode works perfectly. Migrate when ready.

**Q: Will my data be lost?**
A: No! Migration doesn't delete localStorage. Your data is safe.

**Q: Can I switch back to localStorage?**
A: Yes! Just set `REACT_APP_USE_STRATEGIC_MAP_API=false` and restart.

**Q: What if API is down?**
A: App automatically falls back to localStorage. No data loss.

**Q: Do I need to update Vercel config?**
A: Not yet. LocalStorage mode is default for production.

**Q: How do I deploy to production?**
1. Run migration in production Supabase
2. Set env var in Vercel: `REACT_APP_USE_STRATEGIC_MAP_API=true`
3. Deploy!

---

## Support

**Documentation**:
- [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) - Full details
- [migration-instructions.md](./migration-instructions.md) - Step-by-step guide
- [backend-integration-plan.md](./backend-integration-plan.md) - Original design

**Logs**:
- Backend: `npm run start:server` console
- Database: https://supabase.com/dashboard/project/rituzypqhjawhyrxoddj/logs
- Frontend: Browser DevTools console

---

**Status**: ✅ Ready to Use
**Risk Level**: 🟢 Low (localStorage fallback + no breaking changes)
**Estimated Setup Time**: ⏱️ 5-10 minutes
