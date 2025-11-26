# WhatsApp Integration Guide - Multi-Tenant Contact Management

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Prerequisites & Requirements](#prerequisites--requirements)
3. [Multi-Tenant Architecture](#multi-tenant-architecture)
4. [Database Schema](#database-schema)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Deployment Guide](#deployment-guide)
8. [Security & Best Practices](#security--best-practices)
9. [Scaling Strategies](#scaling-strategies)
10. [Testing Guide](#testing-guide)
11. [Troubleshooting](#troubleshooting)
12. [Cost Analysis](#cost-analysis)

---

## Executive Summary

### What is This Integration?

This integration enables automatic contact creation in your multi-tenant CRM when customers send WhatsApp messages to your organization's WhatsApp number. Using WAHA (WhatsApp HTTP API), each tenant organization can connect their own WhatsApp account and automatically capture leads.

### Key Features

- ✅ **Multi-Tenant Support**: Single WAHA container supports up to 500 organizations
- ✅ **Automatic Lead Creation**: Incoming messages create contacts as "Leads"
- ✅ **Activity Logging**: Full message history stored per contact
- ✅ **QR Code Authentication**: Simple WhatsApp Web-style connection
- ✅ **Session Isolation**: Each organization has independent WhatsApp connection
- ✅ **Production Ready**: Persistent sessions, auto-restart, HMAC security

### What is WAHA?

**WAHA (WhatsApp HTTP API)** is a self-hosted, open-source REST API that bridges applications with WhatsApp messaging platform. It runs as a Docker container and provides:

- HTTP API for sending/receiving messages
- Multi-session support (multiple WhatsApp accounts in one container)
- Webhook events for incoming messages
- QR code authentication (like WhatsApp Web)
- Media handling (images, documents, videos)

**Important Disclaimer**: WAHA is **not officially affiliated with Meta/WhatsApp**. Use at your own risk. For production-scale official integration, consider WhatsApp Business API or Twilio.

---

## Prerequisites & Requirements

### Infrastructure

1. **Docker** installed on server
2. **Public HTTPS domain** for webhook callbacks
3. **Server Resources**:
   - CPU: 2-4 cores
   - RAM: 4-8GB
   - Disk: 20GB+ (for media storage)
   - Network: Outbound HTTPS to WhatsApp servers

### Application Requirements

1. **Multi-tenant database** with organization isolation
2. **Contact management system** with phone number field
3. **Activity/message logging** capability
4. **Traffic channel** system for lead source tracking

### WhatsApp Requirements

Each tenant organization needs:
- **Dedicated WhatsApp phone number** (recommended, not personal)
- **WhatsApp mobile app** for QR code scanning
- **Active WhatsApp account**

### Optional but Recommended

- **WAHA Plus** (donation version) for session persistence
- **Nginx** reverse proxy for HTTPS/SSL
- **Monitoring** tools for session health checks
- **Separate WhatsApp Business numbers** per tenant

---

## Multi-Tenant Architecture

### Option 1: Single Container, Multiple Sessions (Recommended)

This is the recommended approach for SaaS applications with up to 500 tenants.

```
┌─────────────────────────────────────────────────────────┐
│            WAHA Container (Port 3000)                    │
│                                                          │
│  Session: "tenant-acme-corp"                             │
│  ├─ WhatsApp Account: +60123456789                       │
│  ├─ Status: WORKING                                      │
│  └─ Webhook: /api/whatsapp/webhook?org=acme-corp        │
│                                                          │
│  Session: "tenant-tech-startup"                          │
│  ├─ WhatsApp Account: +60198765432                       │
│  ├─ Status: WORKING                                      │
│  └─ Webhook: /api/whatsapp/webhook?org=tech-startup     │
│                                                          │
│  Session: "tenant-retail-shop"                           │
│  ├─ WhatsApp Account: +60111222333                       │
│  ├─ Status: SCAN_QR_CODE                                 │
│  └─ Webhook: /api/whatsapp/webhook?org=retail-shop      │
│                                                          │
│  ... up to 500 sessions (NOWEB/GOWS engine)              │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────────┐
        │   Your Application Server             │
        │                                       │
        │   /api/whatsapp/webhook               │
        │   ├─ Extract org from query param     │
        │   ├─ Validate organization exists     │
        │   ├─ Create contact in org DB         │
        │   └─ Log activity in org scope        │
        └──────────────────────────────────────┘
```

### How Session Naming Works

**Convention**: `tenant-{organizationSlug}`

Examples:
- Organization slug: `acme-corp` → Session name: `tenant-acme-corp`
- Organization slug: `my-company-123` → Session name: `tenant-my-company-123`

### Tenant Isolation

Each session is completely isolated:
- ✅ Separate WhatsApp authentication
- ✅ Separate message streams
- ✅ Separate webhook configurations
- ✅ Separate QR codes
- ✅ Independent connection status

### Webhook Identification

Two methods to identify which tenant a message belongs to:

**Method 1: Query Parameter** (Recommended)
```javascript
webhookUrl: `https://yourapp.com/api/whatsapp/webhook?org=${organizationSlug}`
```

**Method 2: Webhook Metadata**
```javascript
{
  config: {
    webhooks: [{
      url: 'https://yourapp.com/api/whatsapp/webhook',
      metadata: {
        organization_slug: organizationSlug,
        organization_id: organizationId
      }
    }]
  }
}
```

In webhook payload:
```javascript
{
  "session": "tenant-acme-corp",
  "metadata": {
    "organization_slug": "acme-corp",
    "organization_id": 123
  },
  "payload": { ... }
}
```

### Capacity Planning

| Engine | Sessions per Container | Recommended RAM | CPU Cores |
|--------|------------------------|-----------------|-----------|
| WEBJS  | ~50 sessions          | 4GB             | 2 cores   |
| NOWEB  | ~500 sessions         | 8GB             | 4 cores   |
| GOWS   | ~500+ sessions        | 8GB             | 4 cores   |

**Recommendation**: Use **NOWEB** or **GOWS** engine for multi-tenant SaaS.

---

## Database Schema

### Organizations Table Changes

Add WhatsApp-related columns to your `organizations` table:

```sql
-- Add WhatsApp integration fields
ALTER TABLE organizations
  ADD COLUMN whatsapp_session_name VARCHAR(255),
  ADD COLUMN whatsapp_status VARCHAR(50), -- STOPPED, STARTING, SCAN_QR_CODE, WORKING, FAILED
  ADD COLUMN whatsapp_phone_number VARCHAR(50),
  ADD COLUMN whatsapp_connected_at TIMESTAMP,
  ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT FALSE;

-- Add index for lookups
CREATE INDEX idx_organizations_whatsapp_session
  ON organizations(whatsapp_session_name);
```

### Contact Activities Table (New)

Create a new table for message/activity logging:

```sql
CREATE TABLE contact_activities (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  organization_slug VARCHAR(255) NOT NULL,
  activity_type VARCHAR(50) NOT NULL, -- 'whatsapp_message', 'note', 'call', 'email', 'meeting'
  direction VARCHAR(20), -- 'inbound', 'outbound', NULL for non-message types
  message_content TEXT,
  subject VARCHAR(255),
  metadata JSONB, -- Store additional data like media URLs, sender info, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_contact_activities_contact ON contact_activities(contact_id);
CREATE INDEX idx_contact_activities_org ON contact_activities(organization_slug);
CREATE INDEX idx_contact_activities_type ON contact_activities(activity_type);
CREATE INDEX idx_contact_activities_created ON contact_activities(created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_contact_activities_contact_created
  ON contact_activities(contact_id, created_at DESC);
```

### Example Data

**Organizations table:**
```
id  | slug          | whatsapp_session_name    | whatsapp_status | whatsapp_phone_number | whatsapp_enabled
----|---------------|--------------------------|-----------------|----------------------|------------------
1   | acme-corp     | tenant-acme-corp         | WORKING         | +60123456789         | true
2   | tech-startup  | tenant-tech-startup      | SCAN_QR_CODE    | NULL                 | true
3   | retail-shop   | NULL                     | NULL            | NULL                 | false
```

**Contact Activities table:**
```
id | contact_id | org_slug     | activity_type      | direction | message_content          | created_at
---|------------|--------------|-------------------|-----------|--------------------------|------------
1  | 42         | acme-corp    | whatsapp_message  | inbound   | Hi, interested in...     | 2024-01-15 10:30:00
2  | 42         | acme-corp    | whatsapp_message  | outbound  | Thanks! Let me help...   | 2024-01-15 10:35:00
3  | 42         | acme-corp    | note              | NULL      | Customer wants quote     | 2024-01-15 10:40:00
```

---

## Backend Implementation

### 1. Webhook Handler

Create `/server/api_handlers/whatsapp_webhook.js`:

```javascript
const { handleCors, failResponse, okResponse } = require('../../api/_utils');
const contactController = require('../contact_management_controller');
const crypto = require('crypto');

/**
 * WhatsApp Webhook Handler
 * Receives messages from WAHA and creates contacts/activities per organization
 */
module.exports = async function handler(req, res) {
  // Handle CORS preflight
  if (handleCors(req, res)) return;

  const method = req.method;
  const body = req.body || {};
  const query = req.query || {};

  console.log('📱 WhatsApp Webhook:', {
    method,
    event: body.event,
    session: body.session,
    from: body.payload?.from,
    org: query.org
  });

  // Only accept POST
  if (method !== 'POST') {
    return res.status(405).json(failResponse('Method not allowed'));
  }

  try {
    // Verify HMAC signature (if configured)
    const hmacSecret = process.env.WAHA_HMAC_SECRET;
    if (hmacSecret) {
      const signature = req.headers['x-webhook-hmac-signature'];
      const expectedSignature = crypto
        .createHmac('sha256', hmacSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('❌ Invalid HMAC signature');
        return res.status(401).json(failResponse('Invalid signature'));
      }
    }

    // Extract organization identifier
    const organizationSlug = query.org ||
                             body.metadata?.organization_slug ||
                             body.session?.replace('tenant-', '');

    if (!organizationSlug) {
      console.error('❌ No organization identifier in webhook');
      return res.status(400).json(failResponse('Missing organization identifier'));
    }

    // Verify organization exists and WhatsApp is enabled
    const organization = await getOrganization(organizationSlug);
    if (!organization || !organization.whatsapp_enabled) {
      console.error('❌ Organization not found or WhatsApp disabled:', organizationSlug);
      return res.status(404).json(failResponse('Organization not found'));
    }

    // Only process message events
    if (body.event !== 'message') {
      console.log('ℹ️ Ignoring non-message event:', body.event);
      return res.status(200).json(okResponse({ received: true }));
    }

    const payload = body.payload;

    // Ignore messages sent by us
    if (payload.fromMe) {
      console.log('ℹ️ Ignoring outbound message');
      return res.status(200).json(okResponse({ received: true }));
    }

    // Extract contact information
    const phoneNumber = payload.from.split('@')[0]; // "60199999999"
    const displayName = payload._data?.notifyName || 'WhatsApp Contact';
    const messageBody = payload.body || '';
    const messageTimestamp = payload.timestamp;

    // Parse name into first/last
    const { firstName, lastName } = parseContactName(displayName);

    console.log('📞 Processing message from:', phoneNumber, displayName);

    // Check if contact already exists by phone number
    const existingContact = await contactController.findContactByPhone(
      organizationSlug,
      phoneNumber
    );

    let contact;

    if (existingContact) {
      console.log('ℹ️ Contact exists:', existingContact.id);
      contact = existingContact;
    } else {
      // Get or create "WhatsApp" traffic channel
      const whatsappChannelId = await getWhatsAppChannelId(organizationSlug);

      // Create new contact as Lead
      contact = await contactController.createContactDirect(
        organizationSlug,
        {
          first_name: firstName,
          last_name: lastName,
          phone_1: `+${phoneNumber}`,
          contact_type: 'lead',
          traffic_source_id: whatsappChannelId,
          // Auto-detect state from country code if possible
          state: detectStateFromPhone(phoneNumber)
        }
      );

      console.log('✅ Created new contact:', contact.id);
    }

    // Log message as activity
    await contactController.createContactActivity(
      organizationSlug,
      contact.id,
      {
        activity_type: 'whatsapp_message',
        direction: 'inbound',
        message_content: messageBody,
        metadata: {
          whatsapp_message_id: payload.id,
          whatsapp_chat_id: payload.chatId,
          has_media: payload.hasMedia,
          media_url: payload.media?.url,
          timestamp: messageTimestamp,
          session: body.session
        }
      }
    );

    return res.status(200).json(okResponse({
      success: true,
      action: existingContact ? 'activity_logged' : 'contact_created',
      contactId: contact.id
    }));

  } catch (error) {
    console.error('❌ WhatsApp webhook error:', error);
    return res.status(500).json(failResponse(error.message));
  }
};

/**
 * Parse full name into first and last name
 */
function parseContactName(fullName) {
  const parts = (fullName || '').trim().split(' ');
  return {
    firstName: parts[0] || 'Unknown',
    lastName: parts.slice(1).join(' ') || ''
  };
}

/**
 * Detect Malaysian state from phone number
 * This is a basic implementation - you may want to use a lookup service
 */
function detectStateFromPhone(phoneNumber) {
  // Malaysia country code: 60
  if (!phoneNumber.startsWith('60')) return '';

  // Area code mapping (simplified example)
  const areaCodeMap = {
    '603': 'Selangor', // KL/Selangor
    '604': 'Penang',
    '605': 'Perak',
    '606': 'Melaka',
    '607': 'Johor',
    '608': 'Johor',
    '609': 'Terengganu/Pahang',
  };

  const areaCode = phoneNumber.substring(0, 3);
  return areaCodeMap[areaCode] || '';
}

/**
 * Get organization by slug
 */
async function getOrganization(slug) {
  // TODO: Implement based on your database layer
  // Example:
  // return await db.query('SELECT * FROM organizations WHERE slug = $1', [slug]);
  return null;
}

/**
 * Get or create "WhatsApp" traffic channel for organization
 */
async function getWhatsAppChannelId(organizationSlug) {
  // TODO: Implement channel creation/lookup
  // 1. Check if "WhatsApp" channel exists for this org
  // 2. If not, create it
  // 3. Return the channel ID
  return null;
}
```

### 2. Session Management API

Create `/server/api_handlers/whatsapp_session.js`:

```javascript
const { handleCors, failResponse, okResponse } = require('../../api/_utils');
const fetch = require('node-fetch');

const WAHA_URL = process.env.WAHA_URL || 'http://localhost:3000';
const WAHA_API_KEY = process.env.WAHA_API_KEY;

/**
 * WhatsApp Session Management
 * GET: Get session status
 * POST: Create/start session
 * DELETE: Stop/logout session
 */
module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  const method = req.method;
  const { organizationSlug } = req.query;

  if (!organizationSlug) {
    return res.status(400).json(failResponse('Missing organizationSlug'));
  }

  const sessionName = `tenant-${organizationSlug}`;

  try {
    switch (method) {
      case 'GET':
        // Get session status
        const statusResponse = await fetch(`${WAHA_URL}/api/sessions/${sessionName}`, {
          headers: { 'X-API-Key': WAHA_API_KEY }
        });

        if (statusResponse.status === 404) {
          return res.status(200).json(okResponse({
            exists: false,
            status: 'NOT_CREATED'
          }));
        }

        const statusData = await statusResponse.json();
        return res.status(200).json(okResponse(statusData));

      case 'POST':
        // Create and start session
        const createBody = {
          name: sessionName,
          config: {
            webhooks: [{
              url: `${process.env.APP_URL}/api/whatsapp/webhook?org=${organizationSlug}`,
              events: ['message'],
              hmac: {
                key: process.env.WAHA_HMAC_SECRET
              },
              metadata: {
                organization_slug: organizationSlug
              }
            }]
          }
        };

        const createResponse = await fetch(`${WAHA_URL}/api/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': WAHA_API_KEY
          },
          body: JSON.stringify(createBody)
        });

        if (!createResponse.ok) {
          throw new Error(`Failed to create session: ${createResponse.statusText}`);
        }

        // Start the session
        await fetch(`${WAHA_URL}/api/sessions/${sessionName}/start`, {
          method: 'POST',
          headers: { 'X-API-Key': WAHA_API_KEY }
        });

        // Update organization record
        await updateOrganizationWhatsAppStatus(organizationSlug, {
          whatsapp_session_name: sessionName,
          whatsapp_status: 'STARTING',
          whatsapp_enabled: true
        });

        return res.status(200).json(okResponse({
          success: true,
          sessionName
        }));

      case 'DELETE':
        // Stop/logout session
        await fetch(`${WAHA_URL}/api/sessions/${sessionName}/logout`, {
          method: 'POST',
          headers: { 'X-API-Key': WAHA_API_KEY }
        });

        // Update organization record
        await updateOrganizationWhatsAppStatus(organizationSlug, {
          whatsapp_status: 'STOPPED',
          whatsapp_phone_number: null,
          whatsapp_connected_at: null
        });

        return res.status(200).json(okResponse({ success: true }));

      default:
        return res.status(405).json(failResponse('Method not allowed'));
    }
  } catch (error) {
    console.error('Session management error:', error);
    return res.status(500).json(failResponse(error.message));
  }
};

async function updateOrganizationWhatsAppStatus(slug, updates) {
  // TODO: Implement database update
  // Example:
  // await db.query('UPDATE organizations SET ... WHERE slug = $1', [slug]);
}
```

### 3. QR Code Endpoint

Create `/server/api_handlers/whatsapp_qr.js`:

```javascript
const { handleCors, failResponse, okResponse } = require('../../api/_utils');
const fetch = require('node-fetch');

const WAHA_URL = process.env.WAHA_URL || 'http://localhost:3000';
const WAHA_API_KEY = process.env.WAHA_API_KEY;

/**
 * Get QR Code for WhatsApp authentication
 */
module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  const { organizationSlug } = req.query;

  if (!organizationSlug) {
    return res.status(400).json(failResponse('Missing organizationSlug'));
  }

  const sessionName = `tenant-${organizationSlug}`;

  try {
    const response = await fetch(`${WAHA_URL}/api/${sessionName}/auth/qr`, {
      headers: {
        'Accept': 'application/json',
        'X-API-Key': WAHA_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get QR code: ${response.statusText}`);
    }

    const data = await response.json();
    return res.status(200).json(okResponse(data));

  } catch (error) {
    console.error('QR code error:', error);
    return res.status(500).json(failResponse(error.message));
  }
};
```

### 4. Contact Controller Extensions

Add to `/server/contact_management_controller.js`:

```javascript
/**
 * Find contact by phone number
 */
async function findContactByPhone(organizationSlug, phoneNumber) {
  // Normalize phone number (remove +, spaces, etc.)
  const normalized = phoneNumber.replace(/[^0-9]/g, '');

  // Query contacts by phone_1, phone_2, or phone_3
  const query = `
    SELECT * FROM contacts
    WHERE organization_slug = $1
    AND (
      REPLACE(REPLACE(phone_1, '+', ''), ' ', '') = $2 OR
      REPLACE(REPLACE(phone_2, '+', ''), ' ', '') = $2 OR
      REPLACE(REPLACE(phone_3, '+', ''), ' ', '') = $2
    )
    LIMIT 1
  `;

  const result = await db.query(query, [organizationSlug, normalized]);
  return result.rows[0] || null;
}

/**
 * Create contact activity
 */
async function createContactActivity(organizationSlug, contactId, activityData) {
  const query = `
    INSERT INTO contact_activities (
      contact_id,
      organization_slug,
      activity_type,
      direction,
      message_content,
      subject,
      metadata,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING *
  `;

  const values = [
    contactId,
    organizationSlug,
    activityData.activity_type,
    activityData.direction || null,
    activityData.message_content || null,
    activityData.subject || null,
    JSON.stringify(activityData.metadata || {})
  ];

  const result = await db.query(query, values);
  return result.rows[0];
}

/**
 * Get contact activities
 */
async function getContactActivities(organizationSlug, contactId, options = {}) {
  const {
    activityType = null,
    limit = 50,
    offset = 0
  } = options;

  let query = `
    SELECT * FROM contact_activities
    WHERE organization_slug = $1 AND contact_id = $2
  `;

  const values = [organizationSlug, contactId];

  if (activityType) {
    query += ` AND activity_type = $3`;
    values.push(activityType);
  }

  query += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(limit, offset);

  const result = await db.query(query, values);
  return result.rows;
}

module.exports = {
  // ... existing exports
  findContactByPhone,
  createContactActivity,
  getContactActivities
};
```

### 5. API Route Configuration

Update `/api/[...path].js` to add WhatsApp routes:

```javascript
// Add to route mapping
const routeMap = {
  // ... existing routes
  '/api/whatsapp/webhook': require('../server/api_handlers/whatsapp_webhook'),
  '/api/whatsapp/session': require('../server/api_handlers/whatsapp_session'),
  '/api/whatsapp/qr': require('../server/api_handlers/whatsapp_qr'),
};
```

---

## Frontend Implementation

### 1. WhatsApp Settings Component

Create `/src/tools/contact-management/components/WhatsAppSettings.jsx`:

```javascript
import React, { useState, useEffect } from 'react';
import { Loader2, Check, AlertCircle, Smartphone } from 'lucide-react';

export default function WhatsAppSettings({ organizationSlug }) {
  const [sessionStatus, setSessionStatus] = useState('UNKNOWN');
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);

  // Fetch session status
  const fetchStatus = async () => {
    try {
      const response = await fetch(
        `/api/whatsapp/session?organizationSlug=${organizationSlug}`
      );

      if (response.ok) {
        const data = await response.json();
        const status = data.data?.status || data.data?.status || 'STOPPED';
        setSessionStatus(status);

        // If waiting for QR, fetch it
        if (status === 'SCAN_QR_CODE') {
          await fetchQRCode();
        } else if (status === 'WORKING') {
          setQrCode(null);
        }

        return status;
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setError(err.message);
    }
  };

  // Fetch QR code
  const fetchQRCode = async () => {
    try {
      const response = await fetch(
        `/api/whatsapp/qr?organizationSlug=${organizationSlug}`
      );

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.data?.qr);
      }
    } catch (err) {
      console.error('Failed to fetch QR code:', err);
    }
  };

  // Create and start session
  const startSession = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/whatsapp/session?organizationSlug=${organizationSlug}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      // Start polling for status updates
      setPolling(true);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Stop session
  const stopSession = async () => {
    if (!confirm('Are you sure you want to disconnect WhatsApp?')) {
      return;
    }

    setLoading(true);
    try {
      await fetch(
        `/api/whatsapp/session?organizationSlug=${organizationSlug}`,
        { method: 'DELETE' }
      );

      setSessionStatus('STOPPED');
      setQrCode(null);
      setPolling(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh status when waiting for QR or starting
  useEffect(() => {
    if (!polling && sessionStatus !== 'SCAN_QR_CODE' && sessionStatus !== 'STARTING') {
      return;
    }

    const interval = setInterval(async () => {
      const status = await fetchStatus();

      // Stop polling when connected
      if (status === 'WORKING') {
        setPolling(false);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [polling, sessionStatus]);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, []);

  // Status badge
  const getStatusBadge = () => {
    const badges = {
      'WORKING': { color: 'bg-green-100 text-green-800', label: 'Connected', icon: Check },
      'SCAN_QR_CODE': { color: 'bg-yellow-100 text-yellow-800', label: 'Waiting for QR Scan', icon: Smartphone },
      'STARTING': { color: 'bg-blue-100 text-blue-800', label: 'Starting...', icon: Loader2 },
      'STOPPED': { color: 'bg-gray-100 text-gray-800', label: 'Disconnected', icon: AlertCircle },
      'FAILED': { color: 'bg-red-100 text-red-800', label: 'Failed', icon: AlertCircle },
    };

    const badge = badges[sessionStatus] || badges['STOPPED'];
    const Icon = badge.icon;

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon size={14} className={sessionStatus === 'STARTING' ? 'animate-spin' : ''} />
        {badge.label}
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">WhatsApp Integration</h3>
          <p className="text-sm text-gray-600 mt-1">
            Connect WhatsApp to automatically create leads from incoming messages
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      {/* Connected State */}
      {sessionStatus === 'WORKING' && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800 mb-2">
            <Check size={20} />
            <span className="font-medium">WhatsApp Connected</span>
          </div>
          <p className="text-sm text-green-700">
            New messages will automatically create leads in your CRM. All conversations are logged in contact activity history.
          </p>
        </div>
      )}

      {/* QR Code Display */}
      {sessionStatus === 'SCAN_QR_CODE' && qrCode && (
        <div className="mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-700 mb-4 font-medium">
              Scan this QR code with WhatsApp on your phone:
            </p>
            <div className="inline-block p-4 bg-white border-2 border-gray-300 rounded-lg shadow-sm">
              <img
                src={qrCode}
                alt="WhatsApp QR Code"
                className="w-64 h-64"
              />
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-left">
              <p className="text-sm text-blue-900 font-medium mb-2">How to scan:</p>
              <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                <li>Open WhatsApp on your phone</li>
                <li>Tap Menu (⋮) or Settings</li>
                <li>Tap "Linked Devices"</li>
                <li>Tap "Link a Device"</li>
                <li>Point your phone at this screen to scan the QR code</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {(sessionStatus === 'STOPPED' || sessionStatus === 'UNKNOWN') && (
          <button
            onClick={startSession}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Connect WhatsApp
          </button>
        )}

        {sessionStatus === 'WORKING' && (
          <button
            onClick={stopSession}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Disconnect
          </button>
        )}

        {sessionStatus === 'SCAN_QR_CODE' && (
          <button
            onClick={fetchQRCode}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Smartphone size={16} />
            Refresh QR Code
          </button>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Important Notes:</h4>
        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
          <li>Use a dedicated WhatsApp Business number (not your personal number)</li>
          <li>Contacts are automatically created as "Leads" when they message you</li>
          <li>All conversations are logged in the contact's activity timeline</li>
          <li>You can disconnect at any time without losing your contact data</li>
        </ul>
      </div>
    </div>
  );
}
```

### 2. Contact Activity Component

Create `/src/tools/contact-management/components/ContactActivity.jsx`:

```javascript
import React, { useState, useEffect } from 'react';
import { MessageCircle, Phone, Mail, FileText, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ContactActivity({ contactId, organizationSlug }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'whatsapp_message', 'note', etc.

  useEffect(() => {
    fetchActivities();
  }, [contactId, filter]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const url = `/api/contacts/${contactId}/activities?org=${organizationSlug}${
        filter !== 'all' ? `&type=${filter}` : ''
      }`;

      const response = await fetch(url);
      const data = await response.json();
      setActivities(data.data || []);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      whatsapp_message: MessageCircle,
      note: FileText,
      call: Phone,
      email: Mail,
      meeting: Calendar,
    };
    return icons[type] || FileText;
  };

  const getActivityColor = (type, direction) => {
    if (type === 'whatsapp_message') {
      return direction === 'inbound'
        ? 'bg-green-100 text-green-600'
        : 'bg-blue-100 text-blue-600';
    }
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {['all', 'whatsapp_message', 'note', 'call', 'email'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === type
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {type === 'all' ? 'All Activity' : type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Activity Timeline */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading activities...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No activities yet</div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.activity_type);
            const colorClass = getActivityColor(activity.activity_type, activity.direction);

            return (
              <div
                key={activity.id}
                className="flex gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                  <Icon size={16} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {activity.activity_type === 'whatsapp_message'
                          ? `WhatsApp Message (${activity.direction})`
                          : activity.activity_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                        }
                      </span>
                      {activity.subject && (
                        <span className="text-sm text-gray-600 ml-2">- {activity.subject}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {activity.message_content && (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {activity.message_content}
                    </p>
                  )}

                  {/* Metadata */}
                  {activity.metadata?.has_media && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                      <FileText size={12} />
                      <span>Includes media attachment</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

### 3. Integration into Settings View

Update `/src/tools/contact-management/components/SettingsView.jsx`:

```javascript
import WhatsAppSettings from './WhatsAppSettings';

// Inside the SettingsView component, add a new section:

export default function SettingsView() {
  const { organizationSlug } = useOrganization(); // Get current org

  return (
    <div className="space-y-6">
      {/* Existing settings sections... */}

      {/* WhatsApp Integration Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Integrations
        </h2>
        <WhatsAppSettings organizationSlug={organizationSlug} />
      </section>
    </div>
  );
}
```

### 4. Add Activity Tab to Contact Detail

Update `/src/tools/contact-management/components/ContactDetail.jsx`:

```javascript
import ContactActivity from './ContactActivity';

// Add a new tab for Activity
const tabs = [
  { id: 'info', label: 'Contact Info' },
  { id: 'activity', label: 'Activity' }, // New tab
  { id: 'notes', label: 'Notes' },
];

// In the tab content section:
{activeTab === 'activity' && (
  <ContactActivity
    contactId={contact.id}
    organizationSlug={organizationSlug}
  />
)}
```

---

## Deployment Guide

### Docker Compose Setup

Create `/docker-compose.yml` in your project root:

```yaml
version: '3.8'

services:
  waha:
    image: devlikeapro/waha-plus  # Use Plus for persistence
    container_name: waha
    ports:
      - "3000:3000"
    environment:
      # API Security
      - WHATSAPP_API_KEY=${WAHA_API_KEY}

      # Default Engine (NOWEB recommended for multi-tenant)
      - WHATSAPP_DEFAULT_ENGINE=NOWEB

      # Session Persistence & Auto-start
      - WHATSAPP_RESTART_ALL_SESSIONS=true

      # Files Storage
      - WHATSAPP_FILES_FOLDER=/app/media

      # Webhook HMAC (optional but recommended)
      - WHATSAPP_HOOK_HMAC_KEY=${WAHA_HMAC_SECRET}

    volumes:
      # Persist session data
      - waha-sessions:/app/.waha
      # Persist media files
      - waha-media:/app/media

    restart: unless-stopped

    # Resource limits (adjust based on tenant count)
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G

volumes:
  waha-sessions:
  waha-media:
```

### Environment Variables

Create/update `.env`:

```bash
# WAHA Configuration
WAHA_URL=http://localhost:3000  # Or http://waha:3000 if in same Docker network
WAHA_API_KEY=your-secret-api-key-change-this
WAHA_HMAC_SECRET=your-hmac-secret-change-this

# Application
APP_URL=https://yourdomain.com
NODE_ENV=production
```

### Deployment Steps

#### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Deploy WAHA

```bash
# Clone your repo or upload docker-compose.yml
cd /path/to/your/app

# Create .env file with secure keys
nano .env

# Start WAHA
docker-compose up -d waha

# Check logs
docker-compose logs -f waha

# Verify WAHA is running
curl http://localhost:3000/api/health
```

#### 3. Nginx Reverse Proxy (Optional but Recommended)

Create `/etc/nginx/sites-available/waha`:

```nginx
server {
    listen 80;
    server_name waha.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name waha.yourdomain.com;

    # SSL Certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/waha.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/waha.yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to WAHA
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeouts for long-polling
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/waha /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 4. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d waha.yourdomain.com
```

#### 5. Firewall Configuration

```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Production Checklist

- [ ] WAHA Plus license activated (for persistence)
- [ ] Strong API keys generated
- [ ] HMAC secret configured
- [ ] HTTPS/SSL enabled
- [ ] Firewall configured
- [ ] Webhook URL using HTTPS
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Docker containers auto-restart enabled
- [ ] Monitoring/alerting configured
- [ ] Backup strategy for volumes
- [ ] Resource limits set in docker-compose

---

## Security & Best Practices

### 1. API Security

**Always use API keys:**
```javascript
headers: {
  'X-API-Key': process.env.WAHA_API_KEY
}
```

**Rotate keys regularly:**
```bash
# Generate new API key
openssl rand -base64 32

# Update .env and restart
docker-compose restart waha
```

### 2. Webhook Security

**HMAC Signature Verification:**
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(req) {
  const signature = req.headers['x-webhook-hmac-signature'];
  const secret = process.env.WAHA_HMAC_SECRET;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  return signature === expectedSignature;
}

// In webhook handler:
if (!verifyWebhookSignature(req)) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### 3. Tenant Isolation

**Always validate organization ownership:**
```javascript
async function validateOrganizationAccess(req, organizationSlug) {
  const user = req.user; // From your auth middleware

  // Check if user has access to this organization
  const hasAccess = await checkUserOrganizationAccess(
    user.id,
    organizationSlug
  );

  if (!hasAccess) {
    throw new Error('Unauthorized access to organization');
  }
}
```

**Prevent cross-tenant data leaks:**
```javascript
// WRONG - No organization filter
const contact = await db.query('SELECT * FROM contacts WHERE id = $1', [contactId]);

// CORRECT - Always filter by organization
const contact = await db.query(
  'SELECT * FROM contacts WHERE id = $1 AND organization_slug = $2',
  [contactId, organizationSlug]
);
```

### 4. Input Validation

**Sanitize phone numbers:**
```javascript
function sanitizePhoneNumber(phone) {
  // Remove all non-numeric characters
  return phone.replace(/[^0-9]/g, '');
}
```

**Validate webhook payloads:**
```javascript
function validateWebhookPayload(body) {
  if (!body.event || !body.payload) {
    throw new Error('Invalid webhook payload');
  }

  if (!body.payload.from || !body.payload.from.includes('@')) {
    throw new Error('Invalid sender format');
  }

  return true;
}
```

### 5. Rate Limiting

**Protect webhook endpoint:**
```javascript
const rateLimit = require('express-rate-limit');

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Max 100 requests per minute per IP
  message: 'Too many webhook requests'
});

app.post('/api/whatsapp/webhook', webhookLimiter, webhookHandler);
```

### 6. Data Privacy

**GDPR Compliance:**
- Store only necessary data
- Implement data retention policies
- Provide data export functionality
- Allow users to delete their data
- Get explicit consent for storing messages

**Message retention policy example:**
```sql
-- Auto-delete messages older than 1 year
DELETE FROM contact_activities
WHERE activity_type = 'whatsapp_message'
AND created_at < NOW() - INTERVAL '1 year';
```

### 7. Session Management Best Practices

**Monitor session health:**
```javascript
async function monitorSessionHealth() {
  const sessions = await fetch(`${WAHA_URL}/api/sessions`, {
    headers: { 'X-API-Key': WAHA_API_KEY }
  }).then(r => r.json());

  for (const session of sessions) {
    if (session.status === 'FAILED') {
      // Alert admin
      await sendAlert(`Session ${session.name} failed`);

      // Auto-restart
      await fetch(`${WAHA_URL}/api/sessions/${session.name}/restart`, {
        method: 'POST',
        headers: { 'X-API-Key': WAHA_API_KEY }
      });
    }
  }
}

// Run every 5 minutes
setInterval(monitorSessionHealth, 5 * 60 * 1000);
```

**Implement session cleanup:**
```javascript
async function cleanupInactiveSessions() {
  // Get all organizations
  const orgs = await getAllOrganizations();

  for (const org of orgs) {
    // If organization disabled WhatsApp, stop session
    if (!org.whatsapp_enabled && org.whatsapp_session_name) {
      await fetch(
        `${WAHA_URL}/api/sessions/${org.whatsapp_session_name}/stop`,
        {
          method: 'POST',
          headers: { 'X-API-Key': WAHA_API_KEY }
        }
      );
    }
  }
}
```

---

## Scaling Strategies

### When to Scale

**Monitor these metrics:**
- CPU usage > 80% sustained
- Memory usage > 90%
- Session count approaching engine limits
- Webhook latency increasing
- Error rates rising

### Vertical Scaling (Single Container)

**Upgrade server resources:**
```yaml
# docker-compose.yml
services:
  waha:
    deploy:
      resources:
        limits:
          cpus: '4'      # Increase from 2
          memory: 8G     # Increase from 4G
```

**Switch to more efficient engine:**
```bash
# .env
WHATSAPP_DEFAULT_ENGINE=GOWS  # More efficient than NOWEB
```

### Horizontal Scaling (Multiple Containers)

**Load balancing strategy:**

1. **Database tracking:**
```sql
ALTER TABLE organizations
  ADD COLUMN waha_instance VARCHAR(50); -- 'waha-1', 'waha-2', etc.
```

2. **Container assignment:**
```javascript
async function assignWahaInstance(organizationSlug) {
  // Get instance with least sessions
  const instances = ['waha-1', 'waha-2', 'waha-3'];
  const sessionCounts = await Promise.all(
    instances.map(async (instance) => {
      const url = `http://${instance}:3000/api/sessions`;
      const response = await fetch(url);
      const sessions = await response.json();
      return { instance, count: sessions.length };
    })
  );

  // Sort by count, pick instance with fewest sessions
  sessionCounts.sort((a, b) => a.count - b.count);
  const assigned = sessionCounts[0].instance;

  // Save to database
  await updateOrganization(organizationSlug, {
    waha_instance: assigned
  });

  return assigned;
}
```

3. **Multi-container docker-compose:**
```yaml
version: '3.8'

services:
  waha-1:
    image: devlikeapro/waha-plus
    container_name: waha-1
    ports:
      - "3001:3000"
    environment:
      - WHATSAPP_API_KEY=${WAHA_API_KEY}
    volumes:
      - waha-sessions-1:/app/.waha

  waha-2:
    image: devlikeapro/waha-plus
    container_name: waha-2
    ports:
      - "3002:3000"
    environment:
      - WHATSAPP_API_KEY=${WAHA_API_KEY}
    volumes:
      - waha-sessions-2:/app/.waha

  waha-3:
    image: devlikeapro/waha-plus
    container_name: waha-3
    ports:
      - "3003:3000"
    environment:
      - WHATSAPP_API_KEY=${WAHA_API_KEY}
    volumes:
      - waha-sessions-3:/app/.waha

volumes:
  waha-sessions-1:
  waha-sessions-2:
  waha-sessions-3:
```

### Database Optimization

**Index optimization:**
```sql
-- Composite indexes for common queries
CREATE INDEX idx_contacts_org_phone
  ON contacts(organization_slug, phone_1);

CREATE INDEX idx_activities_contact_type_created
  ON contact_activities(contact_id, activity_type, created_at DESC);

-- Partial index for active WhatsApp sessions
CREATE INDEX idx_organizations_whatsapp_active
  ON organizations(organization_slug)
  WHERE whatsapp_enabled = true;
```

**Query optimization:**
```javascript
// Use connection pooling
const { Pool } = require('pg');
const pool = new Pool({
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Caching Strategy

**Cache session status:**
```javascript
const NodeCache = require('node-cache');
const sessionCache = new NodeCache({ stdTTL: 60 }); // 60 second TTL

async function getSessionStatus(sessionName) {
  // Check cache first
  const cached = sessionCache.get(sessionName);
  if (cached) return cached;

  // Fetch from WAHA
  const response = await fetch(`${WAHA_URL}/api/sessions/${sessionName}`);
  const data = await response.json();

  // Cache result
  sessionCache.set(sessionName, data);

  return data;
}
```

---

## Testing Guide

### 1. Local Development Setup

```bash
# Start WAHA locally
docker run -p 3000:3000 devlikeapro/waha

# Use ngrok for webhook testing
ngrok http 3000

# Update .env with ngrok URL
WEBHOOK_URL=https://abc123.ngrok.io/api/whatsapp/webhook
```

### 2. Manual Testing Checklist

**Session Creation:**
- [ ] Create session via UI
- [ ] Verify session appears in WAHA dashboard (http://localhost:3000/dashboard)
- [ ] Check session status updates correctly
- [ ] QR code displays properly

**Authentication:**
- [ ] Scan QR code with WhatsApp mobile
- [ ] Status changes to WORKING
- [ ] QR code disappears after connection

**Contact Creation:**
- [ ] Send test message to connected WhatsApp number
- [ ] Verify contact created in database
- [ ] Check contact appears in UI
- [ ] Confirm contact type is "Lead"
- [ ] Verify traffic source is "WhatsApp"

**Activity Logging:**
- [ ] Send multiple messages
- [ ] Check all messages logged in contact_activities
- [ ] Verify messages appear in activity timeline
- [ ] Test activity filtering

**Duplicate Handling:**
- [ ] Send another message from same number
- [ ] Verify contact NOT duplicated
- [ ] Confirm new activity logged

**Session Management:**
- [ ] Disconnect WhatsApp
- [ ] Verify status updates
- [ ] Reconnect and verify works

### 3. Automated Testing

**Webhook endpoint test:**
```javascript
// test/whatsapp-webhook.test.js
const request = require('supertest');
const app = require('../server/app');

describe('POST /api/whatsapp/webhook', () => {
  it('should create contact from WhatsApp message', async () => {
    const payload = {
      event: 'message',
      session: 'tenant-test-org',
      metadata: { organization_slug: 'test-org' },
      payload: {
        from: '60123456789@c.us',
        fromMe: false,
        body: 'Test message',
        _data: { notifyName: 'John Doe' },
        timestamp: Date.now()
      }
    };

    const response = await request(app)
      .post('/api/whatsapp/webhook?org=test-org')
      .send(payload)
      .expect(200);

    expect(response.body.data.action).toBe('contact_created');
  });

  it('should reject invalid HMAC signature', async () => {
    const payload = { /* ... */ };

    await request(app)
      .post('/api/whatsapp/webhook')
      .set('x-webhook-hmac-signature', 'invalid')
      .send(payload)
      .expect(401);
  });
});
```

### 4. Load Testing

```bash
# Install artillery
npm install -g artillery

# Create load test config
# artillery.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10  # 10 webhooks per second

scenarios:
  - name: 'Webhook stress test'
    flow:
      - post:
          url: '/api/whatsapp/webhook?org=test-org'
          json:
            event: 'message'
            payload:
              from: '{{ $randomNumber() }}@c.us'
              body: 'Test message'

# Run test
artillery run artillery.yml
```

---

## Troubleshooting

### Common Issues

#### 1. QR Code Not Displaying

**Symptoms:**
- QR code endpoint returns 404
- Session status stuck in STARTING

**Solutions:**
```bash
# Check WAHA logs
docker-compose logs waha

# Restart session
curl -X POST http://localhost:3000/api/sessions/{session-name}/restart \
  -H "X-API-Key: your-key"

# Delete and recreate session
curl -X DELETE http://localhost:3000/api/sessions/{session-name} \
  -H "X-API-Key: your-key"
```

#### 2. Session Disconnects Frequently

**Symptoms:**
- Status changes to FAILED
- Need to re-scan QR often

**Solutions:**
- Use WAHA Plus for persistence
- Check server resources (CPU/memory)
- Verify stable internet connection
- Switch to NOWEB/GOWS engine

```yaml
# docker-compose.yml
environment:
  - WHATSAPP_DEFAULT_ENGINE=NOWEB
  - WHATSAPP_RESTART_ALL_SESSIONS=true
```

#### 3. Webhooks Not Received

**Symptoms:**
- Messages sent but no contacts created
- No webhook requests in logs

**Solutions:**
```bash
# 1. Verify webhook URL is accessible
curl https://yourdomain.com/api/whatsapp/webhook?org=test

# 2. Check WAHA webhook configuration
curl http://localhost:3000/api/sessions/{session-name} \
  -H "X-API-Key: your-key"

# 3. Test webhook with manual payload
curl -X POST https://yourdomain.com/api/whatsapp/webhook?org=test-org \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message",
    "payload": {
      "from": "60123456789@c.us",
      "fromMe": false,
      "body": "Test"
    }
  }'

# 4. Check firewall/nginx configuration
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

#### 4. Duplicate Contacts Created

**Symptoms:**
- Same phone number creates multiple contacts

**Solutions:**
- Check phone normalization function
- Verify database query uses all phone fields
- Add unique constraint:

```sql
-- Add unique constraint on phone numbers per organization
CREATE UNIQUE INDEX idx_unique_phone_org
  ON contacts(organization_slug, REPLACE(REPLACE(phone_1, '+', ''), ' ', ''))
  WHERE phone_1 IS NOT NULL;
```

#### 5. High Memory Usage

**Symptoms:**
- Docker container crashes
- OOM (Out of Memory) errors

**Solutions:**
```yaml
# Limit container resources
deploy:
  resources:
    limits:
      memory: 4G
    reservations:
      memory: 2G

# Switch to lighter engine
environment:
  - WHATSAPP_DEFAULT_ENGINE=GOWS  # More memory-efficient
```

#### 6. WhatsApp Account Banned

**Symptoms:**
- Session shows FAILED
- Unable to reconnect
- WhatsApp app shows "banned"

**Prevention:**
- Use dedicated business number
- Don't send spam/unsolicited messages
- Add delays between messages (1-2 seconds)
- Limit to 1-2 messages per conversation
- Only respond to incoming messages
- Follow WhatsApp Terms of Service

**Recovery:**
- Contact WhatsApp support
- Use different phone number
- Consider official WhatsApp Business API

### Debug Mode

**Enable verbose logging:**
```yaml
# docker-compose.yml
environment:
  - DEBUG=true
  - WAHA_LOG_LEVEL=debug
```

**Application debug:**
```javascript
// webhook handler
console.log('Webhook received:', JSON.stringify(req.body, null, 2));
console.log('Organization:', organizationSlug);
console.log('Contact lookup result:', contact);
```

### Health Check Script

```bash
#!/bin/bash
# health-check.sh

echo "Checking WAHA health..."

# Check WAHA API
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)

if [ $STATUS -ne 200 ]; then
  echo "ERROR: WAHA is down (HTTP $STATUS)"
  # Restart container
  docker-compose restart waha
  exit 1
fi

echo "WAHA is healthy"

# Check session statuses
SESSIONS=$(curl -s -H "X-API-Key: $WAHA_API_KEY" http://localhost:3000/api/sessions)
echo "Active sessions: $(echo $SESSIONS | jq 'length')"

# Check for failed sessions
FAILED=$(echo $SESSIONS | jq '[.[] | select(.status == "FAILED")] | length')
if [ $FAILED -gt 0 ]; then
  echo "WARNING: $FAILED failed sessions"
fi

exit 0
```

Run periodically:
```bash
# Add to crontab
*/5 * * * * /path/to/health-check.sh >> /var/log/waha-health.log 2>&1
```

---

## Cost Analysis

### Infrastructure Costs

**Single WAHA Container (500 tenants):**

| Resource | Specification | Provider | Monthly Cost |
|----------|--------------|----------|--------------|
| VPS      | 4 vCPU, 8GB RAM, 160GB SSD | DigitalOcean | $48 |
| VPS      | 4 vCPU, 8GB RAM | Hetzner | €17 (~$18) |
| VPS      | 2 vCPU, 8GB RAM | Linode | $36 |
| Domain   | yourdomain.com | Namecheap | $1 |
| SSL      | Let's Encrypt | Free | $0 |

**Total: $18-48/month for up to 500 tenants**

**Cost per tenant: $0.04-0.10/month**

### Scaling Costs

| Tenant Count | Containers | Server Spec | Monthly Cost |
|--------------|------------|-------------|--------------|
| 1-500        | 1          | 4 vCPU, 8GB | $48          |
| 500-1000     | 2          | 4 vCPU, 8GB each | $96      |
| 1000-1500    | 3          | 4 vCPU, 8GB each | $144     |

### WAHA Plus License

- **One-time donation**: Check current pricing at https://waha.devlike.pro/
- **No recurring fees**
- **Lifetime license**
- **Benefits**: Session persistence, auto-restart, no license expiration

### Alternative Official APIs (Comparison)

| Provider | Setup Fee | Monthly Fee | Per Message | Notes |
|----------|-----------|-------------|-------------|-------|
| WhatsApp Business API | $0 | $0 | $0.005-0.04 | Complex approval process |
| Twilio WhatsApp | $0 | $0 | $0.005-0.06 | Easier setup, official |
| 360dialog | $0 | €49 | €0.01-0.04 | Good for EU/GDPR |
| **WAHA (Self-hosted)** | $0 | $18-48 | $0 | Unofficial, use at own risk |

---

## Next Steps

### Phase 1: Core Setup (Week 1)
1. Deploy WAHA container
2. Apply database migrations
3. Implement webhook handler
4. Test with one tenant

### Phase 2: UI Development (Week 2)
1. Build WhatsApp settings component
2. Add QR code display
3. Implement activity timeline
4. Integration testing

### Phase 3: Production Deployment (Week 3)
1. Deploy to production server
2. Configure HTTPS/SSL
3. Set up monitoring
4. Load testing

### Phase 4: Rollout (Week 4)
1. Enable for beta tenants
2. Gather feedback
3. Monitor performance
4. Full rollout

---

## Support & Resources

### Official Documentation
- WAHA Docs: https://waha.devlike.pro/
- GitHub: https://github.com/devlikeapro/waha
- API Reference: https://waha.devlike.pro/docs/api

### Community
- GitHub Issues: Report bugs and feature requests
- Discord: Community support (link in GitHub repo)

### Internal Resources
- `/docs/whatsapp-api-reference.md` - Quick API reference
- `/server/api_handlers/whatsapp_*.js` - Implementation code
- `/src/tools/contact-management/components/WhatsApp*.jsx` - UI components

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
**Author**: Your Team