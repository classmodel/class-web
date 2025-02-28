import assert, { deepEqual } from "node:assert";
import { describe, test } from "node:test";
import { type Config, jsonSchemaOfConfig } from "@classmodel/class/config";
import {
  type Toggle,
  overwriteDefaultsInJsonSchema,
  schema2groups,
} from "./utils";

test("schema2groups()", () => {
  const result = schema2groups(jsonSchemaOfConfig);
  const expected = {
    groupless: ["name", "description"],
    untoggelable: new Map([["Time Control", ["dt", "runtime"]]]),
    toggleable: new Map<string, Toggle>([
      [
        "sw_ml",
        {
          key: "sw_ml",
          value: true,
          members: jsonSchemaOfConfig.allOf[0].then.properties,
        },
      ],
    ]),
  };
  deepEqual(result, expected);
});

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
