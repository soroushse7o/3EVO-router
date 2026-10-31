import { test, expect } from "@playwright/test";

test.describe("3EVO Router smoke tests", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await expect(page.locator("text=3EVO Router")).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await expect(page.locator("text=Login")).toBeVisible();
  });

  test("providers page loads", async ({ page }) => {
    await page.goto("http://localhost:3000/providers");
    await expect(page.locator("text=Providers")).toBeVisible();
  });

  test("proxy pools page loads", async ({ page }) => {
    await page.goto("http://localhost:3000/proxy-pools");
    await expect(page.locator("text=Proxy Pools")).toBeVisible();
  });
});
