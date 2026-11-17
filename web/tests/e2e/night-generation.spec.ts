import { expect, test } from "@playwright/test";

test("organizer creates a Night, generates and sees 2 Proposals", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Plan a Night" }).click();

  await expect(page.getByText("Status: collecting")).toBeVisible();
  await page.getByRole("button", { name: "Generate" }).click();

  await expect(page.getByText("Status: voting")).toBeVisible({ timeout: 15_000 });
  const proposals = page.getByRole("listitem");
  await expect(proposals).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "Ramen and arcade" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rooftop karaoke" })).toBeVisible();
  // The fake n8n's 18:00+08:00, shown in the viewer's Asia/Manila time.
  await expect(proposals.first()).toContainText("Fri 6:00 PM – Fri 8:00 PM");
});

test("organizer retries after n8n could not be reached", async ({ page, request }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Plan a Night" }).click();
  await expect(page.getByText("Status: collecting")).toBeVisible();
  const nightId = page.url().split("/nights/")[1];
  await request.post(`http://localhost:3199/control/fail/${nightId}`);

  await page.getByRole("button", { name: "Generate" }).click();

  await expect(page.getByText("Status: generation_failed")).toBeVisible();
  await expect(page.getByText("We couldn't generate plans for this Night.")).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();

  await expect(page.getByText("Status: voting")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("listitem")).toHaveCount(2);
});
