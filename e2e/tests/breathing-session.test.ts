// e2e/tests/breathing-session.test.ts
import { test, expect } from '@playwright/test';

test.describe('Breathing Session Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('SecurePassword123!');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('should allow user to start a breathing session', async ({ page }) => {
    // Navigate to breathing session page
    await page.goto('/session');
    
    // Select a breathing pattern
    await page.getByRole('button', { name: '4-7-8 Breathing' }).click();
    
    // Start the session
    await page.getByRole('button', { name: 'Start Session' }).click();
    
    // Verify session started
    await expect(page.getByText('Inhale')).toBeVisible();
    await expect(page.getByText('Hold')).toBeVisible();
    await expect(page.getByText('Exhale')).toBeVisible();
  });

  test('should allow user to complete a breathing session', async ({ page }) => {
    // Navigate to breathing session page
    await page.goto('/session');
    
    // Select a breathing pattern
    await page.getByRole('button', { name: 'Box Breathing' }).click();
    
    // Start the session
    await page.getByRole('button', { name: 'Start Session' }).click();
    
    // Wait for session to complete (mocking a 60 second session)
    await page.waitForTimeout(60000);
    
    // Verify session completed
    await expect(page.getByText('Session Complete')).toBeVisible();
    await expect(page.getByText('Great job!')).toBeVisible();
  });

  test('should allow user to save session data', async ({ page }) => {
    // Navigate to breathing session page
    await page.goto('/session');
    
    // Select a breathing pattern
    await page.getByRole('button', { name: 'Deep Breathing' }).click();
    
    // Start the session
    await page.getByRole('button', { name: 'Start Session' }).click();
    
    // Wait for session to complete
    await page.waitForTimeout(60000);
    
    // Save session data
    await page.getByRole('button', { name: 'Save Session' }).click();
    
    // Verify session saved
    await expect(page.getByText('Session saved successfully')).toBeVisible();
  });
});