# Lark Calendar APIs

This document covers the Calendar APIs for managing calendars, events, meetings, and scheduling in Lark.

## Table of Contents

1. [Overview](#overview)
2. [Calendar Management APIs](#calendar-management-apis)
3. [Event Management APIs](#event-management-apis)
4. [Meeting Management APIs](#meeting-management-apis)
5. [Attendee Management APIs](#attendee-management-apis)
6. [Meeting Room APIs](#meeting-room-apis)
7. [Recurring Event APIs](#recurring-event-apis)
8. [Required Scopes](#required-scopes)
9. [Implementation Examples](#implementation-examples)

## Overview

The Lark Calendar APIs allow you to:
- Create and manage calendars
- Schedule and manage events
- Organize meetings with attendees
- Manage meeting rooms and resources
- Handle recurring events
- Send invitations and notifications

**Base URL**: `https://open.feishu.cn/open-apis/calendar/v4`

## Calendar Management APIs

### Create Calendar

```http
POST /calendar/v4/calendars
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "summary": "Project Team Calendar",
  "description": "Calendar for project team meetings and deadlines",
  "permissions": "private",
  "color": -1,
  "summary_alias": "Team Calendar"
}
```

**Permission Types:**
- `private`: Private calendar
- `show_only_free_busy`: Show only free/busy information
- `public`: Public calendar

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "calendar": {
      "calendar_id": "feishu.cn_xxxxxxxxxx@group.calendar.feishu.cn",
      "summary": "Project Team Calendar",
      "description": "Calendar for project team meetings and deadlines",
      "permissions": "private",
      "color": -1,
      "type": "primary",
      "summary_alias": "Team Calendar",
      "is_deleted": false,
      "is_third_party": false,
      "role": "owner"
    }
  }
}
```

### Get Calendar

```http
GET /calendar/v4/calendars/{calendar_id}
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
    "calendar": {
      "calendar_id": "feishu.cn_xxxxxxxxxx@group.calendar.feishu.cn",
      "summary": "Project Team Calendar",
      "description": "Calendar for project team meetings and deadlines",
      "permissions": "private",
      "color": -1,
      "type": "primary",
      "summary_alias": "Team Calendar",
      "is_deleted": false,
      "is_third_party": false,
      "role": "owner"
    }
  }
}
```

### List Calendars

```http
GET /calendar/v4/calendars
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- page_size: integer (1-500, default: 50)
- page_token: string
- sync_token: string
- user_id_type: string (open_id, union_id, user_id)
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "has_more": false,
    "page_token": "",
    "sync_token": "sync_token_example",
    "items": [
      {
        "calendar_id": "feishu.cn_xxxxxxxxxx@group.calendar.feishu.cn",
        "summary": "Project Team Calendar",
        "description": "Calendar for project team meetings and deadlines",
        "permissions": "private",
        "color": -1,
        "type": "primary",
        "summary_alias": "Team Calendar",
        "is_deleted": false,
        "is_third_party": false,
        "role": "owner"
      }
    ]
  }
}
```

### Update Calendar

```http
PATCH /calendar/v4/calendars/{calendar_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "summary": "Updated Project Team Calendar",
  "description": "Updated calendar for project team activities",
  "color": 1
}
```

### Delete Calendar

```http
DELETE /calendar/v4/calendars/{calendar_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

## Event Management APIs

### Create Event

```http
POST /calendar/v4/calendars/{calendar_id}/events
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "summary": "Weekly Team Standup",
  "description": "Weekly standup meeting to discuss project progress",
  "start_time": {
    "timestamp": "1640995200",
    "timezone": "Asia/Shanghai"
  },
  "end_time": {
    "timestamp": "1640998800",
    "timezone": "Asia/Shanghai"
  },
  "visibility": "default",
  "attendee_ability": "can_see_others",
  "free_busy_status": "busy",
  "location": {
    "name": "Conference Room A",
    "address": "Building 1, Floor 3, Room 301",
    "latitude": 31.2304,
    "longitude": 121.4737
  },
  "color": -1,
  "reminders": [
    {
      "minutes": 15
    },
    {
      "minutes": 5
    }
  ],
  "recurrence": "RRULE:FREQ=WEEKLY;BYDAY=MO",
  "attendees": [
    {
      "type": "user",
      "attendee_id": "ou_84aad35d084aa403a838cf73ee18467",
      "rsvp_status": "needs_action",
      "is_optional": false,
      "display_name": "John Doe"
    }
  ]
}
```

**Visibility Options:**
- `default`: Default visibility
- `public`: Public event
- `private`: Private event

**Free/Busy Status:**
- `busy`: Show as busy
- `free`: Show as free

**RSVP Status:**
- `needs_action`: No response yet
- `accept`: Accepted
- `decline`: Declined
- `tentative`: Tentative

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "event": {
      "event_id": "xxxxxxxxxx_0",
      "organizer_calendar_id": "feishu.cn_xxxxxxxxxx@group.calendar.feishu.cn",
      "summary": "Weekly Team Standup",
      "description": "Weekly standup meeting to discuss project progress",
      "start_time": {
        "timestamp": "1640995200",
        "timezone": "Asia/Shanghai"
      },
      "end_time": {
        "timestamp": "1640998800",
        "timezone": "Asia/Shanghai"
      },
      "visibility": "default",
      "attendee_ability": "can_see_others",
      "free_busy_status": "busy",
      "location": {
        "name": "Conference Room A",
        "address": "Building 1, Floor 3, Room 301",
        "latitude": 31.2304,
        "longitude": 121.4737
      },
      "color": -1,
      "reminders": [
        {
          "minutes": 15
        }
      ],
      "recurrence": "RRULE:FREQ=WEEKLY;BYDAY=MO",
      "status": "confirmed",
      "is_exception": false,
      "recurring_event_id": ""
    }
  }
}
```

### Get Event

```http
GET /calendar/v4/calendars/{calendar_id}/events/{event_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- user_id_type: string (open_id, union_id, user_id)
- need_attendee: boolean (default: true)
```

### List Events

```http
GET /calendar/v4/calendars/{calendar_id}/events
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- start_time: string (RFC3339 timestamp)
- end_time: string (RFC3339 timestamp)
- page_size: integer (1-1000, default: 50)
- page_token: string
- sync_token: string
- user_id_type: string (open_id, union_id, user_id)
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "has_more": false,
    "page_token": "",
    "sync_token": "sync_token_example",
    "items": [
      {
        "event_id": "xxxxxxxxxx_0",
        "organizer_calendar_id": "feishu.cn_xxxxxxxxxx@group.calendar.feishu.cn",
        "summary": "Weekly Team Standup",
        "description": "Weekly standup meeting to discuss project progress",
        "start_time": {
          "timestamp": "1640995200",
          "timezone": "Asia/Shanghai"
        },
        "end_time": {
          "timestamp": "1640998800",
          "timezone": "Asia/Shanghai"
        },
        "attendees": [
          {
            "type": "user",
            "attendee_id": "ou_84aad35d084aa403a838cf73ee18467",
            "rsvp_status": "accept",
            "is_optional": false,
            "display_name": "John Doe"
          }
        ]
      }
    ]
  }
}
```

### Update Event

```http
PATCH /calendar/v4/calendars/{calendar_id}/events/{event_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "summary": "Updated Weekly Team Standup",
  "start_time": {
    "timestamp": "1640995200",
    "timezone": "Asia/Shanghai"
  },
  "end_time": {
    "timestamp": "1640999400",
    "timezone": "Asia/Shanghai"
  },
  "location": {
    "name": "Conference Room B",
    "address": "Building 1, Floor 2, Room 201"
  }
}
```

### Delete Event

```http
DELETE /calendar/v4/calendars/{calendar_id}/events/{event_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- need_notification: boolean (default: true)
```

## Meeting Management APIs

### Create Meeting

```http
POST /calendar/v4/calendars/{calendar_id}/events
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "summary": "Product Review Meeting",
  "description": "Monthly product review and planning session",
  "start_time": {
    "timestamp": "1640995200",
    "timezone": "Asia/Shanghai"
  },
  "end_time": {
    "timestamp": "1641001200",
    "timezone": "Asia/Shanghai"
  },
  "attendees": [
    {
      "type": "user",
      "attendee_id": "ou_84aad35d084aa403a838cf73ee18467",
      "rsvp_status": "needs_action",
      "is_optional": false,
      "display_name": "John Doe"
    },
    {
      "type": "user",
      "attendee_id": "ou_84aad35d084aa403a838cf73ee18468",
      "rsvp_status": "needs_action",
      "is_optional": false,
      "display_name": "Jane Smith"
    },
    {
      "type": "resource",
      "attendee_id": "omm_xxxxxxxxxx",
      "display_name": "Conference Room A"
    }
  ],
  "meeting_settings": {
    "owner_id": "ou_84aad35d084aa403a838cf73ee18467",
    "join_meeting_permission": "anyone_can_join",
    "assign_hosts": [
      "ou_84aad35d084aa403a838cf73ee18467"
    ],
    "auto_record": false,
    "open_lobby": true,
    "allow_attendees_start": false
  }
}
```

**Join Meeting Permissions:**
- `anyone_can_join`: Anyone can join
- `only_organization_employees`: Only organization employees
- `only_event_attendees`: Only event attendees

### Get Meeting Details

```http
GET /calendar/v4/calendars/{calendar_id}/events/{event_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- user_id_type: string (open_id, union_id, user_id)
- need_meeting_settings: boolean (default: false)
```

### Update Meeting

```http
PATCH /calendar/v4/calendars/{calendar_id}/events/{event_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "summary": "Updated Product Review Meeting",
  "meeting_settings": {
    "auto_record": true,
    "open_lobby": false
  }
}
```

## Attendee Management APIs

### Add Attendees

```http
POST /calendar/v4/calendars/{calendar_id}/events/{event_id}/attendees
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "attendees": [
    {
      "type": "user",
      "attendee_id": "ou_84aad35d084aa403a838cf73ee18469",
      "is_optional": true,
      "display_name": "Bob Johnson"
    }
  ],
  "need_notification": true
}
```

### List Attendees

```http
GET /calendar/v4/calendars/{calendar_id}/events/{event_id}/attendees
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- user_id_type: string (open_id, union_id, user_id)
- page_size: integer (1-100, default: 50)
- page_token: string
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "has_more": false,
    "page_token": "",
    "items": [
      {
        "type": "user",
        "attendee_id": "ou_84aad35d084aa403a838cf73ee18467",
        "rsvp_status": "accept",
        "is_optional": false,
        "display_name": "John Doe",
        "chat_id": "oc_xxxxxxxxxx",
        "is_organizer": true,
        "is_external": false
      },
      {
        "type": "user",
        "attendee_id": "ou_84aad35d084aa403a838cf73ee18468",
        "rsvp_status": "tentative",
        "is_optional": false,
        "display_name": "Jane Smith",
        "chat_id": "oc_xxxxxxxxxx",
        "is_organizer": false,
        "is_external": false
      }
    ]
  }
}
```

### Remove Attendees

```http
POST /calendar/v4/calendars/{calendar_id}/events/{event_id}/attendees/batch_delete
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "attendee_ids": [
    "ou_84aad35d084aa403a838cf73ee18469"
  ],
  "need_notification": true
}
```

### Update Attendee RSVP

```http
PATCH /calendar/v4/calendars/{calendar_id}/events/{event_id}/attendees/{attendee_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "rsvp_status": "accept"
}
```

## Meeting Room APIs

### List Meeting Rooms

```http
GET /calendar/v4/meeting_rooms
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- page_size: integer (1-100, default: 10)
- page_token: string
- order_by: string (name, capacity)
- district_id: string
- building_id: string
- floor_name: string
- user_id_type: string (open_id, union_id, user_id)
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "has_more": false,
    "page_token": "",
    "items": [
      {
        "room_id": "omm_xxxxxxxxxx",
        "building_id": "omb_xxxxxxxxxx",
        "building_name": "Main Building",
        "capacity": 10,
        "description": "Conference room with projector and whiteboard",
        "display_id": "A-301",
        "floor_name": "3F",
        "is_disabled": false,
        "name": "Conference Room A",
        "district_id": "omd_xxxxxxxxxx",
        "district_name": "Headquarters",
        "country_id": "omc_xxxxxxxxxx",
        "country_name": "China"
      }
    ]
  }
}
```

### Get Meeting Room

```http
GET /calendar/v4/meeting_rooms/{meeting_room_id}
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- user_id_type: string (open_id, union_id, user_id)
```

### Check Meeting Room Availability

```http
GET /calendar/v4/meeting_rooms/{meeting_room_id}/freeBusy
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- time_min: string (RFC3339 timestamp)
- time_max: string (RFC3339 timestamp)
- room_ids: string (comma-separated room IDs)
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "free_busy": [
      {
        "start_time": "2024-01-01T09:00:00+08:00",
        "end_time": "2024-01-01T10:00:00+08:00",
        "uid": "xxxxxxxxxx_0",
        "original_time": 1640995200
      }
    ],
    "room_id": "omm_xxxxxxxxxx"
  }
}
```

## Recurring Event APIs

### Create Recurring Event

```http
POST /calendar/v4/calendars/{calendar_id}/events
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "summary": "Daily Standup",
  "description": "Daily team standup meeting",
  "start_time": {
    "timestamp": "1640995200",
    "timezone": "Asia/Shanghai"
  },
  "end_time": {
    "timestamp": "1640997000",
    "timezone": "Asia/Shanghai"
  },
  "recurrence": "RRULE:FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR;UNTIL=20241231T235959Z",
  "attendees": [
    {
      "type": "user",
      "attendee_id": "ou_84aad35d084aa403a838cf73ee18467",
      "rsvp_status": "needs_action",
      "is_optional": false
    }
  ]
}
```

**Recurrence Rule Examples:**
- Daily: `RRULE:FREQ=DAILY`
- Weekly on Monday: `RRULE:FREQ=WEEKLY;BYDAY=MO`
- Monthly on 15th: `RRULE:FREQ=MONTHLY;BYMONTHDAY=15`
- Yearly: `RRULE:FREQ=YEARLY`
- Every 2 weeks: `RRULE:FREQ=WEEKLY;INTERVAL=2`
- Until date: `RRULE:FREQ=WEEKLY;UNTIL=20241231T235959Z`
- Count: `RRULE:FREQ=WEEKLY;COUNT=10`

### Update Recurring Event

```http
PATCH /calendar/v4/calendars/{calendar_id}/events/{event_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "summary": "Updated Daily Standup",
  "recurrence": "RRULE:FREQ=DAILY;BYDAY=MO,TU,WE,TH;UNTIL=20241231T235959Z"
}

