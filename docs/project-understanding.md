# Web App Quick Start — Project Understanding and Getting Started

This repository is a quick-start template for building a custom web application for Lark (Feishu). It combines a React frontend (Create React App) and a Koa-based Node.js backend, with Lark H5 JS SDK integration for JSAPI usage and authentication.

## Tech Stack
- Frontend: `React 18` with `react-router-dom@6`, bootstrapped by `react-scripts@5`
- Backend: `Node.js` with `Koa`, `koa-router`, `koa-session`
- HTTP client: `axios`
- Auth & utilities: `js-cookie`, `crypto-js`
- Lark SDK: H5 JS SDK loaded via script tag in `public/index.html`

## Directory Overview
- `src/` React application
  - `index.js` renders `<App />`
  - `App.js` sets routes: `/` → `Home`, fallback → `NotFound`
  - `pages/home/` Home page and styles
  - `components/userinfo/` Displays user avatar/name
  - `components/useapi/` Demonstrates Lark JSAPI calls (`tt.getSystemInfo`, `tt.showActionSheet`, `tt.previewImage`)
  - `utils/auth_access_util.js` Frontend JSAPI auth and login flow
  - `config/client_config.js` Generated client config (App ID, API paths, port)
- `public/index.html` Injects Lark H5 JS SDK (`window.h5sdk`/`window.tt`), enables vConsole for debugging
- `server/` Koa server
  - `server.js` API endpoints and session; talks to Lark Open APIs
  - `server_config.js` Generated server config (App ID/Secret, API paths, nonce, port)
  - `server_util.js` Helpers (CORS headers, cookie management, ok/fail responses)
- `cli/` Simple CLI for config generation
  - `cli.js` Command `npm run config`
  - `config_helper.js` Prompts for App ID/Secret/Port and writes configs
- `README.md` Minimal run instructions

## How It Works
- JSAPI Authorization (frontend)
  - `handleJSAPIAccess` requests signature parameters from backend (`/api/get_sign_parameters?url=...`).
  - Frontend calls `window.h5sdk.config` with `appId`, `timestamp`, `nonceStr`, `signature`, and `jsApiList`.
  - On success, you can call JSAPIs via `window.tt.*` (e.g., `showToast`, `getSystemInfo`).
- User Login (免登)
  - `handleUserAuth` triggers `window.tt.requestAuthCode({ appId })` to obtain an authorization code.
  - Frontend calls backend `GET /api/get_user_access_token?code=...`.
  - Backend exchanges the code for `user_access_token` using Lark Open API (`/open-apis/authen/v1/access_token`).
  - Token is stored in `localStorage` and cookie; session configured via `koa-session`.
- Backend Responsibilities
  - Maintains session and sets CORS headers for local dev.
  - Fetches `app_access_token` using `app_id` and `app_secret`.
  - Provides JSAPI sign parameters and handles user token exchange.

## Scripts
- `npm run config` — prompts for App ID/Secret/Port; generates `src/config/client_config.js` and `server/server_config.js`.
- `npm run start` — runs backend (`node server/server.js`) and frontend (`react-scripts start`) concurrently; frontend opens without browser (`BROWSER=none`).
- `npm run start:web` — runs only the React dev server.
- `npm run start:server` — runs only the Koa server.
- `npm run build` — builds the React app.

## Setup and Development
1. Install dependencies: `npm install`
2. Configure app: `npm run config`
   - Provide your Lark App ID and App Secret.
   - Choose API port (default `8989`).
3. Start both servers: `npm run start`
   - Frontend at `http://localhost:3000`
   - Backend at `http://localhost:<apiPort>` (from config)
4. Test JSAPI
   - Ensure the app opens inside Lark/Feishu or a webview that provides `window.h5sdk`/`window.tt`.
   - Home page demonstrates JSAPI calls and shows authenticated user info.

## Lark Integration Notes
- `public/index.html` includes the Lark H5 JS SDK: `https://lf1-cdn-tos.bytegoofy.com/goofy/lark/op/h5-js-sdk-1.5.23.js`.
- JSAPIs are accessible via `window.tt`, and SDK lifecycle via `window.h5sdk.ready`.
- Backend exchanges `app_access_token` and `user_access_token` using official Lark Open API endpoints (see server logs for step-by-step flow).
- For production, tighten CORS and cookie settings; current headers are permissive for local development only.

## Configuration Files (Generated)
- `src/config/client_config.js`
  - `appId` — your Lark app ID
  - `getUserAccessTokenPath` — e.g. `/api/get_user_access_token`
  - `getSignParametersPath` — e.g. `/api/get_sign_parameters`
  - `apiPort` — backend port
- `server/server_config.js`
  - `appId`, `appSecret` — Lark app credentials
  - `noncestr` — random string used in signing
  - same API paths and port

## Context7 — Documentation Access
Context7 provides an MCP server that lets coding assistants pull up-to-date, version-specific documentation and code examples directly from source repositories.

- Integration examples (from `/upstash/context7`):
  - Add server to tools: `amp mcp add context7 https://mcp.context7.com/mcp`
  - Auth via header: `CONTEXT7_API_KEY=YOUR_API_KEY`
  - Local runs and OS-specific configs (Windows/MacOS) using `npx @upstash/context7-mcp` or direct Node paths.
- Typical usage pattern:
  - Resolve a library ID (e.g., `/supabase/supabase`).
  - Fetch topic-focused docs (e.g., `overview`, `hooks`) with tokens limit.
  - Leverage retrieved docs to implement features using accurate APIs.

While Context7 is not directly used by this sample app, it’s useful during development to consult authoritative docs for frameworks and SDKs.

## How To Start Development
- Use this repo as a base for a Lark web app that:
  - Authenticates users with `requestAuthCode` and backend token exchange.
  - Calls Lark JSAPIs after successful SDK `config`.
- Extend Home page components or add new pages under `src/pages/*`.
- Add backend routes under `server/server.js` with `koa-router`.
- Secure production:
  - Restrict CORS, set precise cookie `domain`/`path`, enforce HTTPS.
  - Store secrets outside the repo; use environment variables.
  - Add error handling and input validation for API endpoints.

## Troubleshooting
- `window.h5sdk` or `window.tt` undefined
  - Ensure the app runs inside Lark’s webview or environment that provides the SDK.
  - Confirm SDK script URL loads and no CSP blocks it.
- Auth code not returned
  - Check `client_config.appId` matches the Lark app.
  - Verify the app permissions in Lark developer console.
- CORS or cookie issues
  - Calls require `withCredentials: true`; relax CORS only in local dev, configure properly for production.
- Backend failures
  - Check `server_config.js` credentials.
  - Verify network access to `open.larksuite.com` endpoints and response `code === 0`.

## Next Steps
- Implement your business features as new routes and components.
- Add state management (if needed) and page-level data fetching.
- Prepare production build with `npm run build` and serve static files behind a secure proxy.