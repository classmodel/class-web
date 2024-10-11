import { type Download, expect, test } from "@playwright/test";

import type { ExperimentConfigSchema } from "@classmodel/class/validate";

async function parseDownload(
  downloadPromise: Promise<Download>,
): Promise<ExperimentConfigSchema> {
  const download = await downloadPromise;
  const readStream = await download.createReadStream();
  const body = await new Promise<string>((resolve, reject) => {
    const chunks: string[] = [];
    readStream.on("data", (chunk) => chunks.push(chunk));
    readStream.on("end", () => resolve(chunks.join("")));
    readStream.on("error", reject);
  });
  return JSON.parse(body) as ExperimentConfigSchema;
}

test("Duplicate experiment with a permutation", async ({ page }, testInfo) => {
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

  // Duplicate experiment
  await page.getByTitle("Duplicate experiment").click();

  // Make experiment 2 different
  const experiment2 = page.getByLabel("Copy of My experiment 1", {
    exact: true,
  });
  await experiment2.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("button", { name: "Mixed layer Button" }).click();
  await page.getByLabel("Entrainment ratio for virtual heat [-]").fill("0.3");
  await page.getByRole("button", { name: "Run" }).click();

  // Download configuration of experiment 1
  experiment1.getByRole("button", { name: "Download" }).click();
  const downloadPromise1 = page.waitForEvent("download");
  await page.getByRole("link", { name: "Configuration" }).click();
  const config1 = await parseDownload(downloadPromise1);
  expect(config1.reference.initialState?.h_0).toEqual(200);
  expect(config1.reference.mixedLayer?.beta).toEqual(0.2);
  expect(config1.permutations[0].config.initialState?.h_0).toEqual(800);
  expect(config1.permutations[0].config.mixedLayer?.beta).toEqual(0.2);

  // Download configuration of experiment 2
  experiment2.getByRole("button", { name: "Download" }).click();
  const downloadPromise2 = page.waitForEvent("download");
  await page.getByRole("link", { name: "Configuration" }).click();
  const config2 = await parseDownload(downloadPromise2);
  expect(config2.reference.initialState?.h_0).toEqual(200);
  expect(config2.reference.mixedLayer?.beta).toEqual(0.3);
  expect(config2.permutations[0].config.initialState?.h_0).toEqual(800);
  expect(config2.permutations[0].config.mixedLayer?.beta).toEqual(0.3);

  // visually check that timeseries plot has 4 non-overlapping lines
  await testInfo.attach("timeseries plot with 4 non-overlapping lines", {
    body: await page.locator("canvas").screenshot(),
    contentType: "image/png",
  });
});

test("Swap permutation with default reference", async ({ page }) => {
  await page.goto("/");

  // Create a new experiment
  await page.getByTitle("Add experiment").click();
  await page.getByRole("menuitem", { name: "From scratch" }).click();
  await page.getByRole("button", { name: "Run" }).click();

  // Add a permutation
  const experiment = page.getByLabel("My experiment 1", { exact: true });
  await experiment
    .getByTitle(
      "Add a permutation to the reference configuration of this experiment",
    )
    .click();
  await page.getByRole("button", { name: "Initial State" }).click();
  await page.getByLabel("ABL height [m]").fill("800");
  await page.getByRole("button", { name: "Run" }).click();

  await page.getByRole("button", { name: "Other actions" }).click();
  await page.getByRole("menuitem", { name: "Swap permutation with" }).click();

  experiment.getByRole("button", { name: "Download" }).click();
  const downloadPromise1 = page.waitForEvent("download");
  await page.getByRole("link", { name: "Configuration" }).click();
  const config1 = await parseDownload(downloadPromise1);
  expect(config1.reference.initialState?.h_0).toEqual(800);
  expect(config1.permutations[0].config.initialState?.h_0).toEqual(200);
});

test("Promote permutation to a new experiment", async ({ page }) => {
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
  await page.getByLabel("Title").fill("perm1");
  await page.getByLabel("ABL height [m]").fill("800");
  await page.getByRole("button", { name: "Run" }).click();

  await page.getByRole("button", { name: "Other actions" }).click();
  await page
    .getByRole("menuitem", { name: "Promote permutation to a new" })
    .click();

  const experiment2 = await page.getByLabel("perm1");
  experiment2.getByRole("button", { name: "Download" }).click();
  const downloadPromise2 = page.waitForEvent("download");
  await page.getByRole("link", { name: "Configuration" }).click();
  const config2 = await parseDownload(downloadPromise2);
  expect(config2.reference.initialState?.h_0).toEqual(800);
  expect(config2.permutations.length).toEqual(0);
});

test("Duplicate permutation", async ({ page }) => {
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
  await page.getByRole("button", { name: "Other actions" }).click();
  await page.getByRole("menuitem", { name: "Duplicate permutation" }).click();

  await page.pause();

  // Edit the duplicated permutation
  const perm2 = page.getByLabel("Copy of 1", { exact: true });
  await perm2.getByRole("button", { name: "Edit permutation" }).click();
  await page.getByRole("button", { name: "Initial State" }).click();
  await page.getByLabel("ABL height [m]").fill("400");
  await page.getByRole("button", { name: "Run" }).click();

  experiment1.getByRole("button", { name: "Download" }).click();
  const downloadPromise1 = page.waitForEvent("download");
  await page.getByRole("link", { name: "Configuration" }).click();
  const config1 = await parseDownload(downloadPromise1);
  expect(config1.reference.initialState?.h_0).toEqual(200);
  expect(config1.permutations.length).toEqual(2);
  expect(config1.permutations[0].config.initialState?.h_0).toEqual(800);
  expect(config1.permutations[1].config.initialState?.h_0).toEqual(400);
});
