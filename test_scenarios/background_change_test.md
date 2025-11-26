# Test Scenario: Home Page Background Change from Animated to Static

**Test ID**: HOME-BG-STATIC-001

**Date**: 2025-11-25

**Feature**: Home page dashboard background

**Change Summary**: Removed breathing gradient animation and changed to static light gradient

---

## Implementation Details

**CSS Changes Made:**
- File: `src/pages/home/index.css`
- Class: `.bg-soft-gradient` (lines 54-64)
- Removed: `animation: breathingGradient 10s ease-in-out infinite;`
- Changed: `background-size: 400% 400%;` to `background-size: 100% 100%;`
- Simplified gradient from 10 colors to 3 soft pastel colors:
  - `#f0f9ff` (light blue) at 0%
  - `#faf5ff` (light purple) at 50%
  - `#fef3f2` (light pink/peach) at 100%
- Commented out `@keyframes breathingGradient` animation (kept for reference)

---

## Test Environment

**URL**: http://localhost:3000

**Prerequisites**:
- Koa API Server: Running on port 8989
- React Dev Server: Running on port 3000
- User must be logged in (any organization)
- Dashboard view should be the default view

---

## Test Scenario 1: Verify Static Background on Dashboard

### Steps:
1. Navigate to http://localhost:3000
2. Wait for page to fully load (ensure user is logged in)
3. Verify you are on the dashboard view (not a specific product)
4. Take screenshot labeled "dashboard-static-background.png"
5. Wait 5 seconds
6. Take another screenshot labeled "dashboard-static-background-after-5s.png"
7. Compare the two screenshots - background should be identical (no animation)

### Expected Results:
- Background displays a soft, light gradient
- Gradient colors visible: light blue → light purple → light pink/peach
- Background is completely STATIC (no movement, no animation)
- Two screenshots taken 5 seconds apart should show identical backgrounds
- Background covers full viewport height
- No visual glitches or rendering issues

### Validation Checks:
- [ ] Background gradient is visible
- [ ] Colors are soft and professional (pastel tones)
- [ ] No animation detected (compare screenshots)
- [ ] Background extends full height of page
- [ ] No console errors
- [ ] Page loads successfully

---

## Test Scenario 2: Verify Console (No Errors)

### Steps:
1. Open browser developer console
2. Navigate to http://localhost:3000
3. Wait for page to fully load
4. Check console for errors, warnings, or CSS-related issues

### Expected Results:
- No JavaScript errors in console
- No CSS errors or warnings
- No "animation" related errors
- No rendering performance warnings

### Validation Checks:
- [ ] Console shows no errors
- [ ] Console shows no warnings
- [ ] No CSS-related issues logged

---

## Test Scenario 3: Verify Product Views Unaffected

### Steps:
1. Navigate to http://localhost:3000
2. Click on any product (e.g., Strategic Map, Contact Management)
3. Verify product loads correctly
4. Verify product view has its default background (not the soft gradient)
5. Navigate back to dashboard
6. Verify dashboard background returns to static gradient

### Expected Results:
- Product views load normally
- Product views use their own backgrounds (not .bg-soft-gradient)
- Dashboard background only applies to dashboard view
- Navigation between views works smoothly

### Validation Checks:
- [ ] Products load correctly
- [ ] Products have their own backgrounds
- [ ] Dashboard background is isolated to dashboard view only
- [ ] No background flickering during navigation

---

## Test Scenario 4: Mobile Responsiveness

### Steps:
1. Resize browser to mobile dimensions (375x667 - iPhone SE)
2. Navigate to http://localhost:3000
3. Wait for page to load
4. Take screenshot labeled "dashboard-mobile-background.png"
5. Verify gradient displays correctly on mobile

### Expected Results:
- Background gradient scales properly to mobile size
- Colors remain soft and professional
- No overflow or horizontal scrolling issues
- Background covers full mobile viewport

### Validation Checks:
- [ ] Mobile background displays correctly
- [ ] Gradient scales without distortion
- [ ] No layout issues caused by background

---

## Test Scenario 5: Accessibility - Reduced Motion Preference

### Steps:
1. Enable "prefers-reduced-motion" in browser settings or developer tools
2. Navigate to http://localhost:3000
3. Verify background displays correctly
4. Take screenshot labeled "dashboard-reduced-motion.png"

### Expected Results:
- Background falls back to solid color `#f8fafc` (light gray)
- No animation (should be none anyway now)
- Accessibility preference respected

### Validation Checks:
- [ ] Reduced motion preference honored
- [ ] Fallback background color applied
- [ ] No animation present

---

## Critical Checks Summary

**Visual Checks:**
- [ ] Background is static (no animation)
- [ ] Gradient colors are soft pastels
- [ ] Background covers full viewport
- [ ] Professional appearance maintained

**Technical Checks:**
- [ ] No console errors
- [ ] CSS properly loaded
- [ ] No animation property applied
- [ ] background-size is 100% 100%

**Functional Checks:**
- [ ] Dashboard loads successfully
- [ ] Product views unaffected
- [ ] Navigation works smoothly
- [ ] Mobile responsive

---

## Success Criteria

All test scenarios PASS if:
1. Background displays as static light gradient (no animation)
2. Colors are soft, professional, and pleasing
3. No console errors or warnings
4. Page loads and functions normally
5. Screenshots taken 5s apart are identical
6. Mobile responsive
7. Accessibility preferences respected

---

## Reporting

Please provide:
1. **Screenshots**: All labeled screenshots requested above
2. **Console Log**: Full console output (errors, warnings, info)
3. **Network Tab**: Any failed requests or issues
4. **Browser Info**: Browser version used for testing
5. **Pass/Fail Status**: For each test scenario
6. **Bug Reports**: For any failures with detailed reproduction steps
7. **Overall Result**: PASS or FAIL with summary

---

## Notes

- The class name `.bg-soft-gradient` was intentionally kept the same to avoid breaking existing references
- The `@keyframes breathingGradient` animation was commented out (not deleted) for historical reference
- The `@media (prefers-reduced-motion: reduce)` block remains for accessibility compliance
- This change affects ONLY the dashboard view, not other product views

---

## Timeline

- Implementation completed: 2025-11-25
- Testing requested: 2025-11-25
- Expected test completion: Same day
