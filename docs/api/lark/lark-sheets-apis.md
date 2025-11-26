# Lark Sheets APIs

This document covers the Sheets APIs for managing spreadsheets, reading and writing data, and performing various spreadsheet operations in Lark.

## Table of Contents

1. [Overview](#overview)
2. [Spreadsheet Management APIs](#spreadsheet-management-apis)
3. [Sheet Operations APIs](#sheet-operations-apis)
4. [Data Reading APIs](#data-reading-apis)
5. [Data Writing APIs](#data-writing-apis)
6. [Formatting APIs](#formatting-apis)
7. [Formula and Function APIs](#formula-and-function-apis)
8. [Required Scopes](#required-scopes)
9. [Implementation Examples](#implementation-examples)

## Overview

The Lark Sheets APIs allow you to:
- Create and manage spreadsheets
- Read and write cell data
- Manage sheets within spreadsheets
- Apply formatting and styles
- Work with formulas and functions
- Handle collaborative editing

**Base URL**: `https://open.feishu.cn/open-apis/sheets/v4`

## Spreadsheet Management APIs

### Create Spreadsheet

```http
POST /sheets/v4/spreadsheets
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "title": "Project Budget 2024",
  "folder_token": "fldcnbDekqlcOGIUHMxRjiqg"
}
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "spreadsheet": {
      "spreadsheet_token": "shtcnmBA*yGehy8SI8scc2hh",
      "title": "Project Budget 2024",
      "owner_id": "ou_84aad35d084aa403a838cf73ee18467",
      "url": "https://example.feishu.cn/sheets/shtcnmBA*yGehy8SI8scc2hh",
      "sheets": [
        {
          "sheet_id": "0b**12",
          "title": "Sheet1",
          "index": 0,
          "hidden": false,
          "grid_properties": {
            "frozen_row_count": 0,
            "frozen_column_count": 0,
            "row_count": 200,
            "column_count": 20
          }
        }
      ]
    }
  }
}
```

### Get Spreadsheet Information

```http
GET /sheets/v4/spreadsheets/{spreadsheet_token}
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
    "spreadsheet": {
      "spreadsheet_token": "shtcnmBA*yGehy8SI8scc2hh",
      "title": "Project Budget 2024",
      "owner_id": "ou_84aad35d084aa403a838cf73ee18467",
      "url": "https://example.feishu.cn/sheets/shtcnmBA*yGehy8SI8scc2hh",
      "sheets": [
        {
          "sheet_id": "0b**12",
          "title": "Budget Overview",
          "index": 0,
          "hidden": false,
          "grid_properties": {
            "frozen_row_count": 1,
            "frozen_column_count": 1,
            "row_count": 200,
            "column_count": 20
          }
        },
        {
          "sheet_id": "0b**13",
          "title": "Expenses",
          "index": 1,
          "hidden": false,
          "grid_properties": {
            "frozen_row_count": 0,
            "frozen_column_count": 0,
            "row_count": 100,
            "column_count": 15
          }
        }
      ]
    }
  }
}
```

### Update Spreadsheet Properties

```http
PATCH /sheets/v4/spreadsheets/{spreadsheet_token}/properties
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "title": "Updated Project Budget 2024"
}
```

## Sheet Operations APIs

### Create Sheet

```http
POST /sheets/v4/spreadsheets/{spreadsheet_token}/sheets
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "title": "Q1 Analysis",
  "index": 1,
  "hidden": false,
  "grid_properties": {
    "frozen_row_count": 1,
    "frozen_column_count": 2,
    "row_count": 150,
    "column_count": 25
  }
}
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "sheet": {
      "sheet_id": "0b**14",
      "title": "Q1 Analysis",
      "index": 1,
      "hidden": false,
      "grid_properties": {
        "frozen_row_count": 1,
        "frozen_column_count": 2,
        "row_count": 150,
        "column_count": 25
      }
    }
  }
}
```

### Get Sheet Information

```http
GET /sheets/v4/spreadsheets/{spreadsheet_token}/sheets/{sheet_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

### Update Sheet Properties

```http
PATCH /sheets/v4/spreadsheets/{spreadsheet_token}/sheets/{sheet_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "title": "Q1 Financial Analysis",
  "hidden": false,
  "grid_properties": {
    "frozen_row_count": 2,
    "frozen_column_count": 1
  }
}
```

### Delete Sheet

```http
DELETE /sheets/v4/spreadsheets/{spreadsheet_token}/sheets/{sheet_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

## Data Reading APIs

### Read Single Range

```http
GET /sheets/v4/spreadsheets/{spreadsheet_token}/values/{range}
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- valueRenderOption: string (FormattedValue, UnformattedValue, Formula)
- dateTimeRenderOption: string (SerialNumber, FormattedString)
- user_id_type: string (open_id, union_id, user_id)
```

**Example Range Formats:**
- `Sheet1!A1:C10` - Specific range
- `Sheet1!A:C` - Entire columns
- `Sheet1!1:5` - Entire rows
- `Sheet1` - Entire sheet

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "values": [
      ["Name", "Department", "Salary"],
      ["John Doe", "Engineering", "75000"],
      ["Jane Smith", "Marketing", "65000"],
      ["Bob Johnson", "Sales", "70000"]
    ],
    "range": "Sheet1!A1:C4",
    "revision": 12
  }
}
```

### Read Multiple Ranges

```http
POST /sheets/v4/spreadsheets/{spreadsheet_token}/values/batch_get
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "ranges": [
    "Sheet1!A1:C10",
    "Sheet2!E1:G5"
  ],
  "valueRenderOption": "FormattedValue",
  "dateTimeRenderOption": "FormattedString"
}
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "valueRanges": [
      {
        "range": "Sheet1!A1:C10",
        "values": [
          ["Header1", "Header2", "Header3"],
          ["Data1", "Data2", "Data3"]
        ]
      },
      {
        "range": "Sheet2!E1:G5",
        "values": [
          ["Col1", "Col2", "Col3"],
          ["Value1", "Value2", "Value3"]
        ]
      }
    ],
    "revision": 15
  }
}
```

## Data Writing APIs

### Write Single Range

```http
PUT /sheets/v4/spreadsheets/{spreadsheet_token}/values/{range}
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "values": [
    ["Product", "Price", "Quantity"],
    ["Laptop", "1200", "10"],
    ["Mouse", "25", "50"],
    ["Keyboard", "75", "30"]
  ],
  "valueInputOption": "USER_ENTERED"
}
```

**Value Input Options:**
- `RAW` - Values are stored as-is
- `USER_ENTERED` - Values are parsed as if typed by user (formulas, dates, etc.)

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "spreadsheet_token": "shtcnmBA*yGehy8SI8scc2hh",
    "updated_range": "Sheet1!A1:C4",
    "updated_rows": 4,
    "updated_columns": 3,
    "updated_cells": 12,
    "revision": 16
  }
}
```

### Write Multiple Ranges

```http
POST /sheets/v4/spreadsheets/{spreadsheet_token}/values/batch_update
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "valueInputOption": "USER_ENTERED",
  "data": [
    {
      "range": "Sheet1!A1:B2",
      "values": [
        ["Name", "Age"],
        ["Alice", "25"]
      ]
    },
    {
      "range": "Sheet1!D1:E2",
      "values": [
        ["City", "Country"],
        ["New York", "USA"]
      ]
    }
  ]
}
```

### Append Data

```http
POST /sheets/v4/spreadsheets/{spreadsheet_token}/values/{range}:append
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "values": [
    ["New Product", "150", "20"],
    ["Another Product", "200", "15"]
  ],
  "valueInputOption": "USER_ENTERED",
  "insertDataOption": "INSERT_ROWS"
}
```

**Insert Data Options:**
- `OVERWRITE` - Overwrite existing data
- `INSERT_ROWS` - Insert new rows for the data

### Clear Data

```http
POST /sheets/v4/spreadsheets/{spreadsheet_token}/values/{range}:clear
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

## Formatting APIs

### Apply Cell Formatting

```http
POST /sheets/v4/spreadsheets/{spreadsheet_token}:batchUpdate
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "requests": [
    {
      "repeatCell": {
        "range": {
          "sheetId": "0b**12",
          "startRowIndex": 0,
          "endRowIndex": 1,
          "startColumnIndex": 0,
          "endColumnIndex": 3
        },
        "cell": {
          "userEnteredFormat": {
            "backgroundColor": {
              "red": 0.2,
              "green": 0.6,
              "blue": 1.0
            },
            "textFormat": {
              "foregroundColor": {
                "red": 1.0,
                "green": 1.0,
                "blue": 1.0
              },
              "fontSize": 12,
              "bold": true
            },
            "horizontalAlignment": "CENTER",
            "verticalAlignment": "MIDDLE"
          }
        },
        "fields": "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)"
      }
    }
  ]
}
```

### Set Column Width

```http
POST /sheets/v4/spreadsheets/{spreadsheet_token}:batchUpdate
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "requests": [
    {
      "updateDimensionProperties": {
        "range": {
          "sheetId": "0b**12",
          "dimension": "COLUMNS",
          "startIndex": 0,
          "endIndex": 3
        },
        "properties": {
          "pixelSize": 150
        },
        "fields": "pixelSize"
      }
    }
  ]
}
```

### Set Row Height

```http
POST /sheets/v4/spreadsheets/{spreadsheet_token}:batchUpdate
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "requests": [
    {
      "updateDimensionProperties": {
        "range": {
          "sheetId": "0b**12",
          "dimension": "ROWS",
          "startIndex": 0,
          "endIndex": 5
        },
        "properties": {
          "pixelSize": 30
        },
        "fields": "pixelSize"
      }
    }
  ]
}
```

## Formula and Function APIs

### Insert Formulas

```http
PUT /sheets/v4/spreadsheets/{spreadsheet_token}/values/Sheet1!D1:D5
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "values": [
    ["=SUM(B1:C1)"],
    ["=B2*C2"],
    ["=AVERAGE(B1:B3)"],
    ["=IF(B4>100,\"High\",\"Low\")"],
    ["=TODAY()"]
  ],
  "valueInputOption": "USER_ENTERED"
}
```

### Common Formula Examples

| Formula Type | Example | Description |
|--------------|---------|-------------|
| Sum | `=SUM(A1:A10)` | Sum of range |
| Average | `=AVERAGE(B1:B10)` | Average of range |
| Count | `=COUNT(C1:C10)` | Count numbers |
| If Statement | `=IF(A1>10,"High","Low")` | Conditional logic |
| Lookup | `=VLOOKUP(A1,B:D,2,FALSE)` | Vertical lookup |
| Date | `=TODAY()` | Current date |
| Text | `=CONCATENATE(A1," ",B1)` | Join text |

## Required Scopes

To use these APIs, your app needs the following scopes:

### Read Operations
- `sheets:spreadsheet:readonly` - Read spreadsheet information
- `sheets:sheet:readonly` - Read sheet information
- `drive:drive:readonly` - Access files in drive

### Write Operations
- `sheets:spreadsheet` - Full spreadsheet access
- `sheets:sheet` - Full sheet access
- `drive:drive` - Full drive access

### Specific Permissions
- `sheets:spreadsheet:create` - Create spreadsheets
- `sheets:spreadsheet:edit` - Edit spreadsheet properties
- `sheets:sheet:create` - Create sheets
- `sheets:sheet:edit` - Edit sheet properties

## Implementation Examples

### Example: Read Spreadsheet Data

```javascript
async function readSpreadsheetData(accessToken, spreadsheetToken, range) {
  try {
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/sheets/v4/spreadsheets/${spreadsheetToken}/values/${encodeURIComponent(range)}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          valueRenderOption: 'FormattedValue',
          dateTimeRenderOption: 'FormattedString'
        }
      }
    );
    
    if (response.data.code === 0) {
      return response.data.data.values;
    } else {
      throw new Error(`API Error: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('Failed to read spreadsheet data:', error);
    throw error;
  }
}

// Usage
const data = await readSpreadsheetData(
  userAccessToken,
  'shtcnmBA*yGehy8SI8scc2hh',
  'Sheet1!A1:C10'
);
console.log('Spreadsheet data:', data);
```

### Example: Write Data to Spreadsheet

```javascript
async function writeSpreadsheetData(accessToken, spreadsheetToken, range, values) {
  try {
    const response = await axios.put(
      `https://open.feishu.cn/open-apis/sheets/v4/spreadsheets/${spreadsheetToken}/values/${encodeURIComponent(range)}`,
      {
        values: values,
        valueInputOption: 'USER_ENTERED'
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.code === 0) {
      return response.data.data;
    } else {
      throw new Error(`API Error: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('Failed to write spreadsheet data:', error);
    throw error;
  }
}

// Usage
const result = await writeSpreadsheetData(
  userAccessToken,
  'shtcnmBA*yGehy8SI8scc2hh',
  'Sheet1!A1:C3',
  [
    ['Name', 'Age', 'City'],
    ['John', '30', 'New York'],
    ['Jane', '25', 'San Francisco']
  ]
);
console.log('Write result:', result);
```

### Example: Create and Format Spreadsheet

```javascript
async function createFormattedSpreadsheet(accessToken, title, data) {
  try {
    // Step 1: Create spreadsheet
    const createResponse = await axios.post(
      'https://open.feishu.cn/open-apis/sheets/v4/spreadsheets',
      {
        title: title
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (createResponse.data.code !== 0) {
      throw new Error(`Failed to create spreadsheet: ${createResponse.data.msg}`);
    }
    
    const spreadsheetToken = createResponse.data.data.spreadsheet.spreadsheet_token;
    const sheetId = createResponse.data.data.spreadsheet.sheets[0].sheet_id;
    
    // Step 2: Add data
    await axios.put(
      `https://open.feishu.cn/open-apis/sheets/v4/spreadsheets/${spreadsheetToken}/values/Sheet1!A1`,
      {
        values: data,
        valueInputOption: 'USER_ENTERED'
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Step 3: Format header row
    await axios.post(
      `https://open.feishu.cn/open-apis/sheets/v4/spreadsheets/${spreadsheetToken}:batchUpdate`,
      {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: data[0].length
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.2,
                    green: 0.6,
                    blue: 1.0
                  },
                  textFormat: {
                    foregroundColor: {
                      red: 1.0,
                      green: 1.0,
                      blue: 1.0
                    },
                    bold: true
                  },
                  horizontalAlignment: 'CENTER'
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
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
    
    return {
      spreadsheetToken: spreadsheetToken,
      url: createResponse.data.data.spreadsheet.url
    };
  } catch (error) {
    console.error('Failed to create formatted spreadsheet:', error);
    throw error;
  }
}

// Usage
const spreadsheet = await createFormattedSpreadsheet(
  userAccessToken,
  'Employee Data',
  [
    ['Name', 'Department', 'Salary', 'Start Date'],
    ['John Doe', 'Engineering', '75000', '2023-01-15'],
    ['Jane Smith', 'Marketing', '65000', '2023-02-01']
  ]
);
console.log('Created spreadsheet:', spreadsheet);
```

## Best Practices

1. **Batch Operations**: Use batch APIs for multiple operations to reduce API calls
2. **Range Optimization**: Use specific ranges instead of entire sheets when possible
3. **Error Handling**: Always check response codes and handle errors gracefully
4. **Rate Limiting**: Respect API rate limits and implement retry logic
5. **Data Validation**: Validate data before writing to spreadsheets
6. **Formatting**: Apply formatting after data insertion for better performance
7. **Caching**: Cache spreadsheet metadata to reduce API calls

## Common Error Codes

- `1254101`: Invalid spreadsheet token
- `1254102`: Invalid sheet ID
- `1254103`: Invalid range format
- `1254104`: Insufficient permissions
- `1254105`: Spreadsheet not found
- `1254106`: Sheet not found
- `1254107`: Range out of bounds
- `1254108`: Invalid formula syntax