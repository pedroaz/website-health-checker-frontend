import { test, expect } from "@playwright/test";
test("seed: dashboard is ready for exploration", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Know when your website needs you." }),
  ).toBeVisible();
  await expect(page.getByLabel("Website URL")).toBeEditable();
});
