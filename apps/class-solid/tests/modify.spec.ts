import { expect, test } from "@playwright/test";

// Check that modifying an experiment preserves previous edits
test("Edit experiment preserves previous edits", async ({ page }) => {
  await page.goto("/");

  // Create new experiment with custom h
  await page.getByRole("button", { name: "Add Start from scratch" }).click();
  await page.getByLabel("Mixed layer").click();
  await page.getByLabel("h", { exact: true }).fill("800");
  await page.getByRole("button", { name: "Run" }).click();

  // Edit a second field
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Time control" }).click();
  await page.getByLabel("Time step").fill("30");
  await page.getByRole("button", { name: "Run" }).click();

  // Open editor again and check that both values are still updated
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Mixed layer").click();
  await expect(
    page
      .getByLabel("ExperimentPreset: Default")
      .getByLabel("h", { exact: true }),
  ).toHaveValue("800");
  await page.getByRole("button", { name: "Time control" }).click();
  await expect(page.getByLabel("Time step")).toHaveValue("30");
});

test("Edit permutation preserves previous edits", async ({ page }) => {
  // Add experiment
  await page.goto("/");
  await page.getByRole("button", { name: "Add Start from scratch (" }).click();
  await page.getByRole("button", { name: "Run" }).click();

  // Add permutation with very small initial temperature jump
  // Expect boundary layer to grow very quickly
  const experiment1 = page.getByLabel("My experiment 1", { exact: true });
  await experiment1
    .getByTitle(
      "Add a permutation to the reference configuration of this experiment",
    )
    .click();
  await page.getByLabel("Mixed layer").click();
  await page.getByLabel("Δθ").fill("0.1");
  await page.getByRole("button", { name: "Run" }).click();
  // TODO: this gives weird looking results, fix + add check; how to test??

  // Modify permutation: perhaps time step is too small?
  await page.getByRole("button", { name: "Edit permutation" }).click();
  await page.getByRole("button", { name: "Time control" }).click();
  await page.getByLabel("Time step").fill("120");
  await page.getByRole("button", { name: "Run" }).click();
  // TODO: this gives NaN values, fix and add check

  // Set time step back to a more reasonable value
  await page.getByRole("button", { name: "Edit permutation" }).click();
  await page.getByRole("button", { name: "Time control" }).click();
  await page.getByLabel("Time step").fill("1");
  await page.getByRole("button", { name: "Run" }).click();

  // Verify both initial jump and time step are still modified
  await page
    .getByRole("button", { name: "View differences between this" })
    .click();
  await expect(page.getByTitle("PermutationConfig")).toHaveText(
    `{
  "dtheta_0": 0.1,
  "dt": 1
}`,
  );
});
