import type { JSONSchemaType } from "ajv/dist/2020.js";

// TODO generate this from ./config.schema.json
// at the momemt json-schema-to-typescript does not understand if/then/else
// and cannot generate such minimalistic types
export type Config = {
  name: string;
  description?: string;
  dt: number;
  runtime: number;
} & ( // Mixed layer
  | {
      sw_ml: true;
      h_0: number;
      theta_0: number;
      dtheta_0: number;
      q_0: number;
      dq_0: number;
      wtheta: number[];
      advtheta: number;
      gammatheta: number;
      wq: number;
      advq: number;
      gammaq: number;
      divU: number;
      beta: number;
    }
  // Else, sw_ml key should be absent or false
  | { sw_ml?: false }
);

/*
Notes for JSON schema
put here because JSON does not support comments

- ajv and rjsf do not like `"additionalProperties": false,`
- defaults should be moved to own file with Config type
    - for placeholders and download/upload/merge/prune the default.json preset and config.schema.json should be combined
- allow ui:group to be more then one level. For example ["Mixed Layer", "Top variables"]

TODO move notes to documentation/issues
*/

export type JsonSchemaOfConfig = JSONSchemaType<Config>;

// TODO unable to use import with assert in app, so made copy of ./config.json here
const untypedSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  properties: {
    name: {
      type: "string",
      title: "Name",
      default: "",
    },
    description: {
      type: "string",
      title: "Description",
      default: "",
      "ui:widget": "textarea",
    },
    dt: {
      type: "integer",
      unit: "s",
      minimum: 1,
      default: 60,
      title: "Time step",
      "ui:group": "Time Control",
    },
    runtime: {
      type: "integer",
      unit: "s",
      minimum: 1,
      title: "Total run time",
      default: 43200,
      "ui:group": "Time Control",
    },
    sw_ml: {
      type: "boolean",
      "ui:group": "Mixed layer",
      title: "Mixed-layer switch",
      default: true,
    },
  },
  required: ["name", "dt", "runtime"],
  allOf: [
    {
      if: {
        properties: {
          sw_ml: {
            const: true,
          },
        },
      },
      // biome-ignore lint/suspicious/noThenProperty: part of JSON Schema
      then: {
        properties: {
          h_0: {
            "symbol": "h",
            type: "number",
            title: "ABL height",
            unit: "m",
            default: 200,
            "ui:group": "Mixed layer",
          },
          theta_0: {
            symbol: "θ",
            type: "number",
            "ui:group": "Mixed layer",
            title: "Potential temperature",
            // TODO For some reason ajv ignores minimum=0, for now raised to 1
            minimum: 1,
            default: 288,
            description:
              "The potential temperature of the mixed layer at the initial time.",
            unit: "K",
          },
          dtheta_0: {
            symbol: "Δθ",
            type: "number",
            title: "Temperature jump at h",
            "ui:group": "Mixed layer",
            default: 1,
            unit: "K",
          },
          q_0: {
            symbol: "q",
            type: "number",
            "ui:group": "Mixed layer",
            unit: "kg kg-1",
            default: 0.008,
            title: "Mixed-layer specific humidity",
          },
          dq_0: {
            symbol: "Δq",
            type: "number",
            description: "Specific humidity jump at h",
            unit: "kg kg-1",
            default: -0.001,
            "ui:group": "Mixed layer",
          },
          wtheta: {
            symbol: "(w'θ')ₛ",
            type: "array",
            items: {
              type: "number",
            },
            "ui:group": "Mixed layer",
            unit: "K m s-1",
            title: "Surface kinematic heat flux",
            default: [0.1],
            minItems: 1,
          },
          advtheta: {
            symbol: "adv(θ)",  // _adv not possible in unicode
            type: "number",
            "ui:group": "Mixed layer",
            unit: "K s-1",
            default: 0,
            title: "Advection of heat",
          },
          gammatheta: {
            symbol: "γθ",     // TODO: theta should be subscript, not possible in unicode
            type: "number",
            "ui:group": "Mixed layer",
            unit: "K m-1",
            default: 0.006,
            title: "Free atmosphere potential temperature lapse rate",
          },
          wq: {
            symbol: "(w'q')ₛ",
            type: "number",
            "ui:group": "Mixed layer",
            unit: "kg kg-1 m s-1",
            default: 0.0001,
            title: "Surface kinematic moisture flux",
          },
          advq: {
            symbol: "adv(q)",  // _adv not possible in unicode
            type: "number",
            "ui:group": "Mixed layer",
            unit: "kg kg-1 s-1",
            default: 0,
            title: "Advection of moisture",
          },
          gammaq: {
            symbol: "γq",     // TODO: q should be subscript, not possible in unicode
            type: "number",
            "ui:group": "Mixed layer",
            unit: "kg kg-1 m-1",
            default: 0,
            title: "Free atmosphere specific humidity lapse rate",
          },
          divU: {
            symbol: "div(Uₕ)",
            type: "number",
            "ui:group": "Mixed layer",
            default: 0,
            unit: "s-1",
            title: "Horizontal large-scale divergence of wind",
          },
          beta: {
            symbol: "β",
            type: "number",
            "ui:group": "Mixed layer",
            default: 0.2,
            title: "Entrainment ratio for virtual heat",
          },
        },
        required: [
          "h_0",
          "theta_0",
          "dtheta_0",
          "q_0",
          "dq_0",
          "wtheta",
          "advtheta",
          "gammatheta",
          "wq",
          "advq",
          "gammaq",
          "divU",
          "beta",
        ],
      },
    },
  ],
};

export const jsonSchemaOfConfig =
  untypedSchema as unknown as JsonSchemaOfConfig;
