import { expect, test } from "@playwright/test";
import { parseDownload } from "./helpers";

test("Create share link from an experiment", async ({ page }) => {
  await page.goto("/");

  // Create a new experiment
  await page.getByTitle("Add experiment").click();
  await page.getByRole("menuitem", { name: "From scratch" }).click();
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
  expect(config1.reference.initialState?.h_0).toEqual(800);

  // Check that shared experiment has been run by
  // checking height in final height analysis
  const finalHeightAnalysis = sharedPage.getByRole("article", {
    name: "Final height",
  });
  const finalHeightOfExperiment = finalHeightAnalysis.getByRole("listitem", {
    name: "My experiment 1",
    exact: true,
  });
  expect(await finalHeightOfExperiment.textContent()).toMatch(
    /My experiment 1: \d+ m/,
  );
});

test("Given large app state, sharing is not possible", async ({ page }) => {
  test.skip(
    true,
    "Plotting is too slow, to render 13 experiments with 24 permuations each",
  );
  await page.goto("/");

  // Create a new experiment
  await page.getByTitle("Add experiment").click();
  await page.getByRole("menuitem", { name: "From scratch" }).click();
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
