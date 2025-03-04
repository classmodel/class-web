import assert from "node:assert";
import { describe, test } from "node:test";
import type { JSONSchemaType } from "ajv/dist/2020";
import { type Item, overwriteDefaultsInJsonSchema, schema2tree } from "./utils";

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

describe("schema2tree", () => {
  test("group with bool and enum ifthen blocks", () => {
    const schema = {
      type: "object",
      properties: {
        s1: { type: "string", default: "string1" }, // no group + no if condition
        b1: { type: "boolean", default: false, "ui:group": "g1" }, // group + boolean if condition
        e1: {
          type: "string",
          enum: ["a", "b"],
          default: "a",
          "ui:group": "g1",
        }, // group + enum if condition
        s5: { type: "string", default: "string5", "ui:group": "g1" }, // group + no if condition
        s6: { type: "string", default: "string6", "ui:group": "g2" }, // other group + no if condition
      },
      required: ["s1", "b1", "e1"],
      allOf: [
        {
          if: {
            properties: {
              b1: { const: true },
            },
          },
          // biome-ignore lint/suspicious/noThenProperty: <explanation>
          then: {
            properties: {
              s2: { type: "string", default: "string2", "ui:group": "g1" },
            },
            required: ["s2"],
          },
        },
        {
          if: {
            properties: {
              e1: { const: "a" },
            },
          },
          // biome-ignore lint/suspicious/noThenProperty: <explanation>
          then: {
            properties: {
              s3: { type: "string", default: "string3", "ui:group": "g1" },
            },
            required: ["s3"],
          },
        },
        {
          if: {
            properties: {
              e1: { const: "b" },
            },
          },
          // biome-ignore lint/suspicious/noThenProperty: <explanation>
          then: {
            properties: {
              s4: { type: "string", default: "string4", "ui:group": "g1" },
            },
            required: ["s4"],
          },
        },
      ],
    } as unknown as JSONSchemaType<unknown>;

    const tree = schema2tree(schema);

    const expected: Item[] = [
      {
        key: "s1",
        schema: {
          type: "string",
          default: "string1",
        },
      },
      {
        group: "g1",
        members: [
          {
            key: "b1",
            schema: {
              type: "boolean",
              default: false,
              "ui:group": "g1",
            },
            choices: [
              {
                value: true,
                members: [
                  {
                    key: "s2",
                    schema: {
                      type: "string",
                      default: "string2",
                      "ui:group": "g1",
                    },
                  },
                ],
              },
            ],
          },
          {
            key: "e1",
            schema: {
              type: "string",
              enum: ["a", "b"],
              default: "a",
              "ui:group": "g1",
            },
            choices: [
              {
                value: "a",
                members: [
                  {
                    key: "s3",
                    schema: {
                      type: "string",
                      default: "string3",
                      "ui:group": "g1",
                    },
                  },
                ],
              },
              {
                value: "b",
                members: [
                  {
                    key: "s4",
                    schema: {
                      type: "string",
                      default: "string4",
                      "ui:group": "g1",
                    },
                  },
                ],
              },
            ],
          },
          {
            key: "s5",
            schema: {
              type: "string",
              default: "string5",
              "ui:group": "g1",
            },
          },
        ],
      },
      {
        group: "g2",
        members: [
          {
            key: "s6",
            schema: {
              type: "string",
              default: "string6",
              "ui:group": "g2",
            },
          },
        ],
      },
    ];

    assert.deepEqual(tree, expected);
  });

  test("prop with if condition and no group", () => {
    const schema = {
      type: "object",
      properties: {
        b1: { type: "boolean", default: false }, // no group + boolean if condition
      },
      required: ["b1"],
      allOf: [
        {
          if: {
            properties: {
              b1: { const: true },
            },
          },
          // biome-ignore lint/suspicious/noThenProperty: <explanation>
          then: {
            properties: {
              s1: { type: "string", default: "string1" },
            },
            required: ["s1"],
          },
        },
      ],
    } as unknown as JSONSchemaType<unknown>;

    const tree = schema2tree(schema);

    const expected = [
      {
        key: "b1",
        schema: {
          type: "boolean",
          default: false,
        },
        choices: [
          {
            value: true,
            members: [
              {
                key: "s1",
                schema: {
                  type: "string",
                  default: "string1",
                },
              },
            ],
          },
        ],
      },
    ];
    assert.deepEqual(tree, expected);
  });
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
