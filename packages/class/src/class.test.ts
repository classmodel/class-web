import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { CLASS } from "./class.js";
import { runClass } from "./runner.js";
import { parse } from "./validate.js";

describe("CLASS model", () => {
  test("can be instantiated with default config", () => {
    const config = parse({});
    const model = new CLASS(config);
    assert.ok(model instanceof CLASS);
    assert.strictEqual(model.t, 0);
    if (!model._cfg.sw_ml) {
      throw new Error("sw_ml not set");
    }
    assert.strictEqual(model._cfg.h_0, 200);
    assert.strictEqual(model._cfg.dt, 60);
    assert.deepEqual(model._cfg.wtheta, [0.1]);
    assert.strictEqual(model._cfg.wq, 0.0001);
  });

  test("calling update advances the model time", () => {
    const config = parse({});
    const model = new CLASS(config);
    model.update();
    assert.strictEqual(model.t, 60);
  });

  test("can update until the final time step", () => {
    const config = parse({});
    const model = new CLASS(config);
    while (model.t < config.runtime) {
      model.update();
    }
    assert.strictEqual(model.t, 12 * 3600);
  });

  test("produces realistic results", () => {
    const config = parse({});
    const output = runClass(config);
    assert.ok(output);
  });
});
