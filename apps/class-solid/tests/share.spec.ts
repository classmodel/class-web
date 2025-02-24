import { expect, test } from "@playwright/test";
import { parseDownload } from "./helpers";

test("Create share link from an experiment", async ({ page }) => {
  await page.goto("/");

  // Create a new experiment
  await page.getByRole("button", { name: "Start from scratch" }).click();
  await page.getByRole("button", { name: "Initial State" }).click();
  await page.getByLabel("ABL height").fill("800");
  await page.getByRole("button", { name: "Run" }).click();

  // Open share dialog
  await page.getByRole("button", { name: "Share" }).click();
  // Open link, in a new popup window
  const sharedPagePromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "this link" }).click();
  const sharedPage = await sharedPagePromise;
  // TODO test copy to clipboard?
  // TODO test get link from text input field?

  // Check that the new experiment has the correct configuration
  const sharedExperiment = sharedPage.getByLabel("My experiment 1", {
    exact: true,
  });
  await sharedExperiment.getByRole("button", { name: "Download" }).click();
  const downloadPromise1 = sharedPage.waitForEvent("download");
  await sharedPage
    .getByRole("link", { name: "Configuration", exact: true })
    .click();
  const config1 = await parseDownload(downloadPromise1);
  if (!config1.reference.sw_ml) {
    throw new Error("Mixed layer is turned off");
  }
  expect(config1.reference.h_0).toEqual(800);

  // TODO: finalheight is gone; implement alternative check to see that experiment finished
});

test("Given large app state, sharing is not possible", async ({ page }) => {
  test.skip(
    true,
    "Plotting is too slow, to render 13 experiments with 24 permuations each",
  );
  await page.goto("/");

  // Create a new experiment
  await page.getByRole("button", { name: "Start from scratch" }).click();
  await page.getByRole("button", { name: "Run" }).click();
  // Add permutation sweep
  await page.getByRole("button", { name: "S", exact: true }).click();
  await page.getByRole("button", { name: "Perform sweep" }).click();

  // Duplicate the experiment 12 times
  const times = 12;
  for (let i = 0; i < times; i++) {
    await page
      .getByLabel("My experiment 1", { exact: true })
      .getByRole("button", { name: "Duplicate experiment" })
      .click();
  }

  await page.getByRole("button", { name: "Share" }).click();
  await page.waitForSelector(
    "text=Cannot share application state, it is too large. Please download each experiment by itself or make it smaller by removing permutations and/or experiments.",
  );
});
