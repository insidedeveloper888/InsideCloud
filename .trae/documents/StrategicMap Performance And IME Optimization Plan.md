## Objectives
1. Restore smooth typing (especially Chinese IME) by eliminating re-renders during composition and deferring commits correctly.
2. Reduce UI jank in Lark by cutting logging overhead and DOM load.
3. Minimize network churn and state churn in StrategicMap to keep UI responsive.

## Targeted Improvements
### Input & IME Reliability
- Convert editing to an uncontrolled input strategy with composition-safe handlers:
  - Add `onCompositionStart/onCompositionEnd` gates; do not treat Enter as submit while composing.
  - Keep text in a ref during edit; only call `setState` on commit (blur or Enter after composition). Update: `src/components/StrategicMap/index.jsx:1290–1441` (key handling) and inputs in `StrategicMapCell` `668–992`.
- Avoid controlled `value` for the edit textarea; set initial value once, then read DOM value on commit to avoid keystroke re-renders.

### Reduce DOM & Re-renders
- Introduce virtualization for grid sections:
  - Use `react-window` (`FixedSizeGrid`) for monthly/weekly/daily tables to render only visible cells.
  - On mobile, virtualize category card item lists.
- Strengthen memoization:
  - Ensure `StrategicMapCell` props are stable; pass IDs and primitive flags only.
  - Memoize cell item arrays (`getCellItems`) by `timeframe+row+column` and avoid recreating arrays each render: `src/components/StrategicMap/index.jsx:649–665`.
- Cache heavy date computations per year:
  - Memoize `weeksByMonth` and `daysByWeek` results keyed by `focusYear`: `src/components/StrategicMap/index.jsx:200–230, 247–280`.

### Cut Logging & Diagnostics Overhead
- Gate `vConsole` behind an env flag; do not load in production Lark: `public/index.html:11–16`.
- Wrap `console.*` with a leveled logger and disable verbose logs in production:
  - `src/utils/auth_access_util.js:17–420`, `src/pages/home/index.js:669–785`, `src/components/StrategicMap/index.jsx:318–329, 1041–1082`.
- Reduce request/response payload logging in `api/strategic_map.js:169–185, 318–506`.

### Network & State Churn
- Stop full cascade refetch after save/delete; update only affected timeframe bucket and cell key:
  - Replace `refreshCascadeTimeframes()` `src/components/StrategicMap/index.jsx:629–647` with targeted cache patch and optional background refresh.
- Use functional `setItems` to update specific keys instead of rebuilding large maps; keep `items` in a ref and version-bump a small state to trigger renders.
- Debounce tab loads and defend against duplicate fetches: `src/components/StrategicMap/index.jsx:456–506, 607–612`.

### Lark-Specific Optimizations
- JSAPI ready gating: defer heavy initial data loads until `window.h5sdk.ready` is true; avoid double auth/data requests: `src/pages/home/index.js:708–785`.
- Align `lk_token` semantics to raw Lark token to prevent retries; remove JSON/base64 parsing in `api/get_organization_config.js:115–134`.

## Validation & Measurement
- Add a simple perf counter overlay (dev-only): render duration per section and keystroke latency during edit.
- Profile in Lark webview with reduced logging; measure:
  - IME typing latency (Enter commit vs composition).
  - Scroll/render FPS with virtualization enabled.
  - API call counts before/after targeted reload changes.

## Rollout Steps
1. Implement IME-safe editing flow in `StrategicMapCell` and keydown handlers.
2. Add virtualization to monthly/weekly/daily sections; validate selection/edit flows.
3. Gate vConsole and logs; verify no loss of critical diagnostics.
4. Replace cascade refresh with targeted updates; ensure server returns enough data to patch the cache.
5. Memoize date computations and cell item derivations.
6. Test in Lark: authentication, typing, scrolling, add/edit/delete and status toggles.

## Expected Impact
- IME typing becomes fluent (no dropped keystrokes, no premature submits).
- Reduced DOM and logging improve responsiveness and FPS in Lark webview.
- Network and state churn reductions lower CPU usage and GC pressure, stabilizing the UI during edits and navigation.