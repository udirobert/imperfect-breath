// e2e/tests/nft-marketplace.test.ts
import { test, expect } from '@playwright/test';

test.describe('NFT Marketplace Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('SecurePassword123!');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('should allow user to browse NFT patterns', async ({ page }) => {
    // Navigate to marketplace
    await page.goto('/marketplace');
    
    // Verify marketplace loaded
    await expect(page.getByText('Breathing Pattern NFTs')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mint New Pattern' })).toBeVisible();
  });

  test('should allow user to mint a new breathing pattern NFT', async ({ page }) => {
    // Navigate to marketplace
    await page.goto('/marketplace');
    
    // Click mint new pattern button
    await page.getByRole('button', { name: 'Mint New Pattern' }).click();
    
    // Fill in pattern details
    await page.getByLabel('Pattern Name').fill('Relaxation Pattern');
    await page.getByLabel('Description').fill('A calming breathing pattern for relaxation');
    await page.getByLabel('Inhale').fill('4');
    await page.getByLabel('Hold').fill('7');
    await page.getByLabel('Exhale').fill('8');
    
    // Mint the pattern
    await page.getByRole('button', { name: 'Mint NFT' }).click();
    
    // Verify minting started
    await expect(page.getByText('Minting your NFT')).toBeVisible();
  });

  test('should allow user to purchase an NFT', async ({ page }) => {
    // Navigate to marketplace
    await page.goto('/marketplace');
    
    // Click on first available NFT
    await page.getByRole('button', { name: 'Purchase' }).first().click();
    
    // Confirm purchase
    await page.getByRole('button', { name: 'Confirm Purchase' }).click();
    
    // Verify purchase started
    await expect(page.getByText('Processing your purchase')).toBeVisible();
  });
});