import { test, expect, type Page } from "@playwright/test";

const PASSWORD = "E2eTestPass123";
const PAGES = ["/", "/dashboard", "/providers", "/aliases", "/endpoint", "/usage", "/request-details", "/settings"];

async function login(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("Enter dashboard password").fill(PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

test.describe("3EVO Router dashboard", () => {
  test("unauthenticated dashboard redirects to login", async ({ page }) => {
    await page.goto("/providers");
    await expect(page).toHaveURL(/\/login/);
  });

  test("wrong password is rejected", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Enter dashboard password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.locator("text=/invalid password|locked/")).toBeVisible();
  });

  test("login and every page renders without errors", async ({ page }) => {
    const problems: string[] = [];
    page.on("pageerror", (e) => problems.push(`pageerror ${page.url()}: ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") problems.push(`console ${page.url()}: ${m.text()}`); });
    page.on("response", (r) => { if (r.url().includes("/api/") && r.status() >= 500) problems.push(`${r.status()} ${r.url()}`); });

    await login(page);
    for (const p of PAGES) {
      await page.goto(p);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("body")).not.toContainText(/Application error|Internal Server Error|This page couldn.t load/);
      await page.screenshot({ path: `test-results/page-${p.replace(/\W+/g, "_") || "root"}.png` });
    }
    expect(problems).toEqual([]);
  });

  test("aliases: add and remove", async ({ page }) => {
    await login(page);
    await page.goto("/aliases");
    await page.getByPlaceholder("Alias (e.g. gpt-3.5)").fill("e2e-alias");
    await page.getByPlaceholder("Provider").fill("e2e-provider");
    await page.getByPlaceholder("Model").fill("e2e-model");
    await page.getByRole("button", { name: "+ Add Alias" }).click();
    const row = page.locator("tr", { hasText: "e2e-alias" });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Remove" }).click();
    await expect(row).toHaveCount(0);
  });

  test("providers: add and remove custom provider", async ({ page }) => {
    await login(page);
    await page.goto("/providers");
    await page.getByPlaceholder("Name").fill("e2e-prov");
    await page.getByPlaceholder("Base URL").fill("http://127.0.0.1:9/v1");
    await page.getByPlaceholder("API Key").fill("sk-test");
    await page.getByRole("button", { name: "+ Add Provider" }).click();
    const card = page.locator("div", { hasText: "e2e-prov" }).filter({ has: page.getByRole("button", { name: "Remove" }) }).last();
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "Remove" }).click();
    await expect(page.locator("text=No custom providers yet.")).toBeVisible();
  });

  test("API key from the session works against /v1/models, bad key is rejected", async ({ page, request }) => {
    await login(page);
    const res = await page.request.post("/api/api-keys", { data: { name: "e2e" } });
    expect(res.ok()).toBeTruthy();
    const { key } = await res.json();
    const ok = await request.get("/v1/models", { headers: { Authorization: `Bearer ${key}` } });
    expect(ok.status()).toBe(200);
    const bad = await request.get("/v1/models", { headers: { Authorization: "Bearer nope" } });
    expect(bad.status()).toBe(401);
  });

  test("logout-less session check: /api/auth/me", async ({ page }) => {
    await login(page);
    const me = await page.request.get("/api/auth/me");
    expect(await me.json()).toEqual({ authenticated: true });
  });
});
