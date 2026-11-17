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
});
