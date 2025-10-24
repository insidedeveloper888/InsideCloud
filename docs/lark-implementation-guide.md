# Lark API Implementation Guide

This guide provides practical examples and best practices for implementing Lark APIs in your web application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication Setup](#authentication-setup)
3. [Common Implementation Patterns](#common-implementation-patterns)
4. [Real-world Examples](#real-world-examples)
5. [Error Handling](#error-handling)
6. [Performance Optimization](#performance-optimization)
7. [Security Best Practices](#security-best-practices)
8. [Testing Strategies](#testing-strategies)
9. [Deployment Considerations](#deployment-considerations)

## Getting Started

### Prerequisites

Before implementing Lark APIs, ensure you have:

1. **Lark Developer Account**: Register at [Lark Developer Console](https://open.feishu.cn/)
2. **App Credentials**: App ID, App Secret from your Lark app
3. **Required Scopes**: Proper permissions for your use case
4. **Development Environment**: Node.js, appropriate SDK or HTTP client

### Project Structure

```
project/
├── src/
│   ├── services/
│   │   ├── lark/
│   │   │   ├── auth.js          # Authentication service
│   │   │   ├── contacts.js      # Contact management
│   │   │   ├── messaging.js     # Messaging operations
│   │   │   ├── sheets.js        # Spreadsheet operations
│   │   │   └── index.js         # Main Lark service
│   │   └── api/
│   │       └── lark-routes.js   # API routes
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── utils/
│   │   ├── lark-client.js       # HTTP client configuration
│   │   └── error-handler.js     # Error handling utilities
│   └── config/
│       └── lark.js              # Lark configuration
├── tests/
│   └── lark/                    # Test files
└── docs/                        # API documentation
```

## Authentication Setup

### 1. Environment Configuration

Create a `.env` file with your Lark app credentials:

```env
# Lark App Configuration
LARK_APP_ID=cli_a1b2c3d4e5f6g7h8
LARK_APP_SECRET=your_app_secret_here
LARK_ENCRYPT_KEY=your_encrypt_key_here
LARK_VERIFICATION_TOKEN=your_verification_token_here

# API Configuration
LARK_BASE_URL=https://open.feishu.cn/open-apis
LARK_TIMEOUT=30000

# Environment
NODE_ENV=development
```

### 2. Configuration Module

```javascript
// src/config/lark.js
const config = {
  appId: process.env.LARK_APP_ID,
  appSecret: process.env.LARK_APP_SECRET,
  encryptKey: process.env.LARK_ENCRYPT_KEY,
  verificationToken: process.env.LARK_VERIFICATION_TOKEN,
  baseUrl: process.env.LARK_BASE_URL || 'https://open.feishu.cn/open-apis',
  timeout: parseInt(process.env.LARK_TIMEOUT) || 30000,
  
  // Token cache settings
  tokenCache: {
    tenantTokenKey: 'lark:tenant_token',
    userTokenKey: 'lark:user_token',
    ttl: 7200 // 2 hours in seconds
  },
  
  // Rate limiting
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000 // 1 minute
  }
};

module.exports = config;
```

### 3. Authentication Service

```javascript
// src/services/lark/auth.js
const axios = require('axios');
const config = require('../../config/lark');

class LarkAuthService {
  constructor() {
    this.tenantToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get tenant access token
   */
  async getTenantAccessToken() {
    // Check if current token is still valid
    if (this.tenantToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.tenantToken;
    }

    try {
      const response = await axios.post(
        `${config.baseUrl}/auth/v3/tenant_access_token/internal`,
        {
          app_id: config.appId,
          app_secret: config.appSecret
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: config.timeout
        }
      );

      if (response.data.code !== 0) {
        throw new Error(`Failed to get tenant token: ${response.data.msg}`);
      }

      this.tenantToken = response.data.tenant_access_token;
      this.tokenExpiry = Date.now() + (response.data.expire * 1000);

      return this.tenantToken;
    } catch (error) {
      console.error('Error getting tenant access token:', error);
      throw error;
    }
  }

  /**
   * Get user access token using authorization code
   */
  async getUserAccessToken(code) {
    try {
      const tenantToken = await this.getTenantAccessToken();
      
      const response = await axios.post(
        `${config.baseUrl}/authen/v1/access_token`,
        {
          grant_type: 'authorization_code',
          code: code
        },
        {
          headers: {
            'Authorization': `Bearer ${tenantToken}`,
            'Content-Type': 'application/json'
          },
          timeout: config.timeout
        }
      );

      if (response.data.code !== 0) {
        throw new Error(`Failed to get user token: ${response.data.msg}`);
      }

      return {
        access_token: response.data.data.access_token,
        refresh_token: response.data.data.refresh_token,
        expires_in: response.data.data.expires_in,
        token_type: response.data.data.token_type
      };
    } catch (error) {
      console.error('Error getting user access token:', error);
      throw error;
    }
  }

  /**
   * Refresh user access token
   */
  async refreshUserAccessToken(refreshToken) {
    try {
      const tenantToken = await this.getTenantAccessToken();
      
      const response = await axios.post(
        `${config.baseUrl}/authen/v1/refresh_access_token`,
        {
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        },
        {
          headers: {
            'Authorization': `Bearer ${tenantToken}`,
            'Content-Type': 'application/json'
          },
          timeout: config.timeout
        }
      );

      if (response.data.code !== 0) {
        throw new Error(`Failed to refresh token: ${response.data.msg}`);
      }

      return {
        access_token: response.data.data.access_token,
        refresh_token: response.data.data.refresh_token,
        expires_in: response.data.data.expires_in,
        token_type: response.data.data.token_type
      };
    } catch (error) {
      console.error('Error refreshing user access token:', error);
      throw error;
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl(redirectUri, state = null) {
    const params = new URLSearchParams({
      app_id: config.appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'contact:user.base:readonly contact:user.employee_id:readonly'
    });

    if (state) {
      params.append('state', state);
    }

    return `https://open.feishu.cn/open-apis/authen/v1/authorize?${params.toString()}`;
  }
}

module.exports = new LarkAuthService();
```

### 4. HTTP Client Utility

```javascript
// src/utils/lark-client.js
const axios = require('axios');
const config = require('../config/lark');
const authService = require('../services/lark/auth');

class LarkClient {
  constructor() {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor to add authentication
    this.client.interceptors.request.use(
      async (config) => {
        if (!config.headers.Authorization) {
          const token = await authService.getTenantAccessToken();
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        if (response.data.code !== 0) {
          const error = new Error(response.data.msg || 'API request failed');
          error.code = response.data.code;
          error.response = response;
          throw error;
        }
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expired, clear cached token
          authService.tenantToken = null;
          authService.tokenExpiry = null;
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Make authenticated request with user token
   */
  async requestWithUserToken(userToken, method, url, data = null) {
    const config = {
      method,
      url,
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    return this.client.request(config);
  }

  /**
   * Make authenticated request with tenant token
   */
  async request(method, url, data = null) {
    const config = {
      method,
      url
    };

    if (data) {
      config.data = data;
    }

    return this.client.request(config);
  }
}

module.exports = new LarkClient();
```

## Common Implementation Patterns

### 1. Service Layer Pattern

```javascript
// src/services/lark/contacts.js
const larkClient = require('../../utils/lark-client');

class ContactService {
  /**
   * Get user information
   */
  async getUser(userId, userIdType = 'open_id') {
    try {
      const response = await larkClient.request(
        'GET',
        `/contact/v3/users/${userId}?user_id_type=${userIdType}`
      );
      return response.data.data.user;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * List users with pagination
   */
  async listUsers(options = {}) {
    try {
      const params = new URLSearchParams({
        user_id_type: options.userIdType || 'open_id',
        department_id_type: options.departmentIdType || 'open_department_id',
        page_size: options.pageSize || 50
      });

      if (options.pageToken) {
        params.append('page_token', options.pageToken);
      }

      if (options.departmentId) {
        params.append('department_id', options.departmentId);
      }

      const response = await larkClient.request(
        'GET',
        `/contact/v3/users?${params.toString()}`
      );

      return {
        users: response.data.data.items,
        hasMore: response.data.data.has_more,
        pageToken: response.data.data.page_token
      };
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  }

  /**
   * Get all users (handles pagination automatically)
   */
  async getAllUsers(departmentId = null) {
    const allUsers = [];
    let pageToken = null;
    let hasMore = true;

    while (hasMore) {
      const result = await this.listUsers({
        departmentId,
        pageToken,
        pageSize: 100
      });

      allUsers.push(...result.users);
      hasMore = result.hasMore;
      pageToken = result.pageToken;
    }

    return allUsers;
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query) {
    try {
      const allUsers = await this.getAllUsers();
      
      return allUsers.filter(user => {
        const name = user.name?.toLowerCase() || '';
        const email = user.enterprise_email?.toLowerCase() || '';
        const queryLower = query.toLowerCase();
        
        return name.includes(queryLower) || email.includes(queryLower);
      });
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
}

module.exports = new ContactService();
```

### 2. Repository Pattern

```javascript
// src/services/lark/messaging.js
const larkClient = require('../../utils/lark-client');

class MessagingService {
  /**
   * Send text message
   */
  async sendTextMessage(receiveId, text, receiveIdType = 'open_id') {
    try {
      const response = await larkClient.request(
        'POST',
        `/im/v1/messages?receive_id_type=${receiveIdType}`,
        {
          receive_id: receiveId,
          msg_type: 'text',
          content: JSON.stringify({ text })
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error sending text message:', error);
      throw error;
    }
  }

  /**
   * Send rich text message
   */
  async sendRichTextMessage(receiveId, elements, receiveIdType = 'open_id') {
    try {
      const response = await larkClient.request(
        'POST',
        `/im/v1/messages?receive_id_type=${receiveIdType}`,
        {
          receive_id: receiveId,
          msg_type: 'post',
          content: JSON.stringify({
            post: {
              en_us: {
                title: '',
                content: elements
              }
            }
          })
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error sending rich text message:', error);
      throw error;
    }
  }

  /**
   * Upload and send image
   */
  async sendImageMessage(receiveId, imageBuffer, receiveIdType = 'open_id') {
    try {
      // First upload the image
      const FormData = require('form-data');
      const form = new FormData();
      form.append('image_type', 'message');
      form.append('image', imageBuffer, 'image.png');

      const uploadResponse = await larkClient.client.post('/im/v1/images', form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${await authService.getTenantAccessToken()}`
        }
      });

      if (uploadResponse.data.code !== 0) {
        throw new Error(`Failed to upload image: ${uploadResponse.data.msg}`);
      }

      const imageKey = uploadResponse.data.data.image_key;

      // Then send the message with image
      const response = await larkClient.request(
        'POST',
        `/im/v1/messages?receive_id_type=${receiveIdType}`,
        {
          receive_id: receiveId,
          msg_type: 'image',
          content: JSON.stringify({ image_key: imageKey })
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('Error sending image message:', error);
      throw error;
    }
  }

  /**
   * Create group chat
   */
  async createGroupChat(name, description, userIds, userIdType = 'open_id') {
    try {
      const response = await larkClient.request(
        'POST',
        `/im/v1/chats?user_id_type=${userIdType}`,
        {
          name,
          description,
          user_id_list: userIds
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error creating group chat:', error);
      throw error;
    }
  }

  /**
   * Add members to chat
   */
  async addChatMembers(chatId, userIds, userIdType = 'open_id') {
    try {
      const response = await larkClient.request(
        'POST',
        `/im/v1/chats/${chatId}/members?user_id_type=${userIdType}`,
        {
          id_list: userIds
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error adding chat members:', error);
      throw error;
    }
  }
}

module.exports = new MessagingService();
```

## Real-world Examples

### 1. Employee Directory Integration

```javascript
// src/services/lark/employee-directory.js
const contactService = require('./contacts');
const messagingService = require('./messaging');

class EmployeeDirectoryService {
  /**
   * Get complete employee directory with department structure
   */
  async getEmployeeDirectory() {
    try {
      // Get all departments
      const departments = await this.getAllDepartments();
      
      // Get all users
      const users = await contactService.getAllUsers();
      
      // Build directory structure
      const directory = departments.map(dept => ({
        id: dept.open_department_id,
        name: dept.name,
        parentId: dept.parent_department_id,
        employees: users.filter(user => 
          user.department_ids?.includes(dept.open_department_id)
        ).map(user => ({
          id: user.open_id,
          name: user.name,
          email: user.enterprise_email,
          mobile: user.mobile,
          avatar: user.avatar?.avatar_240,
          jobTitle: user.job_title,
          employeeId: user.employee_id
        }))
      }));

      return this.buildHierarchy(directory);
    } catch (error) {
      console.error('Error getting employee directory:', error);
      throw error;
    }
  }

  /**
   * Search employees across the organization
   */
  async searchEmployees(query, filters = {}) {
    try {
      const users = await contactService.getAllUsers();
      
      let filteredUsers = users.filter(user => {
        const name = user.name?.toLowerCase() || '';
        const email = user.enterprise_email?.toLowerCase() || '';
        const jobTitle = user.job_title?.toLowerCase() || '';
        const queryLower = query.toLowerCase();
        
        return name.includes(queryLower) || 
               email.includes(queryLower) || 
               jobTitle.includes(queryLower);
      });

      // Apply filters
      if (filters.departmentId) {
        filteredUsers = filteredUsers.filter(user =>
          user.department_ids?.includes(filters.departmentId)
        );
      }

      if (filters.status) {
        filteredUsers = filteredUsers.filter(user =>
          user.status?.is_activated === (filters.status === 'active')
        );
      }

      return filteredUsers.map(user => ({
        id: user.open_id,
        name: user.name,
        email: user.enterprise_email,
        mobile: user.mobile,
        avatar: user.avatar?.avatar_240,
        jobTitle: user.job_title,
        employeeId: user.employee_id,
        departments: user.department_ids
      }));
    } catch (error) {
      console.error('Error searching employees:', error);
      throw error;
    }
  }

  /**
   * Send welcome message to new employee
   */
  async sendWelcomeMessage(employeeId, managerInfo) {
    try {
      const welcomeElements = [
        [
          {
            tag: 'text',
            text: `Welcome to the team! 🎉\n\n`
          }
        ],
        [
          {
            tag: 'text',
            text: `Hi there! I'm ${managerInfo.name}, your manager. `
          },
          {
            tag: 'text',
            text: `Feel free to reach out if you have any questions.\n\n`
          }
        ],
        [
          {
            tag: 'text',
            text: 'Here are some helpful resources:\n'
          }
        ],
        [
          {
            tag: 'a',
            text: '📚 Employee Handbook',
            href: 'https://company.com/handbook'
          }
        ],
        [
          {
            tag: 'a',
            text: '🏢 Office Guide',
            href: 'https://company.com/office-guide'
          }
        ],
        [
          {
            tag: 'a',
            text: '💻 IT Setup',
            href: 'https://company.com/it-setup'
          }
        ]
      ];

      return await messagingService.sendRichTextMessage(
        employeeId,
        welcomeElements,
        'open_id'
      );
    } catch (error) {
      console.error('Error sending welcome message:', error);
      throw error;
    }
  }

  /**
   * Build department hierarchy
   */
  buildHierarchy(departments) {
    const departmentMap = new Map();
    const rootDepartments = [];

    // Create map for quick lookup
    departments.forEach(dept => {
      departmentMap.set(dept.id, { ...dept, children: [] });
    });

    // Build hierarchy
    departments.forEach(dept => {
      if (dept.parentId && departmentMap.has(dept.parentId)) {
        departmentMap.get(dept.parentId).children.push(departmentMap.get(dept.id));
      } else {
        rootDepartments.push(departmentMap.get(dept.id));
      }
    });

    return rootDepartments;
  }

  /**
   * Get all departments
   */
  async getAllDepartments() {
    try {
      const response = await larkClient.request(
        'GET',
        '/contact/v3/departments?department_id_type=open_department_id&page_size=50'
      );
      return response.data.data.items;
    } catch (error) {
      console.error('Error getting departments:', error);
      throw error;
    }
  }
}

module.exports = new EmployeeDirectoryService();
```

### 2. Meeting Room Booking System

```javascript
// src/services/lark/meeting-rooms.js
const larkClient = require('../../utils/lark-client');

class MeetingRoomService {
  /**
   * Get available meeting rooms
   */
  async getAvailableRooms(startTime, endTime) {
    try {
      // Get all meeting rooms
      const roomsResponse = await larkClient.request(
        'GET',
        '/vc/v1/room_levels/query'
      );

      const rooms = roomsResponse.data.data.room_levels;
      const availableRooms = [];

      // Check availability for each room
      for (const room of rooms) {
        const isAvailable = await this.checkRoomAvailability(
          room.room_level_id,
          startTime,
          endTime
        );

        if (isAvailable) {
          availableRooms.push({
            id: room.room_level_id,
            name: room.name,
            capacity: room.capacity,
            location: room.location,
            equipment: room.equipment
          });
        }
      }

      return availableRooms;
    } catch (error) {
      console.error('Error getting available rooms:', error);
      throw error;
    }
  }

  /**
   * Book meeting room
   */
  async bookMeetingRoom(roomId, startTime, endTime, title, attendees) {
    try {
      // Create calendar event with room booking
      const response = await larkClient.request(
        'POST',
        '/calendar/v4/calendars/primary/events',
        {
          summary: title,
          start_time: {
            timestamp: Math.floor(new Date(startTime).getTime() / 1000).toString()
          },
          end_time: {
            timestamp: Math.floor(new Date(endTime).getTime() / 1000).toString()
          },
          attendee_ability: 'can_see_others',
          free_busy_status: 'busy',
          location: {
            name: `Meeting Room ${roomId}`
          },
          attendees: attendees.map(attendee => ({
            type: 'user',
            attendee_id: attendee.id,
            rsvp_status: 'needs_action'
          })),
          meeting_rooms: [
            {
              room_id: roomId
            }
          ]
        }
      );

      return response.data.data.event;
    } catch (error) {
      console.error('Error booking meeting room:', error);
      throw error;
    }
  }

  /**
   * Check room availability
   */
  async checkRoomAvailability(roomId, startTime, endTime) {
    try {
      const response = await larkClient.request(
        'POST',
        '/calendar/v4/freebusy/query',
        {
          time_min: Math.floor(new Date(startTime).getTime() / 1000).toString(),
          time_max: Math.floor(new Date(endTime).getTime() / 1000).toString(),
          room_ids: [roomId]
        }
      );

      const freeBusyData = response.data.data.freebusy_list[0];
      return freeBusyData.busy_times.length === 0;
    } catch (error) {
      console.error('Error checking room availability:', error);
      return false;
    }
  }

  /**
   * Get room booking history
   */
  async getRoomBookingHistory(roomId, startDate, endDate) {
    try {
      const response = await larkClient.request(
        'GET',
        `/calendar/v4/calendars/primary/events?start_time=${Math.floor(new Date(startDate).getTime() / 1000)}&end_time=${Math.floor(new Date(endDate).getTime() / 1000)}`
      );

      const events = response.data.data.items;
      
      return events.filter(event => 
        event.meeting_rooms?.some(room => room.room_id === roomId)
      ).map(event => ({
        id: event.event_id,
        title: event.summary,
        startTime: new Date(parseInt(event.start_time.timestamp) * 1000),
        endTime: new Date(parseInt(event.end_time.timestamp) * 1000),
        organizer: event.organizer,
        attendees: event.attendees?.length || 0
      }));
    } catch (error) {
      console.error('Error getting room booking history:', error);
      throw error;
    }
  }
}

module.exports = new MeetingRoomService();
```

### 3. Document Collaboration System

```javascript
// src/services/lark/documents.js
const larkClient = require('../../utils/lark-client');

class DocumentService {
  /**
   * Create collaborative spreadsheet
   */
  async createCollaborativeSpreadsheet(title, collaborators) {
    try {
      // Create spreadsheet
      const response = await larkClient.request(
        'POST',
        '/sheets/v3/spreadsheets',
        {
          title: title,
          folder_token: '' // Root folder
        }
      );

      const spreadsheetToken = response.data.data.spreadsheet.spreadsheet_token;

      // Add collaborators
      for (const collaborator of collaborators) {
        await this.addCollaborator(
          spreadsheetToken,
          collaborator.id,
          collaborator.permission || 'edit'
        );
      }

      return {
        token: spreadsheetToken,
        url: response.data.data.spreadsheet.url,
        title: title
      };
    } catch (error) {
      console.error('Error creating collaborative spreadsheet:', error);
      throw error;
    }
  }

  /**
   * Add collaborator to document
   */
  async addCollaborator(documentToken, userId, permission = 'edit') {
    try {
      const response = await larkClient.request(
        'POST',
        `/drive/v1/permissions/${documentToken}/members`,
        {
          member_type: 'user',
          member_id: userId,
          perm: permission // view, edit, full_access
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('Error adding collaborator:', error);
      throw error;
    }
  }

  /**
   * Create project tracking sheet
   */
  async createProjectTrackingSheet(projectName, teamMembers, tasks) {
    try {
      const spreadsheet = await this.createCollaborativeSpreadsheet(
        `${projectName} - Project Tracker`,
        teamMembers
      );

      // Set up headers
      const headers = [
        'Task ID', 'Task Name', 'Assignee', 'Status', 
        'Priority', 'Start Date', 'Due Date', 'Progress', 'Notes'
      ];

      await larkClient.request(
        'PUT',
        `/sheets/v2/spreadsheets/${spreadsheet.token}/values/A1:I1`,
        {
          valueRange: {
            values: [headers]
          }
        }
      );

      // Add tasks
      if (tasks && tasks.length > 0) {
        const taskRows = tasks.map((task, index) => [
          `TASK-${String(index + 1).padStart(3, '0')}`,
          task.name,
          task.assignee,
          task.status || 'Not Started',
          task.priority || 'Medium',
          task.startDate || '',
          task.dueDate || '',
          task.progress || '0%',
          task.notes || ''
        ]);

        await larkClient.request(
          'PUT',
          `/sheets/v2/spreadsheets/${spreadsheet.token}/values/A2:I${taskRows.length + 1}`,
          {
            valueRange: {
              values: taskRows
            }
          }
        );
      }

      // Format headers
      await this.formatHeaders(spreadsheet.token, 'A1:I1');

      return spreadsheet;
    } catch (error) {
      console.error('Error creating project tracking sheet:', error);
      throw error;
    }
  }

  /**
   * Format spreadsheet headers
   */
  async formatHeaders(spreadsheetToken, range) {
    try {
      await larkClient.request(
        'PUT',
        `/sheets/v2/spreadsheets/${spreadsheetToken}/style`,
        {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 9
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
                    }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)'
              }
            }
          ]
        }
      );
    } catch (error) {
      console.error('Error formatting headers:', error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Update task status in tracking sheet
   */
  async updateTaskStatus(spreadsheetToken, taskId, status, progress) {
    try {
      // Find the task row
      const response = await larkClient.request(
        'GET',
        `/sheets/v2/spreadsheets/${spreadsheetToken}/values/A:I`
      );

      const rows = response.data.data.valueRange.values;
      const taskRowIndex = rows.findIndex(row => row[0] === taskId);

      if (taskRowIndex === -1) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Update status and progress
      const updates = [];
      if (status) {
        updates.push({
          range: `D${taskRowIndex + 1}`,
          values: [[status]]
        });
      }
      if (progress) {
        updates.push({
          range: `H${taskRowIndex + 1}`,
          values: [[progress]]
        });
      }

      for (const update of updates) {
        await larkClient.request(
          'PUT',
          `/sheets/v2/spreadsheets/${spreadsheetToken}/values/${update.range}`,
          {
            valueRange: {
              values: update.values
            }
          }
        );
      }

      return { success: true, taskId, status, progress };
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }
}

module.exports = new DocumentService();
```

## Error Handling

### 1. Centralized Error Handler

```javascript
// src/utils/error-handler.js
class LarkErrorHandler {
  static handle(error) {
    if (error.response) {
      // API responded with error
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return this.handleBadRequest(data);
        case 401:
          return this.handleUnauthorized(data);
        case 403:
          return this.handleForbidden(data);
        case 404:
          return this.handleNotFound(data);
        case 429:
          return this.handleRateLimit(data);
        case 500:
          return this.handleServerError(data);
        default:
          return this.handleGenericError(error);
      }
    } else if (error.request) {
      // Network error
      return this.handleNetworkError(error);
    } else {
      // Other error
      return this.handleGenericError(error);
    }
  }

  static handleBadRequest(data) {
    return {
      type: 'BAD_REQUEST',
      message: 'Invalid request parameters',
      details: data.msg || 'Bad request',
      code: data.code
    };
  }

  static handleUnauthorized(data) {
    return {
      type: 'UNAUTHORIZED',
      message: 'Authentication failed',
      details: data.msg || 'Invalid or expired token',
      code: data.code,
      action: 'REFRESH_TOKEN'
    };
  }

  static handleForbidden(data) {
    return {
      type: 'FORBIDDEN',
      message: 'Insufficient permissions',
      details: data.msg || 'Access denied',
      code: data.code
    };
  }

  static handleNotFound(data) {
    return {
      type: 'NOT_FOUND',
      message: 'Resource not found',
      details: data.msg || 'The requested resource was not found',
      code: data.code
    };
  }

  static handleRateLimit(data) {
    return {
      type: 'RATE_LIMIT',
      message: 'Rate limit exceeded',
      details: data.msg || 'Too many requests',
      code: data.code,
      retryAfter: data.retry_after || 60
    };
  }

  static handleServerError(data) {
    return {
      type: 'SERVER_ERROR',
      message: 'Internal server error',
      details: data.msg || 'Server error occurred',
      code: data.code
    };
  }

  static handleNetworkError(error) {
    return {
      type: 'NETWORK_ERROR',
      message: 'Network connection failed',
      details: error.message,
      timeout: error.code === 'ECONNABORTED'
    };
  }

  static handleGenericError(error) {
    return {
      type: 'GENERIC_ERROR',
      message: 'An unexpected error occurred',
      details: error.message
    };
  }
}

module.exports = LarkErrorHandler;
```

### 2. Retry Logic

```javascript
// src/utils/retry-handler.js
class RetryHandler {
  static async withRetry(fn, options = {}) {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
      retryCondition = (error) => error.response?.status >= 500
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries || !retryCondition(error)) {
          throw error;
        }

        const delay = Math.min(
          baseDelay * Math.pow(backoffFactor, attempt),
          maxDelay
        );

        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RetryHandler;
```

## Performance Optimization

### 1. Caching Strategy

```javascript
// src/utils/cache.js
const NodeCache = require('node-cache');

class CacheManager {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 600, // 10 minutes default
      checkperiod: 120 // Check for expired keys every 2 minutes
    });
  }

  /**
   * Get cached data
   */
  get(key) {
    return this.cache.get(key);
  }

  /**
   * Set cached data
   */
  set(key, value, ttl = null) {
    if (ttl) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  /**
   * Delete cached data
   */
  del(key) {
    return this.cache.del(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    return this.cache.flushAll();
  }

  /**
   * Get or set with function
   */
  async getOrSet(key, fn, ttl = null) {
    let value = this.get(key);
    
    if (value === undefined) {
      value = await fn();
      this.set(key, value, ttl);
    }
    
    return value;
  }
}

module.exports = new CacheManager();
```

### 2. Batch Operations

```javascript
// src/utils/batch-processor.js
class BatchProcessor {
  /**
   * Process items in batches
   */
  static async processBatch(items, processor, options = {}) {
    const {
      batchSize = 10,
      concurrency = 3,
      delay = 100
    } = options;

    const results = [];
    const batches = this.createBatches(items, batchSize);

    for (let i = 0; i < batches.length; i += concurrency) {
      const currentBatches = batches.slice(i, i + concurrency);
      
      const batchPromises = currentBatches.map(async (batch, index) => {
        try {
          return await processor(batch, i + index);
        } catch (error) {
          console.error(`Batch ${i + index} failed:`, error);
          return { error, batchIndex: i + index };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batch groups
      if (i + concurrency < batches.length && delay > 0) {
        await this.sleep(delay);
      }
    }

    return results;
  }

  /**
   * Create batches from array
   */
  static createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = BatchProcessor;
```

## Security Best Practices

### 1. Token Security

```javascript
// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const authService = require('../services/lark/auth');

class AuthMiddleware {
  /**
   * Verify user token
   */
  static async verifyUserToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Missing or invalid authorization header'
        });
      }

      const token = authHeader.substring(7);
      
      // Verify token with Lark
      const userInfo = await authService.verifyUserToken(token);
      
      req.user = userInfo;
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({
        error: 'Invalid or expired token'
      });
    }
  }

  /**
   * Check required scopes
   */
  static requireScopes(requiredScopes) {
    return (req, res, next) => {
      const userScopes = req.user?.scopes || [];
      
      const hasRequiredScopes = requiredScopes.every(scope =>
        userScopes.includes(scope)
      );

      if (!hasRequiredScopes) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: requiredScopes,
          current: userScopes
        });
      }

      next();
    };
  }

  /**
   * Rate limiting
   */
  static rateLimit(options = {}) {
    const {
      windowMs = 60000, // 1 minute
      maxRequests = 100,
      message = 'Too many requests'
    } = options;

    const requests = new Map();

    return (req, res, next) => {
      const key = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old requests
      if (requests.has(key)) {
        const userRequests = requests.get(key).filter(
          timestamp => timestamp > windowStart
        );
        requests.set(key, userRequests);
      }

      const currentRequests = requests.get(key) || [];
      
      if (currentRequests.length >= maxRequests) {
        return res.status(429).json({
          error: message,
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      currentRequests.push(now);
      requests.set(key, currentRequests);
      
      next();
    };
  }
}

module.exports = AuthMiddleware;
```

### 2. Input Validation

```javascript
// src/utils/validation.js
const Joi = require('joi');

class ValidationSchemas {
  static userMessage = Joi.object({
    receive_id: Joi.string().required(),
    receive_id_type: Joi.string().valid('open_id', 'user_id', 'union_id').default('open_id'),
    msg_type: Joi.string().valid('text', 'post', 'image', 'file', 'audio', 'media', 'sticker', 'interactive', 'share_chat', 'share_user').required(),
    content: Joi.string().required()
  });

  static createChat = Joi.object({
    name: Joi.string().max(100),
    description: Joi.string().max(500),
    user_id_list: Joi.array().items(Joi.string()).min(1).max(200).required(),
    user_id_type: Joi.string().valid('open_id', 'user_id', 'union_id').default('open_id')
  });

  static createEvent = Joi.object({
    summary: Joi.string().max(1000).required(),
    description: Joi.string().max(40960),
    start_time: Joi.object({
      timestamp: Joi.string().required()
    }).required(),
    end_time: Joi.object({
      timestamp: Joi.string().required()
    }).required(),
    attendees: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('user', 'chat', 'resource', 'third_party').default('user'),
        attendee_id: Joi.string().required()
      })
    ).max(3000)
  });

  static validate(schema, data) {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      throw new ValidationError('Validation failed', details);
    }

    return value;
  }
}

class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

module.exports = { ValidationSchemas, ValidationError };
```

## Testing Strategies

### 1. Unit Tests

```javascript
// tests/lark/auth.test.js
const authService = require('../../src/services/lark/auth');
const axios = require('axios');

jest.mock('axios');
const mockedAxios = axios;

describe('LarkAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authService.tenantToken = null;
    authService.tokenExpiry = null;
  });

  describe('getTenantAccessToken', () => {
    it('should get tenant access token successfully', async () => {
      const mockResponse = {
        data: {
          code: 0,
          tenant_access_token: 'mock_token',
          expire: 7200
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const token = await authService.getTenantAccessToken();

      expect(token).toBe('mock_token');
      expect(authService.tenantToken).toBe('mock_token');
      expect(authService.tokenExpiry).toBeGreaterThan(Date.now());
    });

    it('should reuse cached token if still valid', async () => {
      authService.tenantToken = 'cached_token';
      authService.tokenExpiry = Date.now() + 3600000; // 1 hour from now

      const token = await authService.getTenantAccessToken();

      expect(token).toBe('cached_token');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        data: {
          code: 99991663,
          msg: 'app_id not found'
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await expect(authService.getTenantAccessToken()).rejects.toThrow('Failed to get tenant token: app_id not found');
    });
  });
});
```

### 2. Integration Tests

```javascript
// tests/lark/integration.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Lark API Integration', () => {
  let authToken;

  beforeAll(async () => {
    // Setup test authentication
    authToken = await getTestAuthToken();
  });

  describe('POST /api/lark/messages', () => {
    it('should send text message successfully', async () => {
      const messageData = {
        receive_id: 'test_user_id',
        receive_id_type: 'open_id',
        msg_type: 'text',
        content: JSON.stringify({ text: 'Test message' })
      };

      const response = await request(app)
        .post('/api/lark/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(200);

      expect(response.body).toHaveProperty('message_id');
      expect(response.body).toHaveProperty('create_time');
    });

    it('should validate message data', async () => {
      const invalidData = {
        receive_id: '',
        msg_type: 'invalid_type'
      };

      await request(app)
        .post('/api/lark/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/lark/users', () => {
    it('should list users with pagination', async () => {
      const response = await request(app)
        .get('/api/lark/users')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page_size: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('has_more');
      expect(Array.isArray(response.body.users)).toBe(true);
    });
  });
});

async function getTestAuthToken() {
  // Implementation to get test auth token
  // This could be a mock token or real token for testing
  return 'test_auth_token';
}
```

## Deployment Considerations

### 1. Environment Configuration

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - LARK_APP_ID=${LARK_APP_ID}
      - LARK_APP_SECRET=${LARK_APP_SECRET}
      - LARK_ENCRYPT_KEY=${LARK_ENCRYPT_KEY}
      - LARK_VERIFICATION_TOKEN=${LARK_VERIFICATION_TOKEN}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

### 2. Health Checks

```javascript
// src/routes/health.js
const express = require('express');
const authService = require('../services/lark/auth');
const router = express.Router();

router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {}
  };

  try {
    // Check Lark API connectivity
    await authService.getTenantAccessToken();
    health.services.lark = 'ok';
  } catch (error) {
    health.services.lark = 'error';
    health.status = 'degraded';
  }

  // Check Redis connectivity
  try {
    await redis.ping();
    health.services.redis = 'ok';
  } catch (error) {
    health.services.redis = 'error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
```

### 3. Monitoring and Logging

```javascript
// src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'lark-integration' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Add request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
};

module.exports = { logger, requestLogger };
```

This implementation guide provides a comprehensive foundation for integrating Lark APIs into your web application. Remember to:

1. **Start Small**: Begin with basic authentication and simple API calls
2. **Test Thoroughly**: Implement comprehensive testing at all levels
3. **Monitor Performance**: Track API usage and response times
4. **Handle Errors Gracefully**: Implement robust error handling and retry logic
5. **Secure Your Implementation**: Follow security best practices for token management
6. **Document Your Code**: Maintain clear documentation for your team

For more specific implementation details, refer to the individual API documentation files in this directory.