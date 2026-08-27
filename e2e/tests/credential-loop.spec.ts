/**
 * Credential-loop smoke test — Brume's core differentiator journey.
 *
 * Covers: home → session entry → patterns → progress surfaces render,
 * branding is Brume, and no dead links to buried routes (marketplace/lens).
 *
 * NOTE: camera verification can't run headless, so the *verified* path is
 * exercised via unit-level hooks, not here. This spec guards the loop's
 * skeleton and the consolidation invariant (no links to buried surfaces).
 */
import { test, expect } from "@playwright/test";

test.describe("Brume core loop", () => {
  test("home renders Brume positioning and today's check-in", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Brume/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Breathe");
    await expect(page.getByText("Prove")).toBeVisible();
    // Scope to the heading instead of getByText("Prove") to avoid matching
    // both the hero h1 ("Prove It.") and the tagline ("progress you can prove").
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Prove");
    await expect(page.getByText("What do you need today?")).toBeVisible();
  });

  test("check-in produces an evidence-cited recommendation", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Stressed" }).click();
    // ContextCard rationale appears with a source chip
    await expect(page.getByText(/Your check-in · breath science/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Start / })).toBeVisible();
  });

  test("no dead links to buried surfaces", async ({ page }) => {
    await page.goto("/");
    const dead = page.locator(
      'a[href="/marketplace"], a[href="/lens"], a[href="/create"], a[href="/instructor-onboarding"]',
    );
    await expect(dead).toHaveCount(0);
  });

  test("patterns page is reachable from home CTA", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Explore Patterns" }).click();
    await expect(page).toHaveURL(/\/patterns/);
  });

  test("progress page renders empty state or stats", async ({ page }) => {
    await page.goto("/progress");
    const empty = page.getByText("No progress yet.");
    const stats = page.getByText("Current Streak");
    await expect(empty.or(stats)).toBeVisible();
  });
});
