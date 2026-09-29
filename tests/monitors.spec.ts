import { test, expect } from "@playwright/test";
const api = process.env.API_URL ?? "http://localhost:8080";
const mailpit = process.env.MAILPIT_URL ?? "http://localhost:8025";
test("monitor lifecycle and captured email", async ({ page, request }) => {
  const email = `browser-${Date.now()}@example.test`;
  let monitorId: string | undefined;
  try {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Know when your website needs you." }),
    ).toBeVisible();
    await page
      .getByLabel("Website URL")
      .fill("http://demo-target:8080/healthy");
    await page.getByLabel("Result email").fill(email);
    await page.getByRole("button", { name: "Start monitoring" }).click();
    const card = page.getByRole("article").filter({ hasText: email });
    await expect(card.getByText("Healthy", { exact: true })).toBeVisible();
    await expect(card.getByText(/Email sent/)).toBeVisible();
    const monitors = await (await request.get(`${api}/api/monitors`)).json();
    monitorId = monitors.find((m: { email: string }) => m.email === email).id;
    await card.getByRole("button", { name: "Pause", exact: true }).click();
    await expect(
      card.getByRole("button", { name: "Resume", exact: true }),
    ).toBeVisible();
    await card.getByRole("link").click();
    await expect(
      page.getByRole("heading", { name: "Check history" }),
    ).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await page.getByRole("button", { name: "Check now", exact: true }).click();
    await expect(page.locator("tbody tr")).toHaveCount(2);
    await expect
      .poll(async () => {
        const response = await request.get(`${mailpit}/api/v1/search`, {
          params: { query: `to:${email}` },
        });
        return (await response.json()).messages.length;
      })
      .toBe(2);
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Pause", exact: true }),
    ).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(3);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("article").filter({ hasText: email }),
    ).toHaveCount(0);
  } finally {
    if (monitorId) await request.delete(`${api}/api/monitors/${monitorId}`);
  }
});
for (const [path, error] of [
  ["failing", "HTTP 503"],
  ["slow", "Timed out after 10 seconds"],
]) {
  test(`shows ${path} result and email`, async ({ page, request }) => {
    const email = `${path}-${Date.now()}@example.test`;
    let id: string | undefined;
    try {
      await page.goto("/");
      await page
        .getByLabel("Website URL")
        .fill(`http://demo-target:8080/${path}`);
      await page.getByLabel("Result email").fill(email);
      await page.getByRole("button", { name: "Start monitoring" }).click();
      const card = page.getByRole("article").filter({ hasText: email });
      await expect(card.getByText("Unhealthy", { exact: true })).toBeVisible();
      id = (await card.getByRole("link").getAttribute("href"))!
        .split("/")
        .pop();
      await card.getByRole("link").click();
      await expect(
        page.getByRole("cell", { name: error, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("cell", { name: "Sent", exact: true }),
      ).toBeVisible();
    } finally {
      if (id) await request.delete(`${api}/api/monitors/${id}`);
    }
  });
}
test("private destinations produce useful validation feedback", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Website URL").fill("http://127.0.0.1:8080");
  await page.getByLabel("Result email").fill("validation@example.test");
  await page.getByRole("button", { name: "Start monitoring" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Private, local, and reserved",
  );
});
test("mobile layout stays within viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Start monitoring" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
