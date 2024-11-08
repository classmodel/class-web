import { expect, test } from "@playwright/test";

test("has link to home page", async ({ page }) => {
  await page.goto("/about");

  await expect(
    page.getByRole("link", { name: "classmodel.github.io" }),
  ).toBeVisible();
});

test("has experiments", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Experiments" }),
  ).toBeVisible();
});

test("has analysis", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Analysis" })).toBeVisible();
});
