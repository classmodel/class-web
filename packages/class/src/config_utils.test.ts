import assert from "node:assert";
import test, { describe } from "node:test";
import { pruneConfig } from "./config_utils.js";

describe("pruneConfig()", () => {
  test("given 3 real configs", () => {
    const preset = {
      name: "Default",
      description: "Default configuration",
      theta_0: 323,
      h_0: 200,
      dtheta_0: 1,
      q_0: 0.008,
      dq_0: -0.001,
      dt: 60,
      runtime: 4320,
      wtheta: 0.1,
      advtheta: 0,
      gamma_theta: 0.006,
      wq: 0.0001,
      advq: 0,
      gamma_qt: 0,
      divU: 0,
      beta: 0.2,
    };
    const reference = {
      name: "Higher and Hotter",
      description: "Higher h_0",
      h_0: 211,
      theta_0: 323,
      dtheta_0: 1,
      q_0: 0.008,
      dq_0: -0.001,
      dt: 60,
      runtime: 4320,
      wtheta: 0.1,
      advtheta: 0,
      gamma_theta: 0.006,
      wq: 0.0001,
      advq: 0,
      gamma_qt: 0,
      divU: 0,
      beta: 0.2,
    };
    const permutation = {
      name: "Higher",
      description: "",
      h_0: 222,
      theta_0: 323,
      dtheta_0: 1,
      q_0: 0.008,
      dq_0: -0.001,
      dt: 60,
      runtime: 4320,
      wtheta: 0.1,
      advtheta: 0,
      gamma_theta: 0.006,
      wq: 0.0001,
      advq: 0,
      gamma_qt: 0,
      divU: 0,
      beta: 0.212,
    };
    const result = pruneConfig(permutation, reference, preset);
    const expected = {
      name: "Higher",
      description: "",
      h_0: 222,
      beta: 0.212,
    };
    assert.deepEqual(result, expected);
  });
});
