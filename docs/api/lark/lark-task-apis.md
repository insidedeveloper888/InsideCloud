# Lark Task Management APIs

This document covers the Task Management APIs for creating, managing, and tracking tasks and projects in Lark.

## Table of Contents

1. [Overview](#overview)
2. [Task APIs](#task-apis)
3. [Project APIs](#project-apis)
4. [Task List APIs](#task-list-apis)
5. [Task Comment APIs](#task-comment-apis)
6. [Task Attachment APIs](#task-attachment-apis)
7. [Task Dependency APIs](#task-dependency-apis)
8. [Task Template APIs](#task-template-apis)
9. [Required Scopes](#required-scopes)
10. [Implementation Examples](#implementation-examples)

## Overview

The Lark Task Management APIs allow you to:
- Create and manage tasks
- Organize tasks into projects and lists
- Track task progress and status
- Manage task assignments and collaborators
- Handle task comments and attachments
- Set up task dependencies and workflows
- Use task templates for recurring work

**Base URL**: `https://open.feishu.cn/open-apis/task/v1`

## Task APIs

### Create Task

```http
POST /task/v1/tasks
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "summary": "Implement user authentication feature",
  "description": "Develop and implement user login/logout functionality with OAuth integration",
  "due": {
    "timestamp": "1640995200",
    "is_all_day": false
  },
  "origin": {
    "platform_i18n_name": "Web App",
    "href": {
      "url": "https://example.com/tasks/123",
      "title": "Task Details"
    }
  },
  "extra": "Additional task metadata",
  "completed_at": "",
  "members": [
    {
      "id": "ou_84aad35d084aa403a838cf73ee18467",
      "type": "user",
      "role": "assignee"
    },
    {
      "id": "ou_84aad35d084aa403a838cf73ee18468",
      "type": "user",
      "role": "follower"
    }
  ],
  "repeat_rule": "FREQ=WEEKLY;BYDAY=MO",
  "custom_complete": [
    {
      "guid": "custom_field_1",
      "type": "single_select",
      "value": "in_progress"
    }
  ],
  "task_id": "",
  "creator_id": "ou_84aad35d084aa403a838cf73ee18467",
  "created_at": "",
  "updated_at": "",
  "status": "todo",
  "url": "",
  "start": {
    "timestamp": "1640991600",
    "is_all_day": false
  },
  "subtask_count": 0
}
```

**Task Status Options:**
- `todo`: To do
- `doing`: In progress
- `done`: Completed

**Member Roles:**
- `assignee`: Task assignee
- `follower`: Task follower
- `collaborator`: Task collaborator

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "task": {
      "guid": "83912691-2e43-47fc-954f-ece8a40e3d48",
      "summary": "Implement user authentication feature",
      "description": "Develop and implement user login/logout functionality with OAuth integration",
      "due": {
        "timestamp": "1640995200",
        "is_all_day": false
      },
      "origin": {
        "platform_i18n_name": "Web App",
        "href": {
          "url": "https://example.com/tasks/123",
          "title": "Task Details"
        }
      },
      "extra": "Additional task metadata",
      "completed_at": "",
      "members": [
        {
          "id": "ou_84aad35d084aa403a838cf73ee18467",
          "type": "user",
          "role": "assignee",
          "name": "John Doe"
        }
      ],
      "repeat_rule": "FREQ=WEEKLY;BYDAY=MO",
      "custom_complete": [
        {
          "guid": "custom_field_1",
          "type": "single_select",
          "value": "in_progress"
        }
      ],
      "task_id": "83912691-2e43-47fc-954f-ece8a40e3d48",
      "creator_id": "ou_84aad35d084aa403a838cf73ee18467",
      "created_at": "1640991600",
      "updated_at": "1640991600",
      "status": "todo",
      "url": "https://applink.feishu.cn/client/todo/detail?guid=83912691-2e43-47fc-954f-ece8a40e3d48",
      "start": {
        "timestamp": "1640991600",
        "is_all_day": false
      },
      "subtask_count": 0
    }
  }
}
```

### Get Task

```http
GET /task/v1/tasks/{task_guid}
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
    "task": {
      "guid": "83912691-2e43-47fc-954f-ece8a40e3d48",
      "summary": "Implement user authentication feature",
      "description": "Develop and implement user login/logout functionality with OAuth integration",
      "due": {
        "timestamp": "1640995200",
        "is_all_day": false
      },
      "status": "doing",
      "members": [
        {
          "id": "ou_84aad35d084aa403a838cf73ee18467",
          "type": "user",
          "role": "assignee",
          "name": "John Doe"
        }
      ],
      "creator_id": "ou_84aad35d084aa403a838cf73ee18467",
      "created_at": "1640991600",
      "updated_at": "1640995200",
      "url": "https://applink.feishu.cn/client/todo/detail?guid=83912691-2e43-47fc-954f-ece8a40e3d48",
      "subtask_count": 2
    }
  }
}
```

### List Tasks

```http
GET /task/v1/tasks
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- page_size: integer (1-100, default: 50)
- page_token: string
- completed: boolean (filter by completion status)
- created_from: string (timestamp)
- created_to: string (timestamp)
- updated_from: string (timestamp)
- updated_to: string (timestamp)
- due_from: string (timestamp)
- due_to: string (timestamp)
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
        "guid": "83912691-2e43-47fc-954f-ece8a40e3d48",
        "summary": "Implement user authentication feature",
        "description": "Develop and implement user login/logout functionality",
        "due": {
          "timestamp": "1640995200",
          "is_all_day": false
        },
        "status": "doing",
        "creator_id": "ou_84aad35d084aa403a838cf73ee18467",
        "created_at": "1640991600",
        "updated_at": "1640995200"
      }
    ],
    "page_token": "",
    "has_more": false
  }
}
```

### Update Task

```http
PATCH /task/v1/tasks/{task_guid}
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "summary": "Updated: Implement user authentication feature",
  "description": "Updated description with additional requirements",
  "status": "doing",
  "due": {
    "timestamp": "1641081600",
    "is_all_day": false
  },
  "members": [
    {
      "id": "ou_84aad35d084aa403a838cf73ee18467",
      "type": "user",
      "role": "assignee"
    },
    {
      "id": "ou_84aad35d084aa403a838cf73ee18468",
      "type": "user",
      "role": "collaborator"
    }
  ]
}
```

### Complete Task

```http
POST /task/v1/tasks/{task_guid}/complete
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "is_complete": true
}
```

### Delete Task

```http
DELETE /task/v1/tasks/{task_guid}
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

