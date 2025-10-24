# Lark API Documentation Overview

This documentation provides a comprehensive guide to the Lark (Feishu) Open Platform APIs available for integration with this project. The Lark Open Platform offers a rich set of APIs for building applications that integrate with Lark's ecosystem.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [API Categories](#api-categories)
4. [Base URLs](#base-urls)
5. [Rate Limits](#rate-limits)
6. [Error Handling](#error-handling)
7. [SDK Information](#sdk-information)

## Getting Started

The Lark Open Platform provides APIs for various functionalities including messaging, contact management, document collaboration, and more. All APIs follow RESTful principles and use JSON for data exchange.

### Prerequisites

- Lark Developer Account
- App ID and App Secret
- Proper API scopes configured in the Developer Console

## Authentication

Lark APIs use OAuth 2.0 for authentication. There are two main types of access tokens:

### Tenant Access Token
Used for server-to-server communication and accessing organization-level resources.

```http
POST https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal/
Content-Type: application/json

{
  "app_id": "YOUR_APP_ID",
  "app_secret": "YOUR_APP_SECRET"
}
```

### User Access Token
Used for accessing user-specific resources and requires user authorization.

## API Categories

### 1. Contact & Directory APIs
- **User Management**: Create, update, delete, and query users
- **Department Management**: Manage organizational structure
- **Organization Information**: Access company-wide data

### 2. Messaging & Communication APIs
- **Instant Messaging**: Send text, image, file, and rich messages
- **Group Management**: Create and manage chat groups
- **Bot Integration**: Build interactive bots

### 3. Document & Collaboration APIs
- **Sheets**: Manipulate spreadsheet data
- **Docs**: Access and modify documents
- **Bitable**: Work with database-like tables
- **Drive**: File storage and management

### 4. Calendar & Meeting APIs
- **Calendar Events**: Create, update, and manage calendar events
- **Meeting Rooms**: Book and manage meeting rooms
- **Attendee Management**: Handle meeting participants

### 5. Task Management APIs
- **Task Lists**: Create and manage task lists
- **Tasks**: CRUD operations on individual tasks
- **Task Assignment**: Assign tasks to users

### 6. CoreHR APIs
- **Employee Management**: Handle employee data
- **Organizational Structure**: Manage departments and roles
- **Onboarding/Offboarding**: Employee lifecycle management

## Base URLs

- **International**: `https://open.feishu.cn`
- **China**: `https://open.larksuite.com`

## Rate Limits

Lark APIs implement rate limiting to ensure service stability:

- **Default**: 100 requests per minute per app
- **Specific endpoints**: May have different limits
- **Rate limit headers**: Included in responses

## Error Handling

All API responses follow a consistent error format:

```json
{
  "code": 0,
  "msg": "success",
  "data": {}
}
```

Common error codes:
- `0`: Success
- `-1`: General error
- `99991663`: Invalid access token
- `99991664`: Access token expired

## SDK Information

### Official SDKs Available:
- **Go**: `github.com/larksuite/oapi-sdk-go`
- **Python**: `larksuite-oapi`
- **Node.js**: `@larksuiteoapi/node-sdk`
- **Java**: Available through Maven

### For This Project
This project uses HTTP requests with axios to interact with Lark APIs. The backend server handles authentication and proxies requests to the Lark API endpoints.

## Next Steps

Refer to the specific API documentation files for detailed information:

- [Contact & Directory APIs](./lark-contact-apis.md)
- [Messaging APIs](./lark-messaging-apis.md)
- [Authentication APIs](./lark-auth-apis.md)
- [Sheets APIs](./lark-sheets-apis.md)
- [Bitable APIs](./lark-bitable-apis.md)
- [Calendar APIs](./lark-calendar-apis.md)
- [Task Management APIs](./lark-task-apis.md)
- [CoreHR APIs](./lark-corehr-apis.md)
- [Implementation Examples](./lark-implementation-examples.md)

## Resources

- [Official Documentation](https://open.larkoffice.com/)
- [Developer Console](https://open.feishu.cn/app)
- [API Explorer](https://open.feishu.cn/api-explorer)