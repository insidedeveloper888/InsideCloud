# Lark Contact & Directory APIs

This document covers the Contact and Directory APIs for managing users, departments, and organizational structure in Lark.

## Table of Contents

1. [Overview](#overview)
2. [User Management APIs](#user-management-apis)
3. [Department Management APIs](#department-management-apis)
4. [Organization APIs](#organization-apis)
5. [Required Scopes](#required-scopes)
6. [Implementation Examples](#implementation-examples)

## Overview

The Contact & Directory APIs allow you to:
- Manage user accounts and profiles
- Create and organize departments
- Query organizational structure
- Handle employee lifecycle events

**Base URL**: `https://open.feishu.cn/open-apis/contact/v3`

## User Management APIs

### List Users
Retrieve a list of users in the organization.

```http
GET /contact/v3/users
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- user_id_type: string (open_id, union_id, user_id)
- department_id: string (optional)
- page_size: integer (1-50, default: 10)
- page_token: string (for pagination)
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "items": [
      {
        "union_id": "on_8ed6aa67826108097d9ee143816345",
        "user_id": "5d9bdxxx",
        "open_id": "ou_84aad35d084aa403a838cf73ee18467",
        "name": "John Doe",
        "en_name": "John Doe",
        "email": "john.doe@company.com",
        "mobile": "+1234567890",
        "gender": 1,
        "avatar": {
          "avatar_72": "https://example.com/avatar_72.jpg",
          "avatar_240": "https://example.com/avatar_240.jpg",
          "avatar_640": "https://example.com/avatar_640.jpg",
          "avatar_origin": "https://example.com/avatar_origin.jpg"
        },
        "status": {
          "is_frozen": false,
          "is_resigned": false,
          "is_activated": true
        },
        "department_ids": ["od-4e6ac4d14bcd5071a37a39de902c7141"],
        "leader_user_id": "5d9bdxxx",
        "city": "San Francisco",
        "country": "US",
        "work_station": "Office A",
        "join_time": 1547119833,
        "employee_no": "EMP001",
        "employee_type": 1,
        "positions": [
          {
            "position_code": "POS001",
            "position_name": "Software Engineer",
            "department_id": "od-4e6ac4d14bcd5071a37a39de902c7141",
            "leader_user_id": "5d9bdxxx",
            "leader_position_code": "POS002",
            "is_major": true
          }
        ]
      }
    ],
    "page_token": "next_page_token",
    "has_more": true
  }
}
```

### Get User Details
Retrieve detailed information about a specific user.

```http
GET /contact/v3/users/{user_id}
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- user_id_type: string (open_id, union_id, user_id)
```

### Create User
Create a new user in the organization.

```http
POST /contact/v3/users
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane.smith@company.com",
  "mobile": "+1234567891",
  "department_ids": ["od-4e6ac4d14bcd5071a37a39de902c7141"],
  "employee_no": "EMP002",
  "employee_type": 1,
  "join_time": 1547119833,
  "positions": [
    {
      "position_code": "POS003",
      "position_name": "Product Manager",
      "department_id": "od-4e6ac4d14bcd5071a37a39de902c7141",
      "is_major": true
    }
  ]
}
```

### Update User
Update user information.

```http
PATCH /contact/v3/users/{user_id}
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "name": "Jane Smith Updated",
  "mobile": "+1234567892",
  "city": "New York"
}
```

### Delete User
Remove a user from the organization.

```http
DELETE /contact/v3/users/{user_id}
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- user_id_type: string (open_id, union_id, user_id)
```

## Department Management APIs

### List Departments
Retrieve a list of departments.

```http
GET /contact/v3/departments
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- department_id_type: string (department_id, open_department_id)
- parent_department_id: string (optional)
- fetch_child: boolean (default: false)
- page_size: integer (1-50, default: 10)
- page_token: string (for pagination)
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "items": [
      {
        "name": "Engineering",
        "i18n_name": {
          "zh_cn": "工程部",
          "ja_jp": "エンジニアリング",
          "en_us": "Engineering"
        },
        "parent_department_id": "od-4e6ac4d14bcd5071a37a39de902c7141",
        "department_id": "od-4e6ac4d14bcd5071a37a39de902c7142",
        "open_department_id": "od-4e6ac4d14bcd5071a37a39de902c7142",
        "leader_user_id": "5d9bdxxx",
        "chat_id": "oc_5ad11d72b830411d72b836c20",
        "order": 100,
        "unit_ids": ["unit_001"],
        "member_count": 25,
        "status": {
          "is_deleted": false
        }
      }
    ],
    "page_token": "next_page_token",
    "has_more": true
  }
}
```

### Get Department Details
Retrieve detailed information about a specific department.

```http
GET /contact/v3/departments/{department_id}
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- department_id_type: string (department_id, open_department_id)
```

### Create Department
Create a new department.

```http
POST /contact/v3/departments
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "name": "Marketing",
  "i18n_name": {
    "zh_cn": "市场部",
    "en_us": "Marketing"
  },
  "parent_department_id": "od-4e6ac4d14bcd5071a37a39de902c7141",
  "leader_user_id": "5d9bdxxx",
  "order": 200,
  "create_group_chat": true
}
```

### Update Department
Update department information.

```http
PATCH /contact/v3/departments/{department_id}
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "name": "Marketing & Sales",
  "leader_user_id": "5d9bdyyy",
  "order": 150
}
```

### Delete Department
Remove a department.

```http
DELETE /contact/v3/departments/{department_id}
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- department_id_type: string (department_id, open_department_id)
```

## Organization APIs

### Get Organization Information
Retrieve basic organization information.

```http
GET /contact/v3/tenant
Authorization: Bearer <tenant_access_token>
Content-Type: application/json
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "tenant": {
      "name": "Company Name",
      "display_name": "Company Display Name",
      "tenant_tag": "company",
      "tenant_key": "tenant_key_example",
      "avatar": {
        "avatar_72": "https://example.com/tenant_avatar_72.jpg",
        "avatar_240": "https://example.com/tenant_avatar_240.jpg",
        "avatar_640": "https://example.com/tenant_avatar_640.jpg",
        "avatar_origin": "https://example.com/tenant_avatar_origin.jpg"
      }
    }
  }
}
```

### List Work Cities
Get available work cities in the organization.

```http
GET /contact/v3/work_cities
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- page_size: integer (1-100, default: 10)
- page_token: string (for pagination)
```

## Required Scopes

To use these APIs, your app needs the following scopes:

### User Management
- `contact:user:read` - Read user information
- `contact:user:write` - Create, update, delete users
- `contact:user.employee_id:read` - Read employee IDs
- `contact:user.phone:read` - Read phone numbers
- `contact:user.email:read` - Read email addresses

### Department Management
- `contact:department:read` - Read department information
- `contact:department:write` - Create, update, delete departments

### Organization
- `contact:tenant:read` - Read organization information

## Implementation Examples

### Example: Get Organization Members (Current Project Implementation)

```javascript
// Backend implementation (server.js)
app.get('/api/get_organization_members', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    const response = await axios.get(
      'https://open.feishu.cn/open-apis/contact/v3/users',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          user_id_type: 'open_id',
          page_size: 50
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      code: -1,
      msg: 'Failed to fetch organization members',
      error: error.message
    });
  }
});
```

### Example: Create Department with Error Handling

```javascript
async function createDepartment(accessToken, departmentData) {
  try {
    const response = await axios.post(
      'https://open.feishu.cn/open-apis/contact/v3/departments',
      departmentData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.code === 0) {
      return response.data.data.department;
    } else {
      throw new Error(`API Error: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('Failed to create department:', error);
    throw error;
  }
}
```

## Best Practices

1. **Pagination**: Always handle pagination for list endpoints
2. **Error Handling**: Check response codes and handle errors gracefully
3. **Rate Limiting**: Respect API rate limits and implement retry logic
4. **Caching**: Cache frequently accessed data like department structures
5. **Permissions**: Only request necessary scopes for your application
6. **Data Validation**: Validate input data before making API calls

## Common Error Codes

- `99991400`: Invalid request parameters
- `99991403`: Insufficient permissions
- `99991404`: Resource not found
- `99991429`: Rate limit exceeded
- `99991500`: Internal server error