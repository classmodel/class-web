import { expect, test } from "@playwright/test";
import { parseDownload } from "./helpers";

test("Duplicate experiment with a permutation", async ({ page }, testInfo) => {
  await page.goto("/");

  // Create a new experiment
  await page.getByRole("button", { name: "Start from scratch" }).click();
  await page.getByRole("button", { name: "Run" }).click();

  // Add a permutation
  const experiment1 = page.getByLabel("My experiment 1", { exact: true });
  await experiment1
    .getByTitle(
      "Add a permutation to the reference configuration of this experiment",
    )
    .click();
  await page.getByLabel("Mixed layer").click();
  await page.getByLabel("ABL height").fill("800");
  await page.getByRole("button", { name: "Run" }).click();

  // Duplicate experiment
  await page.getByTitle("Duplicate experiment").click();

  // Make experiment 2 different
  const experiment2 = page.getByLabel("Copy of My experiment 1", {
    exact: true,
  });
  await experiment2.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Mixed layer").click();
  await page.getByLabel("β").fill("0.3");
  await page.getByRole("button", { name: "Run" }).click();

  // Download configuration of experiment 1
  experiment1.getByRole("button", { name: "Download" }).click();
  const downloadPromise1 = page.waitForEvent("download");
  await page.getByRole("link", { name: "Configuration", exact: true }).click();
  const config1 = await parseDownload(downloadPromise1);
  // Workaround that partial config is missing sw_ml, as its part of its preset
  config1.permutations[0].sw_ml = true;
  if (!config1.permutations[0].sw_ml) {
    throw new Error("sw_ml is not defined");
  }
  expect(config1.permutations[0].h_0).toEqual(800);

  // Download configuration of experiment 2
  experiment2.getByRole("button", { name: "Download" }).click();
  const downloadPromise2 = page.waitForEvent("download");
  await page.getByRole("link", { name: "Configuration", exact: true }).click();
  const config2 = await parseDownload(downloadPromise2);
  // Workaround that partial config is missing sw_ml, as its part of its preset
  config2.reference.sw_ml = true;
  config2.permutations[0].sw_ml = true;
  if (!config2.reference.sw_ml || !config2.permutations[0].sw_ml) {
    throw new Error("sw_ml is not defined");
  }
  expect(config2.reference.beta).toEqual(0.3);
  expect(config2.permutations[0].h_0).toEqual(800);

  // visually check that timeseries plot has 4 non-overlapping lines
  await testInfo.attach("timeseries plot with 4 non-overlapping lines", {
    body: await page
      .getByRole("article", { name: "Timeseries" })
      .locator("figure")
      .screenshot(),
    contentType: "image/png",
  });
});

test("Swap permutation with default reference", async ({ page }) => {
  await page.goto("/");

  // Create a new experiment
  await page.getByRole("button", { name: "Start from scratch" }).click();
  await page.getByRole("button", { name: "Run" }).click();

  // Add a permutation
  const experiment = page.getByLabel("My experiment 1", { exact: true });
  await experiment
    .getByTitle(
      "Add a permutation to the reference configuration of this experiment",
    )
    .click();
  await page.getByLabel("Mixed layer").click();
  await page.getByLabel("ABL height").fill("800");
  await page.getByRole("button", { name: "Run" }).click();

  // Do action
  await page.getByRole("button", { name: "Other actions" }).click();
  await page.getByRole("menuitem", { name: "Swap permutation with" }).click();

  // Assert
  const renamedExperiment = page.getByLabel("1", { exact: true });
  renamedExperiment.getByRole("button", { name: "Download" }).click();
  const downloadPromise1 = page.waitForEvent("download");
  await page.getByRole("link", { name: "Configuration", exact: true }).click();
  const config1 = await parseDownload(downloadPromise1);
  // Workaround that partial config is missing sw_ml, as its part of its preset
  config1.reference.sw_ml = true;
  if (!config1.reference.sw_ml) {
    throw new Error("Mixed layer is turned off");
  }
  expect(config1.reference.h_0).toEqual(800);
});

