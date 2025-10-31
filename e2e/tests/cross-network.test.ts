// e2e/tests/cross-network.test.ts
import { test, expect } from '@playwright/test';

test.describe('Cross-Network Integration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('SecurePassword123!');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('should allow user to mint NFT and share on social networks', async ({ page }) => {
    // Navigate to cross-network activity
    await page.goto('/cross-network');
    
    // Mint a new pattern NFT
    await page.getByRole('button', { name: 'Mint & Share' }).click();
    
    // Fill in pattern details
    await page.getByLabel('Pattern Name').fill('Social Breathing Pattern');
    await page.getByLabel('Description').fill('A pattern shared across networks');
    await page.getByLabel('Inhale').fill('4');
    await page.getByLabel('Hold').fill('4');
    await page.getByLabel('Exhale').fill('4');
    
    // Mint and share
    await page.getByRole('button', { name: 'Mint & Share' }).click();
    
    // Verify both blockchain and social actions
    await expect(page.getByText('NFT minted successfully')).toBeVisible();
    await expect(page.getByText('Posted to social networks')).toBeVisible();
  });

  test('should allow user to create a breathing challenge', async ({ page }) => {
    // Navigate to cross-network activity
    await page.goto('/cross-network');
    
    // Create a new challenge
    await page.getByRole('button', { name: 'Create Challenge' }).click();
    
    // Fill in challenge details
    await page.getByLabel('Challenge Name').fill('7-Day Mindfulness Challenge');
    await page.getByLabel('Duration (days)').fill('7');
    
    // Create challenge
    await page.getByRole('button', { name: 'Create Challenge' }).click();
    
    // Verify challenge creation
    await expect(page.getByText('Challenge created successfully')).toBeVisible();
    await expect(page.getByText('7-Day Mindfulness Challenge')).toBeVisible();
  });
});