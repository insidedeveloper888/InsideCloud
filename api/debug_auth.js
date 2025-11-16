/**
 * Debug Auth Endpoint
 * GET /api/debug_auth
 *
 * Shows what authentication data is available
 */

const { handleCors } = require('./_utils');
const cookie = require('cookie');

module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Parse cookies
  let cookies = {};
  if (req.headers.cookie) {
    cookies = cookie.parse(req.headers.cookie);
  }

  // Get all headers
  const headers = req.headers;

  // Build debug info
  const debugInfo = {
    timestamp: new Date().toISOString(),
    cookies: {
      lk_token: cookies.lk_token ? `${cookies.lk_token.substring(0, 20)}...` : '(not found)',
      auth_token: cookies.auth_token ? `${cookies.auth_token.substring(0, 20)}...` : '(not found)',
      all_cookies: Object.keys(cookies)
    },
    headers: {
      authorization: headers.authorization || '(not found)',
      origin: headers.origin || '(not found)',
      referer: headers.referer || '(not found)',
      'user-agent': headers['user-agent'] || '(not found)',
      host: headers.host || '(not found)'
    },
    request: {
      method: req.method,
      url: req.url,
      query: req.query
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: process.env.SUPABASE_URL ? 'configured ✅' : 'MISSING ❌',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured ✅' : 'MISSING ❌'
    }
  };

  return res.status(200).json({
    success: true,
    message: 'Auth debug information',
    data: debugInfo
  });
};