test("Swap permutation with custom reference", async ({ page }) => {
  await page.goto("/");

  // Create a new experiment
  await page.getByRole("button", { name: "Start from scratch" }).click();
  await page.getByLabel("Mixed layer").click();
  await page.getByLabel("ABL height").fill("400");
  await page.getByLabel("Potential temperature", { exact: true }).fill("265");
  await page.getByRole("button", { name: "Run" }).click();

  // Add a permutation
  const experiment = page.getByLabel("My experiment 1", { exact: true });
  await experiment
    .getByTitle(
      "Add a permutation to the reference configuration of this experiment",
    )
    .click();
  await page.getByLabel("Mixed layer").click();
  await page.getByLabel("ABL height").fill("800");
  await page.getByLabel("Temperature jump at h").fill("0.8");
  await page.getByRole("button", { name: "Run" }).click();

  // Do action
  await page.getByRole("button", { name: "Other actions" }).click();
  await page.getByRole("menuitem", { name: "Swap permutation with" }).click();

  // Assert that parameters are swapped and default values are not overwritten.
  const renamedExperiment = page.getByLabel("1", { exact: true });
  renamedExperiment.getByRole("button", { name: "Download" }).click();
  const downloadPromise1 = page.waitForEvent("download");
  await page.getByRole("link", { name: "Configuration", exact: true }).click();
  const config1 = await parseDownload(downloadPromise1);
  // Workaround that partial config is missing sw_ml, as its part of its preset
  config1.reference.sw_ml = true;
  config1.permutations[0].sw_ml = true;
  if (!config1.reference.sw_ml || !config1.permutations[0].sw_ml) {
    throw new Error("sw_ml is not defined");
  }

  expect(config1.reference.h_0).toEqual(800);
  expect(config1.reference.dtheta_0).toEqual(0.8);
  expect(config1.permutations[0].h_0).toEqual(400);
});

test("Promote permutation to a new experiment", async ({ page }) => {
  await page.goto("/");

  // Create a new experiment
  await page.getByRole("button", { name: "Start from scratch" }).click();
  await page.getByRole("button", { name: "Run" }).click();

  // Add a permutation
  const experiment1 = page.getByLabel("My experiment 1", { exact: true });
  await experiment1
    .getByTitle(
      "Add a permutation to the reference configuration of this experiment",
    )
    .click();
  await page.getByLabel("Mixed layer").click();
  await page.getByLabel("Name").fill("perm1");
  await page.getByLabel("ABL height").fill("800");
  await page.getByRole("button", { name: "Run" }).click();

  await page.getByRole("button", { name: "Other actions" }).click();
  await page
    .getByRole("menuitem", { name: "Promote permutation to a new" })
    .click();

  // Check that the new experiment has the correct configuration
  const experiment2 = await page.getByLabel("perm1");
  experiment2.getByRole("button", { name: "Download" }).click();
  const downloadPromise2 = page.waitForEvent("download");
  await page.getByRole("link", { name: "Configuration", exact: true }).click();
  const config2 = await parseDownload(downloadPromise2);
  // Workaround that partial config is missing sw_ml, as its part of its preset
  config2.reference.sw_ml = true;
  if (!config2.reference.sw_ml) {
    throw new Error("sw_ml is not defined");
  }
  expect(config2.reference.h_0).toEqual(800);
  expect(config2.permutations.length).toEqual(0);
});

test("Duplicate permutation", async ({ page }) => {
  await page.goto("/");

  // Create a new experiment
  await page.getByRole("button", { name: "Start from scratch" }).click();
  await page.getByRole("button", { name: "Run" }).click();

  // Add a permutation
  const experiment1 = page.getByLabel("My experiment 1", { exact: true });
  await experiment1
    .getByTitle(
      "Add a permutation to the reference configuration of this experiment",
    )
    .click();
  await page.getByLabel("Mixed layer").click();
  await page.getByLabel("ABL height").fill("800");
  await page.getByRole("button", { name: "Run" }).click();
  await page.getByRole("button", { name: "Other actions" }).click();
  await page.getByRole("menuitem", { name: "Duplicate permutation" }).click();

  // Edit the duplicated permutation
  const perm2 = page.getByLabel("Copy of 1", { exact: true });
  await perm2.getByRole("button", { name: "Edit permutation" }).click();
  await page.getByLabel("Mixed layer").click();
  await page.getByLabel("ABL height").fill("400");
  await page.getByRole("button", { name: "Run" }).click();

  // Check that configurations are correct
  experiment1.getByRole("button", { name: "Download" }).click();
  const downloadPromise1 = page.waitForEvent("download");
  await page.getByRole("link", { name: "Configuration", exact: true }).click();
  const config1 = await parseDownload(downloadPromise1);
  expect(config1.permutations.length).toEqual(2);

  // Workaround that partial config is missing sw_ml, as its part of its preset
  config1.permutations[0].sw_ml = true;
  config1.permutations[1].sw_ml = true;
  if (!config1.permutations[0].sw_ml || !config1.permutations[1].sw_ml) {
    throw new Error("sw_ml is not defined");
  }
  expect(config1.permutations[0].h_0).toEqual(800);
  expect(config1.permutations[1].h_0).toEqual(400);
});