Query Parameters:
- update_all: boolean (default: false) - Update all instances
```

### Delete Recurring Event Instance

```http
DELETE /calendar/v4/calendars/{calendar_id}/events/{event_id}
Authorization: Bearer <user_access_token>
Content-Type: application/json

Query Parameters:
- delete_all: boolean (default: false) - Delete all instances
```

## Required Scopes

To use these APIs, your app needs the following scopes:

### Read Operations
- `calendar:calendar:readonly` - Read calendar information
- `calendar:event:readonly` - Read event information
- `meeting_room:meeting_room:readonly` - Read meeting room information

### Write Operations
- `calendar:calendar` - Full calendar access
- `calendar:event` - Full event access
- `calendar:event:create` - Create events

### Specific Permissions
- `calendar:calendar:create` - Create calendars
- `calendar:event:delete` - Delete events
- `calendar:attendee` - Manage attendees
- `meeting_room:meeting_room` - Access meeting rooms

## Implementation Examples

### Example: Create Meeting with Room Booking

```javascript
async function createMeetingWithRoom(accessToken, calendarId, meetingDetails) {
  try {
    // Step 1: Check room availability
    const roomAvailability = await axios.get(
      `https://open.feishu.cn/open-apis/calendar/v4/meeting_rooms/${meetingDetails.roomId}/freeBusy`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          time_min: new Date(meetingDetails.startTime * 1000).toISOString(),
          time_max: new Date(meetingDetails.endTime * 1000).toISOString()
        }
      }
    );
    
    if (roomAvailability.data.data.free_busy.length > 0) {
      throw new Error('Meeting room is not available at the requested time');
    }
    
    // Step 2: Create meeting event
    const response = await axios.post(
      `https://open.feishu.cn/open-apis/calendar/v4/calendars/${calendarId}/events`,
      {
        summary: meetingDetails.title,
        description: meetingDetails.description,
        start_time: {
          timestamp: meetingDetails.startTime.toString(),
          timezone: 'Asia/Shanghai'
        },
        end_time: {
          timestamp: meetingDetails.endTime.toString(),
          timezone: 'Asia/Shanghai'
        },
        attendees: [
          ...meetingDetails.attendees.map(attendee => ({
            type: 'user',
            attendee_id: attendee.id,
            rsvp_status: 'needs_action',
            is_optional: attendee.optional || false,
            display_name: attendee.name
          })),
          {
            type: 'resource',
            attendee_id: meetingDetails.roomId,
            display_name: meetingDetails.roomName
          }
        ],
        meeting_settings: {
          owner_id: meetingDetails.organizerId,
          join_meeting_permission: 'only_event_attendees',
          auto_record: meetingDetails.autoRecord || false,
          open_lobby: true,
          allow_attendees_start: false
        },
        reminders: [
          { minutes: 15 },
          { minutes: 5 }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.code === 0) {
      return response.data.data.event;
    } else {
      throw new Error(`API Error: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('Failed to create meeting with room:', error);
    throw error;
  }
}

// Usage
const meeting = await createMeetingWithRoom(userAccessToken, calendarId, {
  title: 'Product Planning Meeting',
  description: 'Quarterly product planning session',
  startTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  endTime: Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
  organizerId: 'ou_84aad35d084aa403a838cf73ee18467',
  roomId: 'omm_xxxxxxxxxx',
  roomName: 'Conference Room A',
  attendees: [
    { id: 'ou_84aad35d084aa403a838cf73ee18467', name: 'John Doe', optional: false },
    { id: 'ou_84aad35d084aa403a838cf73ee18468', name: 'Jane Smith', optional: false }
  ],
  autoRecord: true
});
console.log('Created meeting:', meeting);
```

### Example: Get User's Schedule

```javascript
async function getUserSchedule(accessToken, calendarId, startDate, endDate) {
  try {
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/calendar/v4/calendars/${calendarId}/events`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          page_size: 100
        }
      }
    );
    
    if (response.data.code === 0) {
      return response.data.data.items.map(event => ({
        id: event.event_id,
        title: event.summary,
        description: event.description,
        startTime: new Date(parseInt(event.start_time.timestamp) * 1000),
        endTime: new Date(parseInt(event.end_time.timestamp) * 1000),
        location: event.location?.name,
        attendees: event.attendees?.length || 0,
        status: event.status
      }));
    } else {
      throw new Error(`API Error: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('Failed to get user schedule:', error);
    throw error;
  }
}

// Usage
const startDate = new Date();
const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Next 7 days

const schedule = await getUserSchedule(
  userAccessToken,
  'feishu.cn_xxxxxxxxxx@group.calendar.feishu.cn',
  startDate,
  endDate
);
console.log('User schedule:', schedule);
```

### Example: Update Event RSVP Status

```javascript
async function updateEventRSVP(accessToken, calendarId, eventId, attendeeId, status) {
  try {
    const response = await axios.patch(
      `https://open.feishu.cn/open-apis/calendar/v4/calendars/${calendarId}/events/${eventId}/attendees/${attendeeId}`,
      {
        rsvp_status: status
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
    console.error('Failed to update RSVP status:', error);
    throw error;
  }
}

// Usage
const result = await updateEventRSVP(
  userAccessToken,
  'feishu.cn_xxxxxxxxxx@group.calendar.feishu.cn',
  'xxxxxxxxxx_0',
  'ou_84aad35d084aa403a838cf73ee18467',
  'accept'
);
console.log('RSVP updated:', result);
```

## Best Practices

1. **Time Zones**: Always specify time zones when creating events
2. **Room Booking**: Check room availability before creating meetings
3. **Notifications**: Use appropriate reminder settings for different event types
4. **Recurring Events**: Use recurrence rules for repeating meetings
5. **Attendee Management**: Handle RSVP responses and optional attendees properly
6. **Error Handling**: Always check response codes and handle conflicts
7. **Rate Limiting**: Respect API rate limits for calendar operations
8. **Permissions**: Ensure proper calendar permissions for operations

## Common Error Codes

- `1300101`: Invalid calendar ID
- `1300102`: Invalid event ID
- `1300103`: Calendar not found
- `1300104`: Event not found
- `1300105`: Insufficient permissions
- `1300106`: Time conflict
- `1300107`: Invalid time format
- `1300108`: Meeting room not available
- `1300109`: Invalid recurrence rule
- `1300110`: Attendee limit exceeded