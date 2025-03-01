import assert, { deepEqual } from "node:assert";
import { describe, test } from "node:test";
import type { JSONSchemaType } from "ajv/dist/2020";
import {
  type Toggle,
  overwriteDefaultsInJsonSchema,
  schema2groups,
} from "./utils";

type Config = {
  s1: string;
  so1?: string;
  i1: number;
  n1: number;
  nn1: number[];
} & ({ sw_ml: true; h_0: number } | { sw_ml?: false });

const defaults: Config = {
  s1: "string2",
  i1: 60,
  n1: 4.2,
  nn1: [1, 2, 3],
  sw_ml: true,
  h_0: 1.2,
};

const jsonSchemaOfConfig = {
  type: "object",
  properties: {
    s1: { type: "string", default: "string1" },
    so1: { type: "string" },
    i1: { type: "integer", minimum: 10 },
    n1: { type: "number", "ui:group": "g1" },
    nn1: { type: "array", items: { type: "number" } },
    sw_ml: { type: "boolean", "ui:group": "g2" },
  },
  required: ["s1", "i1", "n1", "nn1"],
  allOf: [
    {
      if: {
        properties: {
          sw_ml: {
            const: true,
          },
        },
      },
      // biome-ignore lint/suspicious/noThenProperty: <explanation>
      then: {
        properties: {
          h_0: {
            type: "number",
            "ui:group": "g2",
          },
        },
        required: ["h_0"],
      },
    },
  ],
} as unknown as JSONSchemaType<Config>;

test("schema2groups()", () => {
  const result = schema2groups(jsonSchemaOfConfig);
  const expected = {
    groupless: ["s1", "so1", "i1", "nn1"],
    untoggelable: new Map([["g1", ["n1"]]]),
    toggleable: new Map<string, Toggle>([
      [
        "g2",
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
  test("given new default for s1 should return schema with given default", () => {
    const schema = structuredClone(jsonSchemaOfConfig);

    const result = overwriteDefaultsInJsonSchema(schema, defaults);

    const expected = structuredClone(jsonSchemaOfConfig);
    expected.properties.s1.default = "string2";

    assert.deepEqual(result, expected);
  });
});
