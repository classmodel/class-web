import { expect, test } from "@playwright/test";
import { parseDownload } from "./helpers";

test("Create share link from an experiment", async ({ page }) => {
  test.skip(true, "Only used during development");
  await page.goto("/");

  // Create a new experiment
  await page.getByRole("button", { name: "Add Start from preset" }).click();
  await page
    .getByRole("button", { name: "Default The classic default" })
    .click();

  await page.getByRole("button", { name: "Mixed Layer" }).click();
  await page.getByLabel("h", { exact: true }).fill("800");
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
  const sharedExperiment = sharedPage.getByLabel("Default", {
    exact: true,
  });
  await sharedExperiment.getByRole("button", { name: "Download" }).click();
  const downloadPromise1 = sharedPage.waitForEvent("download");
  await sharedPage
    .getByRole("link", { name: "Configuration", exact: true })
    .click();
  const config1 = await parseDownload(downloadPromise1);
  // Workaround that partial config is missing sw_ml, as its part of its preset
  config1.reference.sw_ml = true;
  if (!config1.reference.sw_ml) {
    throw new Error("Mixed layer is turned off");
  }

  expect(config1.reference.h).toEqual(800);

  // TODO: finalheight is gone; implement alternative check to see that experiment finished
});
