/**
 * Calendar Events API Endpoint
 * GET /api/calendar_events
 *
 * Returns user's calendar events for today using user_access_token
 * Requires calendar:calendar.event:readonly scope
 */

const { handleCors, okResponse, failResponse } = require('../../api/_utils');
const axios = require('axios');

module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json(failResponse('Method not allowed'));
  }

  try {
    // Get user_access_token from Authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const userAccessToken = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '')
      : null;

    if (!userAccessToken) {
      return res.status(401).json(failResponse('User access token required'));
    }

    // Calculate today's start and end timestamps
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const startTime = Math.floor(startOfDay.getTime() / 1000).toString();
    const endTime = Math.floor(endOfDay.getTime() / 1000).toString();

    // First, get the user's primary calendar
    const calendarListResponse = await axios.get(
      'https://open.larksuite.com/open-apis/calendar/v4/calendars',
      {
        headers: {
          'Authorization': `Bearer ${userAccessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (calendarListResponse.data.code !== 0) {
      console.error('Failed to get calendar list:', calendarListResponse.data);
      return res.status(500).json(failResponse(`Failed to get calendar: ${calendarListResponse.data.msg}`));
    }

    const calendars = calendarListResponse.data.data?.calendar_list || [];

    // Find primary calendar (type = 'primary') or use first one
    const primaryCalendar = calendars.find(c => c.type === 'primary') || calendars[0];

    if (!primaryCalendar) {
      return res.status(200).json(okResponse({ events: [], message: 'No calendar found' }));
    }

    const calendarId = primaryCalendar.calendar_id;

    // Get events for today
    const eventsResponse = await axios.get(
      `https://open.larksuite.com/open-apis/calendar/v4/calendars/${calendarId}/events`,
      {
        params: {
          start_time: startTime,
          end_time: endTime,
          page_size: 50
        },
        headers: {
          'Authorization': `Bearer ${userAccessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (eventsResponse.data.code !== 0) {
      console.error('Failed to get events:', eventsResponse.data);
      return res.status(500).json(failResponse(`Failed to get events: ${eventsResponse.data.msg}`));
    }

    const events = eventsResponse.data.data?.items || [];

    // Format events for frontend
    const formattedEvents = events.map(event => ({
      id: event.event_id,
      summary: event.summary || 'No title',
      description: event.description || '',
      start_time: event.start_time?.timestamp ? parseInt(event.start_time.timestamp) : null,
      end_time: event.end_time?.timestamp ? parseInt(event.end_time.timestamp) : null,
      is_all_day: !event.start_time?.timestamp,
      location: event.location?.name || '',
      status: event.status,
      color: event.color || null,
      visibility: event.visibility
    }));

    // Sort by start time
    formattedEvents.sort((a, b) => (a.start_time || 0) - (b.start_time || 0));

    return res.status(200).json(okResponse({
      events: formattedEvents,
      calendar_name: primaryCalendar.summary || 'Calendar',
      date: now.toISOString().split('T')[0]
    }));

  } catch (error) {
    console.error('Error getting calendar events:', error.response?.data || error.message);

    // Check for permission error
    if (error.response?.data?.code === 99991663 || error.response?.status === 403) {
      return res.status(403).json(failResponse('Calendar permission not granted. Please authorize calendar access.'));
    }

    return res.status(500).json(failResponse('Failed to get calendar events'));
  }
};
