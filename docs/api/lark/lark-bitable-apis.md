# Lark Bitable APIs

This document covers the Bitable APIs for managing databases, tables, records, and views in Lark's database system (Bitable).

## Table of Contents

1. [Overview](#overview)
2. [Database Management APIs](#database-management-apis)
3. [Table Management APIs](#table-management-apis)
4. [Field Management APIs](#field-management-apis)
5. [Record Management APIs](#record-management-apis)
6. [View Management APIs](#view-management-apis)
7. [Attachment Management APIs](#attachment-management-apis)
8. [Required Scopes](#required-scopes)
9. [Implementation Examples](#implementation-examples)

## Overview

Lark Bitable is a powerful database system that allows you to:
- Create and manage databases (Bitables)
- Define tables with custom fields
- Manage records with various data types
- Create custom views and filters
- Handle file attachments
- Collaborate on data in real-time

**Base URL**: `https://open.feishu.cn/open-apis/bitable/v1`

## Database Management APIs

### Create Database

```http
POST /bitable/v1/apps
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "name": "Project Management Database",
  "folder_token": "fldcnbDekqlcOGIUHMxRjiqg",
  "description": "Database for tracking project tasks and resources"
}
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "app": {
      "app_token": "bascnCMII2ORuEjIDXsVms64n2c",
      "name": "Project Management Database",
      "description": "Database for tracking project tasks and resources",
      "revision": 1,
      "is_advanced": false,
      "time_zone": "Asia/Shanghai"
    }
  }
}
```

### Get Database Information

```http
GET /bitable/v1/apps/{app_token}
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- user_id_type: string (open_id, union_id, user_id)
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "app": {
      "app_token": "bascnCMII2ORuEjIDXsVms64n2c",
      "name": "Project Management Database",
      "description": "Database for tracking project tasks and resources",
      "revision": 15,
      "is_advanced": false,
      "time_zone": "Asia/Shanghai"
    }
  }
}
```

### Update Database

```http
PATCH /bitable/v1/apps/{app_token}
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "name": "Updated Project Management Database",
  "description": "Enhanced database for comprehensive project tracking"
}
```

### List Databases

```http
GET /bitable/v1/apps
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- page_size: integer (1-200, default: 20)
- page_token: string
- user_id_type: string (open_id, union_id, user_id)
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "items": [
      {
        "app_token": "bascnCMII2ORuEjIDXsVms64n2c",
        "name": "Project Management Database",
        "description": "Database for tracking project tasks and resources",
        "revision": 15,
        "is_advanced": false,
        "time_zone": "Asia/Shanghai"
      }
    ],
    "page_token": "next_page_token",
    "has_more": false,
    "total": 1
  }
}
```

## Table Management APIs

### Create Table

```http
POST /bitable/v1/apps/{app_token}/tables
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "table": {
    "name": "Tasks",
    "default_view_name": "All Tasks",
    "fields": [
      {
        "field_name": "Task Name",
        "type": 1,
        "property": {}
      },
      {
        "field_name": "Status",
        "type": 3,
        "property": {
          "options": [
            {
              "name": "To Do",
              "color": 0
            },
            {
              "name": "In Progress",
              "color": 1
            },
            {
              "name": "Done",
              "color": 2
            }
          ]
        }
      },
      {
        "field_name": "Due Date",
        "type": 5,
        "property": {
          "date_format": "yyyy/MM/dd",
          "auto_fill": false
        }
      },
      {
        "field_name": "Assignee",
        "type": 11,
        "property": {
          "multiple": false
        }
      }
    ]
  }
}
```

**Field Types:**
- `1`: Text
- `2`: Number
- `3`: Single Select
- `4`: Multi Select
- `5`: Date
- `7`: Checkbox
- `11`: Person
- `13`: Phone
- `15`: URL
- `17`: Attachment
- `18`: Single Link
- `20`: Formula
- `21`: Created Time
- `22`: Modified Time
- `23`: Created By
- `24`: Modified By

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "table_id": "tblsRc9GRRXKqhvW",
    "default_view_id": "vewTpR1urY",
    "field_id_list": [
      "fldcnS5Jgi",
      "fldcnS5Jgj",
      "fldcnS5Jgk",
      "fldcnS5Jgl"
    ]
  }
}
```

### Get Table Information

```http
GET /bitable/v1/apps/{app_token}/tables/{table_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- text_field_as_array: boolean (default: true)
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "table": {
      "table_id": "tblsRc9GRRXKqhvW",
      "revision": 5,
      "name": "Tasks",
      "is_primary": false
    }
  }
}
```

### List Tables

```http
GET /bitable/v1/apps/{app_token}/tables
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- page_size: integer (1-100, default: 20)
- page_token: string
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "items": [
      {
        "table_id": "tblsRc9GRRXKqhvW",
        "revision": 5,
        "name": "Tasks",
        "is_primary": false
      },
      {
        "table_id": "tblsRc9GRRXKqhvX",
        "revision": 3,
        "name": "Projects",
        "is_primary": true
      }
    ],
    "page_token": "",
    "has_more": false,
    "total": 2
  }
}
```

### Update Table

```http
PATCH /bitable/v1/apps/{app_token}/tables/{table_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "name": "Project Tasks"
}
```

### Delete Table

```http
DELETE /bitable/v1/apps/{app_token}/tables/{table_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

## Field Management APIs

### Create Field

```http
POST /bitable/v1/apps/{app_token}/tables/{table_id}/fields
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "field_name": "Priority",
  "type": 3,
  "property": {
    "options": [
      {
        "name": "High",
        "color": 0
      },
      {
        "name": "Medium",
        "color": 1
      },
      {
        "name": "Low",
        "color": 2
      }
    ]
  }
}
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "field": {
      "field_id": "fldcnS5Jgm",
      "field_name": "Priority",
      "type": 3,
      "property": {
        "options": [
          {
            "id": "optKKiXlai",
            "name": "High",
            "color": 0
          },
          {
            "id": "optKKiXlaj",
            "name": "Medium",
            "color": 1
          },
          {
            "id": "optKKiXlak",
            "name": "Low",
            "color": 2
          }
        ]
      },
      "description": {
        "disable_sync": false,
        "text": ""
      },
      "is_primary": false
    }
  }
}
```

### List Fields

```http
GET /bitable/v1/apps/{app_token}/tables/{table_id}/fields
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- view_id: string (optional)
- text_field_as_array: boolean (default: true)
- page_size: integer (1-100, default: 20)
- page_token: string
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "items": [
      {
        "field_id": "fldcnS5Jgi",
        "field_name": "Task Name",
        "type": 1,
        "property": {},
        "description": {
          "disable_sync": false,
          "text": ""
        },
        "is_primary": true
      },
      {
        "field_id": "fldcnS5Jgj",
        "field_name": "Status",
        "type": 3,
        "property": {
          "options": [
            {
              "id": "optKKiXlai",
              "name": "To Do",
              "color": 0
            }
          ]
        },
        "description": {
          "disable_sync": false,
          "text": ""
        },
        "is_primary": false
      }
    ],
    "page_token": "",
    "has_more": false,
    "total": 4
  }
}
```

### Update Field

```http
PATCH /bitable/v1/apps/{app_token}/tables/{table_id}/fields/{field_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "field_name": "Task Priority",
  "description": {
    "text": "Priority level for the task"
  }
}
```

### Delete Field

```http
DELETE /bitable/v1/apps/{app_token}/tables/{table_id}/fields/{field_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

## Record Management APIs

### Create Record

```http
POST /bitable/v1/apps/{app_token}/tables/{table_id}/records
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "fields": {
    "Task Name": "Implement user authentication",
    "Status": "To Do",
    "Due Date": 1640995200000,
    "Assignee": [
      {
        "id": "ou_84aad35d084aa403a838cf73ee18467"
      }
    ],
    "Priority": "High"
  }
}
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "record": {
      "record_id": "recqwIwhc6",
      "created_by": {
        "id": "ou_84aad35d084aa403a838cf73ee18467",
        "name": "John Doe",
        "en_name": "John Doe",
        "email": "john.doe@example.com"
      },
      "created_time": 1640995200000,
      "fields": {
        "Task Name": "Implement user authentication",
        "Status": "To Do",
        "Due Date": 1640995200000,
        "Assignee": [
          {
            "id": "ou_84aad35d084aa403a838cf73ee18467",
            "name": "John Doe",
            "en_name": "John Doe",
            "email": "john.doe@example.com"
          }
        ],
        "Priority": "High"
      }
    }
  }
}
```

### Batch Create Records

```http
POST /bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_create
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "records": [
    {
      "fields": {
        "Task Name": "Design database schema",
        "Status": "In Progress",
        "Priority": "High"
      }
    },
    {
      "fields": {
        "Task Name": "Write API documentation",
        "Status": "To Do",
        "Priority": "Medium"
      }
    }
  ]
}
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "records": [
      {
        "record_id": "recqwIwhc7",
        "created_by": {
          "id": "ou_84aad35d084aa403a838cf73ee18467",
          "name": "John Doe"
        },
        "created_time": 1640995200000,
        "fields": {
          "Task Name": "Design database schema",
          "Status": "In Progress",
          "Priority": "High"
        }
      }
    ]
  }
}
```

### Get Record

```http
GET /bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- text_field_as_array: boolean (default: true)
- user_id_type: string (open_id, union_id, user_id)
- display_formula_ref: boolean (default: false)
- automatic_fields: boolean (default: false)
```

### List Records

```http
GET /bitable/v1/apps/{app_token}/tables/{table_id}/records
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- view_id: string (optional)
- filter: string (optional, filter expression)
- sort: string (optional, sort expression)
- field_names: string (optional, comma-separated field names)
- text_field_as_array: boolean (default: true)
- user_id_type: string (open_id, union_id, user_id)
- page_size: integer (1-500, default: 20)
- page_token: string
```

**Filter Examples:**
- `CurrentValue.[Task Name] = "Implement user authentication"`
- `CurrentValue.[Status] = "In Progress"`
- `CurrentValue.[Due Date] > TODAY()`
- `AND(CurrentValue.[Priority] = "High", CurrentValue.[Status] != "Done")`

**Sort Examples:**
- `[Due Date] ASC`
- `[Priority] DESC, [Created Time] ASC`

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "items": [
      {
        "record_id": "recqwIwhc6",
        "created_by": {
          "id": "ou_84aad35d084aa403a838cf73ee18467",
          "name": "John Doe"
        },
        "created_time": 1640995200000,
        "last_modified_by": {
          "id": "ou_84aad35d084aa403a838cf73ee18467",
          "name": "John Doe"
        },
        "last_modified_time": 1640995200000,
        "fields": {
          "Task Name": "Implement user authentication",
          "Status": "To Do",
          "Due Date": 1640995200000,
          "Priority": "High"
        }
      }
    ],
    "page_token": "",
    "has_more": false,
    "total": 1
  }
}
```

