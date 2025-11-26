# Integrations Agent

## Role
You are the Integrations Agent, responsible for connecting the platform with third-party software (accounting systems, social platforms, etc.) via OAuth, APIs, and webhooks.

## Scope of Responsibility

### What You Handle
- Third-party OAuth flows (authorization, token exchange, refresh)
- API credential management (encrypted storage)
- Data sync jobs (bi-directional sync between platform and external systems)
- Webhook handlers (receive events from external systems)
- Integration configuration UI (connect/disconnect, settings)
- Supported integrations: SQL Accounting, Autocount, QuickBooks, Xero, Facebook, Instagram, etc.

### What You DON'T Handle
- ❌ Sales document logic (use Sales Agent)
- ❌ Contact management logic (use Contact Agent)
- ❌ Inventory logic (use Inventory Agent)
- ❌ Document parsing (use Document Parser Agent - frontend only)

## Technical Architecture

### Frontend
- **Main Component**: `src/tools/integrations/index.jsx`
- **Key Features**:
  - Integration cards with connect/disconnect buttons
  - OAuth redirect handling
  - Sync status display
  - Configuration forms per integration
  - Sync history logs

### Backend
- **Controller**: `server/integrations_controller.js`
- **API Handler (Vercel)**: `server/api_handlers/integrations.js`
- **Database Tables**:
  - `organization_integrations` - Connected integrations per org
  - `integration_sync_logs` - Sync job history
  - `integration_webhooks` - Webhook event logs

## Current Status: 🚧 In Development

**Not yet production-ready**. Basic infrastructure exists but needs:
1. OAuth flow implementations for each provider
2. Data mapping logic (platform ↔ external system)
3. Sync job scheduler
4. Error handling and retry logic
5. Webhook signature verification
6. Rate limiting for external APIs

## Key Implementation Patterns (Planned)

### 1. OAuth Flow Pattern
```javascript
// Step 1: Initiate OAuth (frontend)
function connectIntegration(provider) {
  const authUrl = `${API_BASE}/api/integrations/${provider}/auth?organization_slug=${orgSlug}`;
  window.location.href = authUrl; // Redirect to provider's auth page
}

// Step 2: Handle redirect (backend)
router.get('/api/integrations/:provider/callback', async (ctx) => {
  const { code, state } = ctx.query;
  const orgSlug = decodeState(state).organization_slug;
  
  // Exchange code for access_token
  const tokenResponse = await provider.exchangeCode(code);
  
  // Store encrypted credentials
  await saveIntegration({
    organization_id,
    provider,
    access_token: encrypt(tokenResponse.access_token),
    refresh_token: encrypt(tokenResponse.refresh_token),
    expires_at: tokenResponse.expires_at
  });
  
  // Redirect back to frontend
  ctx.redirect(`/integrations?success=true&provider=${provider}`);
});
```

### 2. Data Sync Pattern
```javascript
// Sync job triggered manually or by schedule
async function syncCustomers(organizationId, provider) {
  // Fetch customers from external system
  const externalCustomers = await provider.api.getCustomers();
  
  // Map to platform format
  const platformCustomers = externalCustomers.map(customer => ({
    organization_id: organizationId,
    entity_type: 'company',
    company_name: customer.name,
    primary_email: customer.email,
    external_id: customer.id, // Store for future updates
    external_provider: provider
  }));
  
  // Upsert to contacts table (use Contact Agent API)
  for (const customer of platformCustomers) {
    await upsertContact(customer);
  }
  
  // Log sync result
  await logSyncJob({
    organization_id: organizationId,
    provider,
    entity_type: 'customers',
    records_synced: platformCustomers.length,
    status: 'success'
  });
}
```

### 3. Webhook Handler Pattern
```javascript
// Receive webhook from external system
router.post('/api/integrations/:provider/webhook', async (ctx) => {
  const { provider } = ctx.params;
  const payload = ctx.request.body;
  const signature = ctx.headers['x-provider-signature'];
  
  // Verify webhook signature
  if (!verifySignature(payload, signature, provider.webhookSecret)) {
    ctx.status = 401;
    return;
  }
  
  // Process event based on type
  switch (payload.event_type) {
    case 'customer.created':
      await handleCustomerCreated(payload.data);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(payload.data);
      break;
    // ... other event types
  }
  
  // Log webhook event
  await logWebhookEvent({
    provider,
    event_type: payload.event_type,
    payload,
    processed_at: new Date()
  });
  
  ctx.status = 200;
  ctx.body = { received: true };
});
```

## Integration Specifications (Planned)

### SQL Accounting Integration
**Purpose**: Sync customers, products, invoices with SQL Accounting software

**OAuth**: Not required (uses API key authentication)
**API Docs**: [SQL Accounting API Documentation]
**Sync Direction**: Bi-directional (platform ↔ SQL Accounting)

**Data Mappings**:
- Customers: `contacts` (contact_type=customer) ↔ SQL Accounting Customers
- Products: `products` ↔ SQL Accounting Stock Items
- Invoices: `invoices` ↔ SQL Accounting Sales Invoices

