import { expect, test } from "@playwright/test";

test("has welcome", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Welcome to CLASS" }),
  ).toBeVisible();
});