### Update Record

```http
PATCH /bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "fields": {
    "Status": "In Progress",
    "Priority": "Medium"
  }
}
```

### Batch Update Records

```http
POST /bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_update
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "records": [
    {
      "record_id": "recqwIwhc6",
      "fields": {
        "Status": "Done"
      }
    },
    {
      "record_id": "recqwIwhc7",
      "fields": {
        "Status": "In Progress"
      }
    }
  ]
}
```

### Delete Record

```http
DELETE /bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

### Batch Delete Records

```http
POST /bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_delete
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "records": ["recqwIwhc6", "recqwIwhc7"]
}
```

## View Management APIs

### Create View

```http
POST /bitable/v1/apps/{app_token}/tables/{table_id}/views
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "view_name": "High Priority Tasks",
  "view_type": "grid"
}
```

**View Types:**
- `grid`: Grid view
- `kanban`: Kanban view
- `gallery`: Gallery view
- `gantt`: Gantt view
- `form`: Form view

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "view": {
      "view_id": "vewTpR1urZ",
      "view_name": "High Priority Tasks",
      "view_type": "grid"
    }
  }
}
```

### List Views

```http
GET /bitable/v1/apps/{app_token}/tables/{table_id}/views
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- page_size: integer (1-100, default: 20)
- page_token: string
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "items": [
      {
        "view_id": "vewTpR1urY",
        "view_name": "All Tasks",
        "view_type": "grid"
      },
      {
        "view_id": "vewTpR1urZ",
        "view_name": "High Priority Tasks",
        "view_type": "grid"
      }
    ],
    "page_token": "",
    "has_more": false,
    "total": 2
  }
}
```

