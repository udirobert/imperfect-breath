// e2e/tests/subscription-management.test.ts
import { test, expect } from '@playwright/test';

test.describe('Subscription Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('SecurePassword123!');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('should allow user to view subscription status', async ({ page }) => {
    // Navigate to subscription management
    await page.goto('/subscription');
    
    // Verify subscription information is displayed
    await expect(page.getByText('Your Subscription')).toBeVisible();
    await expect(page.getByText('Current Plan')).toBeVisible();
  });

  test('should allow user to upgrade subscription', async ({ page }) => {
    // Navigate to subscription management
    await page.goto('/subscription');
    
    // Click upgrade button
    await page.getByRole('button', { name: 'Upgrade to Premium' }).click();
    
    // Verify upgrade flow started
    await expect(page.getByText('Upgrade to Premium')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Subscribe' })).toBeVisible();
  });

  test('should allow developer to use override', async ({ page }) => {
    // Navigate to subscription management
    await page.goto('/subscription');
    
    // Click developer tools
    await page.getByRole('button', { name: 'Developer Tools' }).click();
    
    // Set developer override
    await page.getByRole('button', { name: 'Set Premium Override' }).click();
    
    // Verify override was set
    await expect(page.getByText('Developer override set')).toBeVisible();
    await expect(page.getByText('Premium Features Unlocked')).toBeVisible();
  });
});