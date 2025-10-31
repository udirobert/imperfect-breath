// e2e/tests/social-features.test.ts
import { test, expect } from '@playwright/test';

test.describe('Social Features Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('SecurePassword123!');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('should allow user to post to social feed', async ({ page }) => {
    // Navigate to social feed
    await page.goto('/social');
    
    // Click create post button
    await page.getByRole('button', { name: 'Create Post' }).click();
    
    // Fill in post content
    await page.getByLabel('What\'s on your mind?').fill('Just completed a great breathing session!');
    
    // Post to feed
    await page.getByRole('button', { name: 'Post' }).click();
    
    // Verify post was created
    await expect(page.getByText('Just completed a great breathing session!')).toBeVisible();
  });

  test('should allow user to follow another user', async ({ page }) => {
    // Navigate to social feed
    await page.goto('/social');
    
    // Find a user to follow
    await page.getByRole('button', { name: 'Follow' }).first().click();
    
    // Verify follow action
    await expect(page.getByText('Following')).toBeVisible();
  });

  test('should allow user to like a post', async ({ page }) => {
    // Navigate to social feed
    await page.goto('/social');
    
    // Like first post
    await page.getByRole('button', { name: 'Like' }).first().click();
    
    // Verify like action
    await expect(page.getByText('1 like')).toBeVisible();
  });
});