## Project APIs

### Create Project

```http
POST /task/v1/tasklists
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "name": "Web Application Development",
  "description": "Project for developing the new web application",
  "owner": "ou_84aad35d084aa403a838cf73ee18467",
  "members": [
    {
      "id": "ou_84aad35d084aa403a838cf73ee18467",
      "type": "user",
      "role": "owner"
    },
    {
      "id": "ou_84aad35d084aa403a838cf73ee18468",
      "type": "user",
      "role": "editor"
    }
  ]
}
```

**Project Member Roles:**
- `owner`: Project owner
- `editor`: Can edit project and tasks
- `viewer`: Can view project and tasks

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "tasklist": {
      "guid": "cc371766-6584-cf50-a222-c173e79a5123",
      "name": "Web Application Development",
      "description": "Project for developing the new web application",
      "owner": "ou_84aad35d084aa403a838cf73ee18467",
      "members": [
        {
          "id": "ou_84aad35d084aa403a838cf73ee18467",
          "type": "user",
          "role": "owner",
          "name": "John Doe"
        }
      ],
      "url": "https://applink.feishu.cn/client/todo/home?guid=cc371766-6584-cf50-a222-c173e79a5123",
      "created_at": "1640991600",
      "updated_at": "1640991600"
    }
  }
}
```

### Get Project

```http
GET /task/v1/tasklists/{tasklist_guid}
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- user_id_type: string (open_id, union_id, user_id)
```

### List Projects

```http
GET /task/v1/tasklists
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- page_size: integer (1-100, default: 50)
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
        "guid": "cc371766-6584-cf50-a222-c173e79a5123",
        "name": "Web Application Development",
        "description": "Project for developing the new web application",
        "owner": "ou_84aad35d084aa403a838cf73ee18467",
        "url": "https://applink.feishu.cn/client/todo/home?guid=cc371766-6584-cf50-a222-c173e79a5123",
        "created_at": "1640991600",
        "updated_at": "1640991600"
      }
    ],
    "page_token": "",
    "has_more": false
  }
}
```

### Update Project

```http
PATCH /task/v1/tasklists/{tasklist_guid}
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "name": "Updated Web Application Development",
  "description": "Updated project description with new requirements"
}
```

### Delete Project

```http
DELETE /task/v1/tasklists/{tasklist_guid}
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

## Task List APIs

### Add Task to Project