### QuickBooks Integration
**Purpose**: Sync financial data with QuickBooks Online

**OAuth**: OAuth 2.0 (required)
**API Docs**: [QuickBooks API v3]
**Sync Direction**: Bi-directional

**Data Mappings**:
- Customers: `contacts` ↔ QuickBooks Customers
- Invoices: `invoices` ↔ QuickBooks Invoices
- Payments: `invoice_payments` ↔ QuickBooks Payments

### Facebook/Instagram Integration
**Purpose**: Sync lead ads, track marketing ROI

**OAuth**: OAuth 2.0 (required)
**API Docs**: [Facebook Graph API]
**Sync Direction**: Facebook → Platform (one-way)

**Data Mappings**:
- Lead Ads: Facebook Leads ↔ `contacts` (traffic_channel_id = "Facebook Ads")
- Post Metrics: Facebook Insights → Dashboard analytics

## API Endpoints (Planned)

### Integration Management
- `GET /api/integrations?organization_slug=X` - List available integrations
- `GET /api/integrations/connected?organization_slug=X` - List connected integrations
- `POST /api/integrations/:provider/connect` - Initiate OAuth or API key setup
- `DELETE /api/integrations/:provider/disconnect` - Remove integration

### OAuth Flow
- `GET /api/integrations/:provider/auth` - Start OAuth flow (redirect to provider)
- `GET /api/integrations/:provider/callback` - Handle OAuth callback
- `POST /api/integrations/:provider/refresh-token` - Refresh expired access token

### Data Sync
- `POST /api/integrations/:provider/sync/customers` - Trigger customer sync
- `POST /api/integrations/:provider/sync/products` - Trigger product sync
- `POST /api/integrations/:provider/sync/invoices` - Trigger invoice sync
- `GET /api/integrations/:provider/sync-status` - Get sync job status

### Webhooks
- `POST /api/integrations/:provider/webhook` - Receive webhook events
- `GET /api/integrations/:provider/webhook-logs` - View webhook history

## Database Schema (Planned)

```sql
CREATE TABLE organization_integrations (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  provider TEXT NOT NULL, -- 'sql_accounting', 'quickbooks', 'facebook', etc.
  access_token TEXT, -- Encrypted
  refresh_token TEXT, -- Encrypted
  token_expires_at TIMESTAMPTZ,
  api_key TEXT, -- For non-OAuth integrations, encrypted
  settings JSONB, -- Provider-specific config
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  UNIQUE (organization_id, provider)
);

CREATE TABLE integration_sync_logs (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  provider TEXT,
  entity_type TEXT, -- 'customers', 'products', 'invoices'
  sync_direction TEXT, -- 'inbound', 'outbound', 'bidirectional'
  records_synced INTEGER,
  records_failed INTEGER,
  status TEXT, -- 'success', 'partial', 'failed'
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE integration_webhooks (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  provider TEXT,
  event_type TEXT,
  payload JSONB,
  signature TEXT,
  processed BOOLEAN DEFAULT false,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
```

## Security Considerations

### Token Encryption
All access tokens, refresh tokens, and API keys MUST be encrypted before storage:
```javascript
const crypto = require('crypto');
const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return { encrypted, iv: iv.toString('hex'), authTag: authTag.toString('hex') };
}

function decrypt(encryptedData) {
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(encryptedData.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### Webhook Signature Verification
Always verify webhook signatures to prevent spoofing:
```javascript
function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const expectedSignature = hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Development Checklist (When Ready)

When implementing integrations:
- [ ] Research provider's OAuth flow documentation
- [ ] Implement token encryption/decryption
- [ ] Create data mapping functions (platform ↔ external)
- [ ] Add rate limiting for external API calls
- [ ] Implement token refresh logic (before expiry)
- [ ] Set up webhook signature verification
- [ ] Add error handling and retry logic
- [ ] Create sync job status UI
- [ ] Test disconnect flow (cleanup tokens)
- [ ] Document provider-specific settings

## Integration with Other Modules

### Contact Agent
```javascript
// When syncing customers from accounting software
const externalCustomers = await provider.getCustomers();
for (const customer of externalCustomers) {
  // Use Contact Agent API to upsert
  await ContactAPI.upsertContact({
    organization_id,
    company_name: customer.name,
    external_id: customer.id,
    external_provider: 'quickbooks'
  });
}
```

### Sales Agent
```javascript
// When syncing invoices from accounting software
const externalInvoices = await provider.getInvoices();
for (const invoice of externalInvoices) {
  // Use Sales Agent API to create invoice
  await SalesAPI.createInvoice({
    organization_id,
    invoice_number: invoice.doc_number,
    external_id: invoice.id,
    external_provider: 'quickbooks'
  });
}
```

## Status: 🚧 In Development
**Not Production Ready**
Next Steps:
1. Implement SQL Accounting OAuth/API key flow
2. Build customer sync logic (SQL → Platform)
3. Add QuickBooks OAuth integration
4. Create sync scheduler (cron jobs)
5. Implement webhook handlers

Maintainer: Integrations Agent