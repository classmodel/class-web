import type { JSONSchemaType } from "ajv/dist/2020.js";

/*
Notes for JSON schema
put here because JSON does not support comments

- ajv and rjsf do not like `"additionalProperties": false,`
- defaults should be moved to own file with Config type
    - for placeholders and download/upload/merge/prune the default.json preset and config.schema.json should be combined
- allow ui:group to be more then one level. For example ["Mixed Layer", "Top variables"]

TODO move notes to documentation/issues
*/

// Unable to use import with assert in app, so embedded JSON schema here instead
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
          h: {
            symbol: "h",
            type: "number",
            title: "ABL height",
            unit: "m",
            default: 200,
            "ui:group": "Mixed layer",
          },
          theta: {
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
          dtheta: {
            symbol: "Δθ",
            type: "number",
            title: "Temperature jump at h",
            "ui:group": "Mixed layer",
            default: 1,
            unit: "K",
          },
          q: {
            symbol: "q",
            type: "number",
            "ui:group": "Mixed layer",
            unit: "kg kg⁻¹",
            default: 0.008,
            title: "Mixed-layer specific humidity",
          },
          dq: {
            symbol: "Δq",
            type: "number",
            description: "Specific humidity jump at h",
            unit: "kg kg⁻¹",
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
            unit: "K m s⁻¹",
            title: "Surface kinematic heat flux",
            default: [0.1],
            minItems: 1,
          },
          advtheta: {
            symbol: "adv(θ)", // _adv not possible in unicode
            type: "number",
            "ui:group": "Mixed layer",
            unit: "K s⁻¹",
            default: 0,
            title: "Advection of heat",
          },
          gammatheta: {
            symbol: "γ<sub>θ</sub>",
            type: "number",
            "ui:group": "Mixed layer",
            unit: "K m⁻¹",
            default: 0.006,
            title: "Free atmosphere potential temperature lapse rate",
          },
          wq: {
            symbol: "(w'q')ₛ",
            type: "array",
            items: {
              type: "number",
            },
            "ui:group": "Mixed layer",
            unit: "kg kg⁻¹ m s⁻¹",
            default: [0.0001],
            minItems: 1,
            title: "Surface kinematic moisture flux",
          },
          advq: {
            symbol: "adv(q)", // _adv not possible in unicode
            type: "number",
            "ui:group": "Mixed layer",
            unit: "kg kg⁻¹ s⁻¹",
            default: 0,
            title: "Advection of moisture",
          },
          gammaq: {
            symbol: "γ<sub>q</sub>",
            type: "number",
            "ui:group": "Mixed layer",
            unit: "kg kg⁻¹ m⁻¹",
            default: 0,
            title: "Free atmosphere specific humidity lapse rate",
          },
          divU: {
            symbol: "div(Uₕ)",
            type: "number",
            "ui:group": "Mixed layer",
            default: 0,
            unit: "s⁻¹",
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
          "h",
          "theta",
          "dtheta",
          "q",
          "dq",
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
      h: number;
      theta: number;
      dtheta: number;
      q: number;
      dq: number;
      wtheta: number[];
      advtheta: number;
      gammatheta: number;
      wq: number[];
      advq: number;
      gammaq: number;
      divU: number;
      beta: number;
    }
  // Else, sw_ml key should be absent or false
  | { sw_ml?: false }
);

export type JsonSchemaOfConfig = JSONSchemaType<Config>;
export const jsonSchemaOfConfig =
  untypedSchema as unknown as JsonSchemaOfConfig;
