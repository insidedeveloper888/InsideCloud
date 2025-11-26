import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../../.auth/user.json');

/**
 * Auth Setup Script
 *
 * This script opens a browser for you to login manually.
 * After login, it saves the browser state (cookies, localStorage)
 * to .auth/user.json for reuse in tests.
 *
 * Run with: npx playwright test auth.setup.ts --headed
 */
setup('authenticate', async ({ page }) => {
  // Navigate to your app
  await page.goto('http://localhost:3000/?organization_slug=cloud');

  // Wait for user to login manually
  // The test will wait until the page has the expected element
  console.log('\n========================================');
  console.log('🔐 MANUAL LOGIN REQUIRED');
  console.log('========================================');
  console.log('1. Login with your Lark account');
  console.log('2. Wait for the dashboard to load');
  console.log('3. The test will auto-complete when ready');
  console.log('========================================\n');

  // Wait for successful login - look for something that only appears after auth
  // Adjust this selector based on what appears after login
  await page.waitForSelector('text=Dashboard, text=Inventory, text=Strategic Map, [data-testid="dashboard"]', {
    timeout: 120000, // 2 minutes to login
  });

  // Additional wait to ensure all cookies are set
  await page.waitForTimeout(3000);

  // Save the authentication state
  await page.context().storageState({ path: authFile });

  console.log('\n✅ Authentication saved to .auth/user.json');
  console.log('You can now run tests without logging in again!\n');
});
