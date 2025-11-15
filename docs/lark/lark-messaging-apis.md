# Lark Messaging & IM APIs

This document covers the Messaging and Instant Messaging APIs for sending messages, files, images, and managing conversations in Lark.

## Table of Contents

1. [Overview](#overview)
2. [Message Types](#message-types)
3. [Send Message APIs](#send-message-apis)
4. [File and Media APIs](#file-and-media-apis)
5. [Chat Management APIs](#chat-management-apis)
6. [Message Management APIs](#message-management-apis)
7. [Required Scopes](#required-scopes)
8. [Implementation Examples](#implementation-examples)

## Overview

The Messaging APIs allow you to:
- Send various types of messages (text, rich text, cards, images, files)
- Manage group chats and conversations
- Upload and share files and media
- Retrieve message history
- Manage message reactions and replies

**Base URL**: `https://open.feishu.cn/open-apis/im/v1`

## Message Types

Lark supports various message types:

1. **Text Messages** - Plain text
2. **Rich Text Messages** - Formatted text with styling
3. **Interactive Cards** - Rich interactive content
4. **Images** - Image files
5. **Files** - Document and file attachments
6. **Audio** - Voice messages
7. **Video** - Video files
8. **Stickers** - Emoji and stickers
9. **Share Cards** - Shared content cards

## Send Message APIs

### Send Text Message

```http
POST /im/v1/messages
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "receive_id": "ou_84aad35d084aa403a838cf73ee18467",
  "receive_id_type": "open_id",
  "msg_type": "text",
  "content": "{\"text\":\"Hello, this is a test message!\"}"
}
```

### Send Rich Text Message

```http
POST /im/v1/messages
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "receive_id": "ou_84aad35d084aa403a838cf73ee18467",
  "receive_id_type": "open_id",
  "msg_type": "post",
  "content": "{\"post\":{\"zh_cn\":{\"title\":\"Project Update\",\"content\":[[{\"tag\":\"text\",\"text\":\"The project is \"},{\"tag\":\"text\",\"text\":\"on track\",\"style\":[\"bold\",\"underline\"]},{\"tag\":\"text\",\"text\":\" and will be completed by \"},{\"tag\":\"text\",\"text\":\"Friday\",\"style\":[\"italic\"]}]]}}}"
}
```

### Send Interactive Card

```http
POST /im/v1/messages
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "receive_id": "ou_84aad35d084aa403a838cf73ee18467",
  "receive_id_type": "open_id",
  "msg_type": "interactive",
  "content": "{\"config\":{\"wide_screen_mode\":true},\"elements\":[{\"tag\":\"div\",\"text\":{\"content\":\"**Meeting Reminder**\\nDaily standup meeting at 10:00 AM\",\"tag\":\"lark_md\"}},{\"actions\":[{\"tag\":\"button\",\"text\":{\"content\":\"Accept\",\"tag\":\"plain_text\"},\"type\":\"primary\",\"value\":{\"action\":\"accept\"}},{\"tag\":\"button\",\"text\":{\"content\":\"Decline\",\"tag\":\"plain_text\"},\"type\":\"default\",\"value\":{\"action\":\"decline\"}}],\"tag\":\"action\"}],\"header\":{\"template\":\"blue\",\"title\":{\"content\":\"Meeting Invitation\",\"tag\":\"plain_text\"}}}"
}
```

### Send Image Message

```http
POST /im/v1/messages
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "receive_id": "ou_84aad35d084aa403a838cf73ee18467",
  "receive_id_type": "open_id",
  "msg_type": "image",
  "content": "{\"image_key\":\"img_v2_041b28e3-aa4f-4e3b-9f3c-02b9c1e3e4f5\"}"
}
```

### Send File Message

```http
POST /im/v1/messages
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "receive_id": "ou_84aad35d084aa403a838cf73ee18467",
  "receive_id_type": "open_id",
  "msg_type": "file",
  "content": "{\"file_key\":\"file_v2_041b28e3-aa4f-4e3b-9f3c-02b9c1e3e4f5\"}"
}
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "message_id": "om_dc13264520392913993dd051dba21dcf",
    "root_id": "om_40eb06e7b84dc71c03e009ad3c754195",
    "parent_id": "om_d4be107c616aed9c1da8ed8068570a9f",
    "thread_id": "omt_d4be107c616aed9c1da8ed8068570a9f",
    "msg_type": "text",
    "create_time": "1609296809",
    "update_time": "1609296809",
    "deleted": false,
    "updated": false,
    "chat_id": "oc_5ad11d72b830411d72b836c20",
    "sender": {
      "id": "ou_84aad35d084aa403a838cf73ee18467",
      "id_type": "open_id",
      "sender_type": "user",
      "tenant_key": "tenant_key_example"
    },
    "body": {
      "content": "{\"text\":\"Hello, this is a test message!\"}"
    }
  }
}
```

## File and Media APIs

### Upload Image

```http
POST /im/v1/images
Authorization: Bearer <user_access_token>
Content-Type: multipart/form-data

Form Data:
- image_type: message
- image: [binary file data]
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "image_key": "img_v2_041b28e3-aa4f-4e3b-9f3c-02b9c1e3e4f5"
  }
}
```

### Upload File

```http
POST /im/v1/files
Authorization: Bearer <user_access_token>
Content-Type: multipart/form-data

Form Data:
- file_type: stream
- file_name: document.pdf
- file: [binary file data]
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "file_key": "file_v2_041b28e3-aa4f-4e3b-9f3c-02b9c1e3e4f5"
  }
}
```

### Download File

```http
GET /im/v1/files/{file_key}
Authorization: Bearer <user_access_token>
```

### Get Image

```http
GET /im/v1/images/{image_key}
Authorization: Bearer <user_access_token>
```

## Chat Management APIs

### Create Group Chat

```http
POST /im/v1/chats
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "name": "Project Team Chat",
  "description": "Discussion for the new project",
  "user_id_list": [
    "ou_84aad35d084aa403a838cf73ee18467",
    "ou_84aad35d084aa403a838cf73ee18468"
  ],
  "user_id_type": "open_id",
  "chat_mode": "group",
  "chat_type": "private",
  "external": false,
  "join_message_visibility": "all_members",
  "leave_message_visibility": "all_members",
  "membership_approval": "no_approval_required"
}
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "chat_id": "oc_5ad11d72b830411d72b836c20",
    "name": "Project Team Chat",
    "description": "Discussion for the new project",
    "owner_id": "ou_84aad35d084aa403a838cf73ee18467",
    "owner_id_type": "open_id",
    "external": false,
    "tenant_key": "tenant_key_example"
  }
}
```

### Get Chat Information

```http
GET /im/v1/chats/{chat_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- user_id_type: string (open_id, union_id, user_id)
```

### Update Chat Information

```http
PUT /im/v1/chats/{chat_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "name": "Updated Project Team Chat",
  "description": "Updated description for the project team"
}
```

### Add Chat Members

```http
POST /im/v1/chats/{chat_id}/members
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "id_list": [
    "ou_84aad35d084aa403a838cf73ee18469"
  ],
  "member_id_type": "open_id"
}
```

### Remove Chat Members

```http
DELETE /im/v1/chats/{chat_id}/members
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "id_list": [
    "ou_84aad35d084aa403a838cf73ee18469"
  ],
  "member_id_type": "open_id"
}
```

### List Chat Members

```http
GET /im/v1/chats/{chat_id}/members
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- member_id_type: string (open_id, union_id, user_id)
- page_size: integer (1-100, default: 10)
- page_token: string (for pagination)
```

## Message Management APIs

### Get Message

```http
GET /im/v1/messages/{message_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

### Update Message

```http
PUT /im/v1/messages/{message_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "content": "{\"text\":\"Updated message content\"}"
}
```

### Delete Message

```http
DELETE /im/v1/messages/{message_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

### Reply to Message

```http
POST /im/v1/messages/{message_id}/reply
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "msg_type": "text",
  "content": "{\"text\":\"This is a reply to your message\"}"
}
```

### Add Reaction

```http
POST /im/v1/messages/{message_id}/reactions
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "reaction_type": {
    "emoji_type": "SMILE"
  }
}
```

### List Message Reactions

```http
GET /im/v1/messages/{message_id}/reactions
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- reaction_type: string (optional)
- user_id_type: string (open_id, union_id, user_id)
- page_size: integer (1-100, default: 10)
- page_token: string (for pagination)
```

### Get Message History

```http
GET /im/v1/messages
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- container_id: string (chat_id)
- container_id_type: string (chat_id)
- start_time: string (timestamp)
- end_time: string (timestamp)
- page_size: integer (1-100, default: 20)
- page_token: string (for pagination)
```

## Required Scopes

To use these APIs, your app needs the following scopes:

### Messaging
- `im:message` - Send and receive messages
- `im:message:readonly` - Read messages only
- `im:chat` - Manage chats and conversations
- `im:chat:readonly` - Read chat information only

### File and Media
- `im:resource` - Upload and download files/images
- `im:resource:readonly` - Download files/images only

### Advanced Features
- `im:message.group_at_msg` - Send @mentions in group chats
- `im:message.group_at_msg:readonly` - Read @mentions
- `im:message.p2p_msg` - Send direct messages
- `im:message.p2p_msg:readonly` - Read direct messages

## Implementation Examples

### Example: Send Text Message with Error Handling

```javascript
async function sendTextMessage(accessToken, receiverId, message) {
  try {
    const response = await axios.post(
      'https://open.feishu.cn/open-apis/im/v1/messages',
      {
        receive_id: receiverId,
        receive_id_type: 'open_id',
        msg_type: 'text',
        content: JSON.stringify({ text: message })
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
    console.error('Failed to send message:', error);
    throw error;
  }
}
```

### Example: Upload and Send Image

```javascript
async function uploadAndSendImage(accessToken, receiverId, imageFile) {
  try {
    // Step 1: Upload image
    const formData = new FormData();
    formData.append('image_type', 'message');
    formData.append('image', imageFile);
    
    const uploadResponse = await axios.post(
      'https://open.feishu.cn/open-apis/im/v1/images',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    if (uploadResponse.data.code !== 0) {
      throw new Error(`Upload failed: ${uploadResponse.data.msg}`);
    }
    
    const imageKey = uploadResponse.data.data.image_key;
    
    // Step 2: Send image message
    const messageResponse = await axios.post(
      'https://open.feishu.cn/open-apis/im/v1/messages',
      {
        receive_id: receiverId,
        receive_id_type: 'open_id',
        msg_type: 'image',
        content: JSON.stringify({ image_key: imageKey })
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return messageResponse.data.data;
  } catch (error) {
    console.error('Failed to upload and send image:', error);
    throw error;
  }
}
```

### Example: Create Group Chat and Send Welcome Message

```javascript
async function createProjectChat(accessToken, chatName, memberIds) {
  try {
    // Step 1: Create group chat
    const chatResponse = await axios.post(
      'https://open.feishu.cn/open-apis/im/v1/chats',
      {
        name: chatName,
        description: `Project discussion for ${chatName}`,
        user_id_list: memberIds,
        user_id_type: 'open_id',
        chat_mode: 'group',
        chat_type: 'private'
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (chatResponse.data.code !== 0) {
      throw new Error(`Chat creation failed: ${chatResponse.data.msg}`);
    }
    
    const chatId = chatResponse.data.data.chat_id;
    
    // Step 2: Send welcome message
    await axios.post(
      'https://open.feishu.cn/open-apis/im/v1/messages',
      {
        receive_id: chatId,
        receive_id_type: 'chat_id',
        msg_type: 'text',
        content: JSON.stringify({ 
          text: `Welcome to ${chatName}! Let's collaborate effectively.` 
        })
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return chatResponse.data.data;
  } catch (error) {
    console.error('Failed to create project chat:', error);
    throw error;
  }
}
```

## Best Practices

1. **Message Formatting**: Use proper JSON formatting for message content
2. **File Size Limits**: Respect file size limits (images: 10MB, files: 100MB)
3. **Rate Limiting**: Implement proper rate limiting and retry logic
4. **Error Handling**: Always check response codes and handle errors
5. **User Permissions**: Verify user permissions before sending messages
6. **Content Validation**: Validate message content before sending
7. **Batch Operations**: Use batch APIs when sending multiple messages

## Common Error Codes

- `1254001`: Invalid message content format
- `1254002`: Message too long
- `1254003`: Unsupported message type
- `1254004`: File upload failed
- `1254005`: Chat not found
- `1254006`: User not in chat
- `1254007`: Insufficient permissions
- `1254008`: Rate limit exceeded