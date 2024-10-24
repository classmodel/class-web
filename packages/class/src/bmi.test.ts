import assert from "node:assert/strict";
import { before, describe, test } from "node:test";
import { BmiClass } from "./bmi.js";

describe("BmiClass", () => {
  let bmi: BmiClass;
  before(() => {
    bmi = new BmiClass();
  });

  describe("get_component_name", () => {
    test("returns the component name", () => {
      assert.strictEqual(
        bmi.get_component_name(),
        "Chemistry Land-surface Atmosphere Soil Slab model",
      );
    });
  });
});
