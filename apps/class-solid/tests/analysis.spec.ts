import { test } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("/");

  // Create a new experiment
  await page.getByTitle("Add experiment").click();
  await page.getByRole("menuitem", { name: "From scratch" }).click();
  await page.getByRole("button", { name: "Run" }).click();

  // Add a permutation
  const experiment1 = page.getByLabel("My experiment 1", { exact: true });
  await experiment1
    .getByTitle(
      "Add a permutation to the reference configuration of this experiment",
    )
    .click();
  await page.getByRole("button", { name: "Initial State" }).click();
  await page.getByLabel("ABL height [m]").fill("800");
  await page.getByRole("button", { name: "Run" }).click();

  // Add timeseries analysis
  await page.getByTitle("Add analysis").click();
  await page.getByRole("menuitem", { name: "Timeseries" }).click();

  await page.getByTitle("Duplicate experiment").click();

  await page.pause();

  // Make experiment 2 different
  const experiment2 = page.getByLabel("My experiment 2", { exact: true });
  // TODO open permutation dialog
  await page.getByRole("button", { name: "Mixed layer Button" }).click();
  await page.getByLabel("Entrainment ratio for virtual heat [-]").fill("0.3");

  // TOOD assert 4 lines in plot
});
