import assert from "node:assert";
import test, { describe } from "node:test";
import { type Config, jsonSchemaOfConfig } from "./config.js";
import { overwriteDefaultsInJsonSchema, pruneConfig } from "./config_utils.js";

describe("overwriteDefaultsInJsonSchema", () => {
  test("given new default for h_0 should return schema with given default", () => {
    const schema = structuredClone(jsonSchemaOfConfig);
    const defaults: Config = {
      name: "",
      description: "",
      sw_ml: true,
      theta_0: 288,
      h_0: 42, // changed
      dtheta_0: 1,
      q_0: 0.008,
      dq_0: -0.001,
      dt: 60,
      runtime: 43200,
      wtheta: [0.1],
      advtheta: 0,
      gammatheta: 0.006,
      wq: 0.0001,
      advq: 0,
      gammaq: 0,
      divU: 0,
      beta: 0.2,
    };

    const result = overwriteDefaultsInJsonSchema(schema, defaults);

    const expected = structuredClone(jsonSchemaOfConfig);
    // biome-ignore lint/suspicious/noExplicitAny: ajv has expected.allOf typed as any
    const mlif = expected.allOf.find((i: any) => i.if.properties.sw_ml.const);
    mlif.then.properties.h_0.default = 42;

    assert.deepEqual(result, expected);
  });
});

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
      gammatheta: 0.006,
      wq: 0.0001,
      advq: 0,
      gammaq: 0,
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
      gammatheta: 0.006,
      wq: 0.0001,
      advq: 0,
      gammaq: 0,
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
      gammatheta: 0.006,
      wq: 0.0001,
      advq: 0,
      gammaq: 0,
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