```http
POST /task/v1/tasklists/{tasklist_guid}/tasks
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "summary": "Design database schema",
  "description": "Create database schema for user management",
  "due": {
    "timestamp": "1640995200",
    "is_all_day": false
  },
  "members": [
    {
      "id": "ou_84aad35d084aa403a838cf73ee18467",
      "type": "user",
      "role": "assignee"
    }
  ]
}
```

### List Project Tasks

```http
GET /task/v1/tasklists/{tasklist_guid}/tasks
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- page_size: integer (1-100, default: 50)
- page_token: string
- completed: boolean
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
        "guid": "83912691-2e43-47fc-954f-ece8a40e3d48",
        "summary": "Design database schema",
        "description": "Create database schema for user management",
        "due": {
          "timestamp": "1640995200",
          "is_all_day": false
        },
        "status": "todo",
        "creator_id": "ou_84aad35d084aa403a838cf73ee18467",
        "created_at": "1640991600",
        "updated_at": "1640991600"
      }
    ],
    "page_token": "",
    "has_more": false
  }
}
```

### Remove Task from Project

```http
DELETE /task/v1/tasklists/{tasklist_guid}/tasks/{task_guid}
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

## Task Comment APIs

### Add Comment

```http
POST /task/v1/tasks/{task_guid}/comments
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "content": "Updated the implementation approach based on team feedback",
  "parent_id": "",
  "id": "",
  "created_at": "",
  "updated_at": "",
  "resource": {
    "type": "task",
    "id": "83912691-2e43-47fc-954f-ece8a40e3d48"
  },
  "creator": {
    "id": "ou_84aad35d084aa403a838cf73ee18467",
    "type": "user"
  }
}
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "comment": {
      "content": "Updated the implementation approach based on team feedback",
      "parent_id": "",
      "id": "7101214603622940673",
      "created_at": "1640995200",
      "updated_at": "1640995200",
      "resource": {
        "type": "task",
        "id": "83912691-2e43-47fc-954f-ece8a40e3d48"
      },
      "creator": {
        "id": "ou_84aad35d084aa403a838cf73ee18467",
        "type": "user",
        "name": "John Doe"
      }
    }
  }
}
```

### Get Comment

```http
GET /task/v1/tasks/{task_guid}/comments/{comment_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- user_id_type: string (open_id, union_id, user_id)
```

### List Comments

```http
GET /task/v1/tasks/{task_guid}/comments
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- page_size: integer (1-100, default: 50)
- page_token: string
- list_direction: string (asc, desc)
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
        "content": "Updated the implementation approach based on team feedback",
        "parent_id": "",
        "id": "7101214603622940673",
        "created_at": "1640995200",
        "updated_at": "1640995200",
        "creator": {
          "id": "ou_84aad35d084aa403a838cf73ee18467",
          "type": "user",
          "name": "John Doe"
        }
      }
    ],
    "page_token": "",
    "has_more": false
  }
}
```

### Update Comment

```http
PATCH /task/v1/tasks/{task_guid}/comments/{comment_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "content": "Updated comment: Implementation approach has been finalized"
}
```

### Delete Comment

```http
DELETE /task/v1/tasks/{task_guid}/comments/{comment_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

## Task Attachment APIs

### Add Attachment

```http
POST /task/v1/tasks/{task_guid}/attachments
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "name": "Database Schema Design.pdf",
  "size": 1024000,
  "resource": {
    "type": "drive",
    "id": "doccnxxxxxxxxxxxxxxxxxxxxxx"
  },
  "uploader": {
    "id": "ou_84aad35d084aa403a838cf73ee18467",
    "type": "user"
  }
}
```

**Resource Types:**
- `drive`: Lark Drive file
- `url`: External URL
- `file`: Uploaded file

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "attachment": {
      "guid": "f860c936-6584-cf50-a222-c173e79a5123",
      "name": "Database Schema Design.pdf",
      "size": 1024000,
      "resource": {
        "type": "drive",
        "id": "doccnxxxxxxxxxxxxxxxxxxxxxx"
      },
      "uploader": {
        "id": "ou_84aad35d084aa403a838cf73ee18467",
        "type": "user",
        "name": "John Doe"
      },
      "is_cover": false,
      "uploaded_at": "1640995200"
    }
  }
}
```

### List Attachments

```http
GET /task/v1/tasks/{task_guid}/attachments
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- page_size: integer (1-100, default: 50)
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
        "guid": "f860c936-6584-cf50-a222-c173e79a5123",
        "name": "Database Schema Design.pdf",
        "size": 1024000,
        "resource": {
          "type": "drive",
          "id": "doccnxxxxxxxxxxxxxxxxxxxxxx"
        },
        "uploader": {
          "id": "ou_84aad35d084aa403a838cf73ee18467",
          "type": "user",
          "name": "John Doe"
        },
        "is_cover": false,
        "uploaded_at": "1640995200"
      }
    ],
    "page_token": "",
    "has_more": false
  }
}
```

### Delete Attachment

```http
DELETE /task/v1/tasks/{task_guid}/attachments/{attachment_guid}
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