### Get View

```http
GET /bitable/v1/apps/{app_token}/tables/{table_id}/views/{view_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

### Update View

```http
PATCH /bitable/v1/apps/{app_token}/tables/{table_id}/views/{view_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "view_name": "Critical Priority Tasks"
}
```

### Delete View

```http
DELETE /bitable/v1/apps/{app_token}/tables/{table_id}/views/{view_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

## Attachment Management APIs

### Upload Attachment

```http
POST /bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}/attachments
Authorization: Bearer <user_access_token>
Content-Type: multipart/form-data

Form Data:
- file: (binary file data)
- field_id: string (field ID for attachment field)
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "attachment_token": "boxcnrHpsg1QDqXAAAyachabcef",
    "name": "project_document.pdf",
    "size": 1024000,
    "mime_type": "application/pdf",
    "url": "https://example.feishu.cn/space/api/box/stream/download/asynccode/?code=..."
  }
}
```

### Get Attachment

```http
GET /bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}/attachments/{attachment_token}
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

## Required Scopes

To use these APIs, your app needs the following scopes:

### Read Operations
- `bitable:app:readonly` - Read database information
- `bitable:table:readonly` - Read table information
- `bitable:record:readonly` - Read record data

### Write Operations
- `bitable:app` - Full database access
- `bitable:table` - Full table access
- `bitable:record` - Full record access

### Specific Permissions
- `bitable:app:create` - Create databases
- `bitable:table:create` - Create tables
- `bitable:record:create` - Create records
- `bitable:field:create` - Create fields
- `bitable:view:create` - Create views

## Implementation Examples

### Example: Create Database with Table and Records

```javascript
async function createProjectDatabase(accessToken) {
  try {
    // Step 1: Create database
    const dbResponse = await axios.post(
      'https://open.feishu.cn/open-apis/bitable/v1/apps',
      {
        name: 'Project Management',
        description: 'Database for tracking project tasks'
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (dbResponse.data.code !== 0) {
      throw new Error(`Failed to create database: ${dbResponse.data.msg}`);
    }
    
    const appToken = dbResponse.data.data.app.app_token;
    
    // Step 2: Create table
    const tableResponse = await axios.post(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables`,
      {
        table: {
          name: 'Tasks',
          default_view_name: 'All Tasks',
          fields: [
            {
              field_name: 'Task Name',
              type: 1,
              property: {}
            },
            {
              field_name: 'Status',
              type: 3,
              property: {
                options: [
                  { name: 'To Do', color: 0 },
                  { name: 'In Progress', color: 1 },
                  { name: 'Done', color: 2 }
                ]
              }
            },
            {
              field_name: 'Due Date',
              type: 5,
              property: {
                date_format: 'yyyy/MM/dd',
                auto_fill: false
              }
            }
          ]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (tableResponse.data.code !== 0) {
      throw new Error(`Failed to create table: ${tableResponse.data.msg}`);
    }
    
    const tableId = tableResponse.data.data.table_id;
    
    // Step 3: Add sample records
    const recordsResponse = await axios.post(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`,
      {
        records: [
          {
            fields: {
              'Task Name': 'Setup project repository',
              'Status': 'Done',
              'Due Date': Date.now()
            }
          },
          {
            fields: {
              'Task Name': 'Design user interface',
              'Status': 'In Progress',
              'Due Date': Date.now() + 7 * 24 * 60 * 60 * 1000
            }
          },
          {
            fields: {
              'Task Name': 'Implement backend API',
              'Status': 'To Do',
              'Due Date': Date.now() + 14 * 24 * 60 * 60 * 1000
            }
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (recordsResponse.data.code !== 0) {
      throw new Error(`Failed to create records: ${recordsResponse.data.msg}`);
    }
    
    return {
      appToken: appToken,
      tableId: tableId,
      records: recordsResponse.data.data.records
    };
  } catch (error) {
    console.error('Failed to create project database:', error);
    throw error;
  }
}

// Usage
const database = await createProjectDatabase(userAccessToken);
console.log('Created database:', database);
```

### Example: Query Records with Filters

```javascript
async function queryTasksByStatus(accessToken, appToken, tableId, status) {
  try {
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          filter: `CurrentValue.[Status] = "${status}"`,
          sort: '[Due Date] ASC',
          page_size: 100
        }
      }
    );
    
    if (response.data.code === 0) {
      return response.data.data.items;
    } else {
      throw new Error(`API Error: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('Failed to query tasks:', error);
    throw error;
  }
}

// Usage
const inProgressTasks = await queryTasksByStatus(
  userAccessToken,
  'bascnCMII2ORuEjIDXsVms64n2c',
  'tblsRc9GRRXKqhvW',
  'In Progress'
);
console.log('In Progress tasks:', inProgressTasks);
```

### Example: Update Multiple Records

```javascript
async function updateTasksStatus(accessToken, appToken, tableId, updates) {
  try {
    const records = updates.map(update => ({
      record_id: update.recordId,
      fields: {
        'Status': update.newStatus
      }
    }));
    
    const response = await axios.post(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_update`,
      {
        records: records
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.code === 0) {
      return response.data.data.records;
    } else {
      throw new Error(`API Error: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('Failed to update tasks:', error);
    throw error;
  }
}

// Usage
const updates = [
  { recordId: 'recqwIwhc6', newStatus: 'Done' },
  { recordId: 'recqwIwhc7', newStatus: 'In Progress' }
];

const updatedRecords = await updateTasksStatus(
  userAccessToken,
  'bascnCMII2ORuEjIDXsVms64n2c',
  'tblsRc9GRRXKqhvW',
  updates
);
console.log('Updated records:', updatedRecords);
```

## Best Practices

1. **Data Modeling**: Plan your table structure and field types carefully before creation
2. **Batch Operations**: Use batch APIs for multiple operations to improve performance
3. **Filtering**: Use filters to reduce data transfer and improve query performance
4. **Field Types**: Choose appropriate field types for your data (dates, numbers, selections)
5. **Views**: Create custom views for different use cases and user groups
6. **Error Handling**: Always check response codes and handle errors gracefully
7. **Rate Limiting**: Respect API rate limits and implement retry logic
8. **Validation**: Validate data before creating or updating records

## Common Error Codes

- `1254201`: Invalid app token
- `1254202`: Invalid table ID
- `1254203`: Invalid record ID
- `1254204`: Invalid field ID
- `1254205`: Insufficient permissions
- `1254206`: Database not found
- `1254207`: Table not found
- `1254208`: Record not found
- `1254209`: Field not found
- `1254210`: Invalid field type
- `1254211`: Invalid filter expression
- `1254212`: Record limit exceeded