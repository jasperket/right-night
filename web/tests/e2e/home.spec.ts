import { expect, test } from "@playwright/test";

test("home page introduces Right Night", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Right Night/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Right Night" }),
  ).toBeVisible();
  await expect(page.getByText("Find the right night, together.")).toBeVisible();
});