## Task Dependency APIs

### Add Task Dependency

```http
POST /task/v1/tasks/{task_guid}/dependencies
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "type": "prev",
  "dependency_task_guid": "cc371766-6584-cf50-a222-c173e79a5123"
}
```

**Dependency Types:**
- `prev`: Previous task (must complete before this task)
- `next`: Next task (this task must complete before next task)

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "dependency": {
      "type": "prev",
      "dependency_task_guid": "cc371766-6584-cf50-a222-c173e79a5123",
      "dependency_task_summary": "Design database schema"
    }
  }
}
```

### List Task Dependencies

```http
GET /task/v1/tasks/{task_guid}/dependencies
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- page_size: integer (1-100, default: 50)
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
        "type": "prev",
        "dependency_task_guid": "cc371766-6584-cf50-a222-c173e79a5123",
        "dependency_task_summary": "Design database schema"
      }
    ],
    "page_token": "",
    "has_more": false
  }
}
```

### Remove Task Dependency

```http
DELETE /task/v1/tasks/{task_guid}/dependencies
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "type": "prev",
  "dependency_task_guid": "cc371766-6584-cf50-a222-c173e79a5123"
}
```

## Task Template APIs

### Create Task Template

```http
POST /task/v1/task_templates
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "name": "Feature Development Template",
  "description": "Standard template for feature development tasks",
  "tasks": [
    {
      "summary": "Requirements Analysis",
      "description": "Analyze and document feature requirements",
      "due_days": 2
    },
    {
      "summary": "Design Implementation",
      "description": "Create technical design and architecture",
      "due_days": 5
    },
    {
      "summary": "Development",
      "description": "Implement the feature",
      "due_days": 10
    },
    {
      "summary": "Testing",
      "description": "Test the implemented feature",
      "due_days": 3
    }
  ]
}
```

### Apply Task Template

```http
POST /task/v1/task_templates/{template_id}/apply
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "tasklist_guid": "cc371766-6584-cf50-a222-c173e79a5123",
  "start_date": "1640991600",
  "assignee_id": "ou_84aad35d084aa403a838cf73ee18467"
}
```

## Required Scopes

To use these APIs, your app needs the following scopes:

### Read Operations
- `task:task:readonly` - Read task information
- `task:tasklist:readonly` - Read project information

### Write Operations
- `task:task` - Full task access
- `task:tasklist` - Full project access

### Specific Permissions
- `task:task:create` - Create tasks
- `task:task:update` - Update tasks
- `task:task:delete` - Delete tasks
- `task:comment` - Manage comments
- `task:attachment` - Manage attachments

## Implementation Examples

### Example: Create Project with Tasks

```javascript
async function createProjectWithTasks(accessToken, projectData) {
  try {
    // Step 1: Create project
    const projectResponse = await axios.post(
      'https://open.feishu.cn/open-apis/task/v1/tasklists',
      {
        name: projectData.name,
        description: projectData.description,
        owner: projectData.ownerId,
        members: projectData.members
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (projectResponse.data.code !== 0) {
      throw new Error(`Failed to create project: ${projectResponse.data.msg}`);
    }
    
    const projectGuid = projectResponse.data.data.tasklist.guid;
    
    // Step 2: Create tasks in the project
    const createdTasks = [];
    for (const taskData of projectData.tasks) {
      const taskResponse = await axios.post(
        `https://open.feishu.cn/open-apis/task/v1/tasklists/${projectGuid}/tasks`,
        {
          summary: taskData.summary,
          description: taskData.description,
          due: {
            timestamp: taskData.dueTimestamp.toString(),
            is_all_day: false
          },
          members: [
            {
              id: taskData.assigneeId,
              type: 'user',
              role: 'assignee'
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
      
      if (taskResponse.data.code === 0) {
        createdTasks.push(taskResponse.data.data.task);
      }
    }
    
    return {
      project: projectResponse.data.data.tasklist,
      tasks: createdTasks
    };
  } catch (error) {
    console.error('Failed to create project with tasks:', error);
    throw error;
  }
}

// Usage
const project = await createProjectWithTasks(userAccessToken, {
  name: 'Mobile App Development',
  description: 'Development of the new mobile application',
  ownerId: 'ou_84aad35d084aa403a838cf73ee18467',
  members: [
    {
      id: 'ou_84aad35d084aa403a838cf73ee18467',
      type: 'user',
      role: 'owner'
    },
    {
      id: 'ou_84aad35d084aa403a838cf73ee18468',
      type: 'user',
      role: 'editor'
    }
  ],
  tasks: [
    {
      summary: 'UI/UX Design',
      description: 'Create mobile app UI/UX designs',
      dueTimestamp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
      assigneeId: 'ou_84aad35d084aa403a838cf73ee18468'
    },
    {
      summary: 'Backend API Development',
      description: 'Develop backend APIs for mobile app',
      dueTimestamp: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60, // 14 days from now
      assigneeId: 'ou_84aad35d084aa403a838cf73ee18467'
    }
  ]
});
console.log('Created project:', project);
```

### Example: Task Progress Tracking

```javascript
async function trackTaskProgress(accessToken, taskGuid, progressUpdate) {
  try {
    // Update task status
    const updateResponse = await axios.patch(
      `https://open.feishu.cn/open-apis/task/v1/tasks/${taskGuid}`,
      {
        status: progressUpdate.status,
        custom_complete: progressUpdate.customFields
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (updateResponse.data.code !== 0) {
      throw new Error(`Failed to update task: ${updateResponse.data.msg}`);
    }
    
    // Add progress comment
    const commentResponse = await axios.post(
      `https://open.feishu.cn/open-apis/task/v1/tasks/${taskGuid}/comments`,
      {
        content: progressUpdate.comment,
        creator: {
          id: progressUpdate.userId,
          type: 'user'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      task: updateResponse.data.data.task,
      comment: commentResponse.data.code === 0 ? commentResponse.data.data.comment : null
    };
  } catch (error) {
    console.error('Failed to track task progress:', error);
    throw error;
  }
}

// Usage
const progress = await trackTaskProgress(userAccessToken, '83912691-2e43-47fc-954f-ece8a40e3d48', {
  status: 'doing',
  comment: 'Started working on the authentication implementation. OAuth integration is in progress.',
  userId: 'ou_84aad35d084aa403a838cf73ee18467',
  customFields: [
    {
      guid: 'progress_field',
      type: 'single_select',
      value: '50_percent'
    }
  ]
});
console.log('Task progress updated:', progress);
```

### Example: Task Dependencies Management

```javascript
async function setupTaskDependencies(accessToken, tasks) {
  try {
    const dependencies = [];
    
    // Create dependencies between tasks
    for (let i = 1; i < tasks.length; i++) {
      const dependencyResponse = await axios.post(
        `https://open.feishu.cn/open-apis/task/v1/tasks/${tasks[i].guid}/dependencies`,
        {
          type: 'prev',
          dependency_task_guid: tasks[i - 1].guid
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (dependencyResponse.data.code === 0) {
        dependencies.push({
          task: tasks[i].guid,
          dependsOn: tasks[i - 1].guid,
          dependency: dependencyResponse.data.data.dependency
        });
      }
    }
    
    return dependencies;
  } catch (error) {
    console.error('Failed to setup task dependencies:', error);
    throw error;
  }
}

// Usage
const taskDependencies = await setupTaskDependencies(userAccessToken, [
  { guid: 'task-1-guid', summary: 'Requirements Analysis' },
  { guid: 'task-2-guid', summary: 'Design' },
  { guid: 'task-3-guid', summary: 'Implementation' },
  { guid: 'task-4-guid', summary: 'Testing' }
]);
console.log('Task dependencies created:', taskDependencies);
```

## Best Practices

1. **Task Organization**: Use projects to group related tasks
2. **Clear Descriptions**: Provide detailed task descriptions and requirements
3. **Due Dates**: Set realistic due dates and track progress
4. **Assignments**: Assign tasks to specific team members
5. **Dependencies**: Set up task dependencies for proper workflow
6. **Comments**: Use comments for progress updates and communication
7. **Attachments**: Attach relevant documents and resources
8. **Status Updates**: Keep task status current and accurate

## Common Error Codes

- `1400101`: Invalid task ID
- `1400102`: Invalid project ID
- `1400103`: Task not found
- `1400104`: Project not found
- `1400105`: Insufficient permissions
- `1400106`: Invalid task status
- `1400107`: Invalid due date
- `1400108`: Member not found
- `1400109`: Dependency cycle detected
- `1400110`: Template not found