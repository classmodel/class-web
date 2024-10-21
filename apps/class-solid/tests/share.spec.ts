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
  const origExperiment = page.getByLabel("My experiment 1", { exact: true });
  await origExperiment
    .getByRole("button", { name: "Share experiment" })
    .click();
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
  // adding Final Height analysis and checking height is non-zero
  await sharedPage.getByRole("button", { name: "Add analysis" }).click();
  await sharedPage.getByRole("menuitem", { name: "Final height" }).click();
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
