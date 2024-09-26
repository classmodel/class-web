import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { CLASS } from "./class";
import { runClass } from "./runner";
import { parse } from "./validate";

describe("CLASS model", () => {
  test("can be instantiated with default config", () => {
    const config = parse({});
    const model = new CLASS(config);
    assert.ok(model instanceof CLASS);
    assert.strictEqual(model.t, 0);
    assert.strictEqual(model._cfg.initialState.h_0, 200);
    assert.strictEqual(model._cfg.timeControl.dt, 60);
    assert.strictEqual(model._cfg.mixedLayer.wtheta, 0.1);
    assert.strictEqual(model._cfg.mixedLayer.wq, 0.0001);
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
    while (model.t < config.timeControl.runtime) {
      model.update();
    }
    assert.strictEqual(model.t, 12 * 3600);
  });

  test("produces realistic results", () => {
    const config = parse({});
    const output = runClass(config);
    console.log(output);
    assert.ok(output);
  });
});
