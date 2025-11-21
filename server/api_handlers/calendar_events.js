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
    // Get user info from cookie
    const { getAuthFromCookie } = require('../../api/_utils');
    const userInfo = getAuthFromCookie(req);

    if (!userInfo || !userInfo.access_token) {
      return res.status(401).json(failResponse('User not logged in or missing access token'));
    }

    const accessToken = userInfo.access_token;

    // 1. Get primary calendar
    const calendarListRes = await axios.get('https://open.larksuite.com/open-apis/calendar/v4/calendars', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        page_size: 50 // Min value is 50
      }
    });

    if (calendarListRes.data.code !== 0) {
      console.error('Failed to fetch calendars:', calendarListRes.data);
      return res.status(500).json(failResponse(`Lark API error: ${calendarListRes.data.msg}`));
    }

    const calendars = calendarListRes.data.data.calendar_list || [];

    if (calendars.length === 0) {
      return res.status(200).json(okResponse([]));
    }

    // 2. Get events for today from ALL calendars
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const startTimestamp = Math.floor(startOfDay.getTime() / 1000);
    const endTimestamp = Math.floor(endOfDay.getTime() / 1000);

    console.log(`📅 Fetching events for ${calendars.length} calendars`);
    console.log(`   Time range: ${startTimestamp} - ${endTimestamp}`);

    const eventPromises = calendars.map(async (calendar) => {
      try {
        const eventsRes = await axios.get(`https://open.larksuite.com/open-apis/calendar/v4/calendars/${calendar.calendar_id}/events`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          params: {
            start_time: startTimestamp.toString(),
            end_time: endTimestamp.toString(),
            page_size: 50
          }
        });

        if (eventsRes.data.code === 0) {
          return eventsRes.data.data.items || [];
        }
        return [];
      } catch (e) {
        console.error(`Failed to fetch events for calendar ${calendar.calendar_id}:`, e.message);
        return [];
      }
    });

    const allEventsArrays = await Promise.all(eventPromises);
    let allEvents = allEventsArrays.flat();

    console.log(`✅ Found ${allEvents.length} total events before filtering`);

    // Filter and format
    const formattedEvents = allEvents
      .filter(event => {
        // 1. Filter out cancelled events
        if (event.status === 'cancelled') return false;

        // 2. Strict time range check (exclude recurring masters that don't match today)
        const eventStart = event.start_time?.timestamp ? parseInt(event.start_time.timestamp) : 0;
        if (eventStart < startTimestamp || eventStart > endTimestamp) return false;

        return true;
      })
      .map(event => ({
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

    console.log(`✅ Returning ${formattedEvents.length} events after filtering`);

    // Sort by start time
    formattedEvents.sort((a, b) => (a.start_time || 0) - (b.start_time || 0));

    // Return raw events to match frontend expectation
    return res.status(200).json(okResponse(formattedEvents));

  } catch (error) {
    const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('❌ Calendar API Error:', errorDetails);
    return res.status(500).json({
      code: -1,
      msg: `Calendar API Error: ${errorDetails}`,
      data: null
    });
  }
};
