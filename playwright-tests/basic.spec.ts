import { test, expect } from "@playwright/test";

test("health endpoint returns ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBe(true);
  const body = await res.json();
  expect(body.status).toBe("ok");
});

test("models endpoint requires api key", async ({ request }) => {
  const res = await request.get("/v1/models");
  expect(res.status()).toBe(401);
});

test("login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("input[type='password']")).toBeVisible();
});
