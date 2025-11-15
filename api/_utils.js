const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const CryptoJS = require('crypto-js');

// Configuration (same as server_config.js)
const config = {
    appId: "cli_a7c6350f9778d010",
    appSecret: "cMfrfWMK5vppT6zh89zzohz5jby8GiRc",
    noncestr: "TRnJnK2X7MtMiMDHwwdR38hnebbdeMAE",
};

// In-memory storage for jsapi_ticket (in production, use Redis or similar)
let jsapiTicketCache = {
    ticket: '',
    expires: 0
};

// Calculate sign parameters for JSAPI
function calculateSignParam(ticketString, url) {
    const timestamp = (new Date()).getTime();
    const verifyStr = `jsapi_ticket=${ticketString}&noncestr=${config.noncestr}&timestamp=${timestamp}&url=${url}`;
    let signature = CryptoJS.SHA1(verifyStr).toString(CryptoJS.enc.Hex);
    const signParam = {
        "app_id": config.appId,
        "signature": signature,
        "noncestr": config.noncestr,
        "timestamp": timestamp,
    };
    return signParam;
}

// Get jsapi_ticket from cache
function getJsapiTicket() {
    const now = Date.now();
    if (jsapiTicketCache.ticket && jsapiTicketCache.expires > now) {
        return jsapiTicketCache.ticket;
    }
    return null;
}

// Set jsapi_ticket in cache (expires in 2 hours)
function setJsapiTicket(ticket) {
    jsapiTicketCache.ticket = ticket;
    jsapiTicketCache.expires = Date.now() + (2 * 60 * 60 * 1000); // 2 hours
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';

// CORS configuration
function setCorsHeaders(res, req) {
    // When using credentials, must specify exact origin (cannot use '*')
    const origin = req.headers.origin || 'http://localhost:3000';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Handle CORS preflight
function handleCors(req, res) {
    setCorsHeaders(res, req);
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return true;
    }
    return false;
}

// Response helpers
function okResponse(data) {
    return {
        code: 0,
        msg: "success",
        data: data
    };
}

function failResponse(msg) {
    return {
        code: -1,
        msg: msg,
        data: null
    };
}

// JWT token helpers
function createToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// Cookie helpers
function setAuthCookie(res, userInfo) {
    const token = createToken(userInfo);
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 2 * 60 * 60 * 1000, // 2 hours
        path: '/'
    };
    
    res.setHeader('Set-Cookie', cookie.serialize('auth_token', token, cookieOptions));
    return token;
}

function getAuthFromCookie(req) {
    if (!req.headers.cookie) {
        return null;
    }
    
    const cookies = cookie.parse(req.headers.cookie);
    const token = cookies.auth_token;
    
    if (!token) {
        return null;
    }
    
    return verifyToken(token);
}

// Session-like storage for jsapi_ticket (in memory, will reset on function restart)
const memoryStore = new Map();

function setMemoryValue(key, value, ttl = 7200000) { // 2 hours default
    memoryStore.set(key, {
        value,
        expires: Date.now() + ttl
    });
}

function getMemoryValue(key) {
    const item = memoryStore.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
        memoryStore.delete(key);
        return null;
    }
    
    return item.value;
}

module.exports = {
    config,
    setCorsHeaders,
    handleCors,
    okResponse,
    failResponse,
    createToken,
    verifyToken,
    setAuthCookie,
    getAuthFromCookie,
    setMemoryValue,
    getMemoryValue,
    calculateSignParam,
    getJsapiTicket,
    setJsapiTicket
};