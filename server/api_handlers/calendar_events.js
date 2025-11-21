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
    const calendarListRes = await axios.get('https://open.feishu.cn/open-apis/calendar/v4/calendars', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        page_size: 20 // We just need the primary one
      }
    });

    if (calendarListRes.data.code !== 0) {
      console.error('Failed to fetch calendars:', calendarListRes.data);
      return res.status(500).json(failResponse(`Lark API error: ${calendarListRes.data.msg}`));
    }

    const calendars = calendarListRes.data.data.calendar_list || [];
    const primaryCalendar = calendars.find(c => c.summary === 'primary' || c.type === 'primary') || calendars[0];

    if (!primaryCalendar) {
      return res.status(200).json(okResponse([]));
    }

    const calendarId = primaryCalendar.calendar_id;

    // 2. Get events for today
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    console.log(`📅 Fetching events for calendar ${calendarId}`);
    console.log(`   Time range: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`);

    const eventsRes = await axios.get(`https://open.feishu.cn/open-apis/calendar/v4/calendars/${calendarId}/events`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        start_time: startOfDay.toISOString(),
        end_time: endOfDay.toISOString(),
        page_size: 50
      }
    });

    if (eventsRes.data.code !== 0) {
      const errorDetails = JSON.stringify(eventsRes.data);
      console.error('❌ Failed to fetch events:', errorDetails);
      return res.status(500).json({
        code: -1,
        msg: `Calendar API Error: ${errorDetails}`,
        data: null
      });
    }

    const events = eventsRes.data.data.items || [];
    console.log(`✅ Found ${events.length} events`);

    // Sort by start time
    events.sort((a, b) => {
      const startA = parseInt(a.start_time.timestamp);
      const startB = parseInt(b.start_time.timestamp);
      return startA - startB;
    });

    // Return raw events to match frontend expectation
    return res.status(200).json(okResponse(events));

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
