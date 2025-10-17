import assert from "node:assert";
import test, { describe } from "node:test";
import type { Config } from "./config.js";
import { pruneConfig } from "./config_utils.js";

describe("pruneConfig()", () => {
  test("given 3 real configs", () => {
    const preset: Config = {
      name: "Default",
      description: "Default configuration",
      t0: "2025-09-08T14:30:00Z",
      theta: 323,
      h: 200,
      dtheta: 1,
      qt: 0.008,
      dqt: -0.001,
      dt: 60,
      runtime: 4320,
      wtheta: [0.1],
      advtheta: 0,
      gamma_theta: [0.006],
      wq: [0.0001],
      advq: 0,
      gamma_qt: [0],
      divU: 0,
      beta: 0.2,
      sw_ml: true,
      p0: 101300,
      z_theta: [5000],
      z_qt: [5000],
    };
    const reference: Config = {
      name: "Higher and Hotter",
      description: "Higher h_0",
      t0: "2025-09-08T14:30:00Z",
      h: 211,
      theta: 323,
      dtheta: 1,
      qt: 0.008,
      dqt: -0.001,
      dt: 60,
      runtime: 4320,
      wtheta: [0.1],
      advtheta: 0,
      gamma_theta: [0.006],
      wq: [0.0001],
      advq: 0,
      gamma_qt: [0],
      divU: 0,
      beta: 0.2,
      sw_ml: true,
      p0: 101300,
      z_theta: [5000],
      z_qt: [5000],
    };
    const permutation: Config = {
      name: "Higher",
      description: "",
      t0: "2025-09-08T14:30:00Z",
      h: 222,
      theta: 323,
      dtheta: 1,
      qt: 0.008,
      dqt: -0.001,
      dt: 60,
      runtime: 4320,
      wtheta: [0.1],
      advtheta: 0,
      gamma_theta: [0.006],
      wq: [0.0001],
      advq: 0,
      gamma_qt: [0],
      divU: 0,
      beta: 0.212,
      sw_ml: true,
      p0: 101300,
      z_theta: [5000],
      z_qt: [5000],
    };
    const result = pruneConfig(permutation, reference, preset);
    const expected = {
      name: "Higher",
      description: "",
      h: 222,
      beta: 0.212,
    };
    assert.deepEqual(result, expected);
  });
});
