import assert, { deepEqual } from "node:assert";
import { describe, test } from "node:test";
import { defaults, schema as jsonSchemaOfConfig } from "./App";
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

    const result = overwriteDefaultsInJsonSchema(schema, defaults);

    const expected = structuredClone(jsonSchemaOfConfig);
    // biome-ignore lint/suspicious/noExplicitAny: ajv has expected.allOf typed as any
    const mlif = expected.allOf.find((i: any) => i.if.properties.sw_ml.const);
    mlif.then.properties.h_0.default = 42;

    assert.deepEqual(result, expected);
  });
});
