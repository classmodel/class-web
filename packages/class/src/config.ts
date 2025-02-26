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
// &
//   // Radiation mode
//   (
//     | { radiationMode: "constant"; cq: number }
//     | { radiationMode: "dynamic"; albedo: number }
//     | { radiationMode?: "" }
//   );

// Example configs
// TODO move to tests
// const cNoRad: Config = {
//   name: "My Config",
//   dt: 60,
//   runtime: 43200,
//   radiationMode: "",
// }

// const cConstRad: Config = {
//   name: "My Config",
//   dt: 60,
//   runtime: 43200,
//   radiationMode: "constant",
//   cq: 0.1,
// }

// const cDynRad: Config = {
//   name: "My Config",
//   dt: 60,
//   runtime: 43200,
//   radiationMode: "dynamic",
//   albedo: 0.3,
// }

/*
Notes for JSON schema
put here because JSON does not support comments

- ajv and rjsf do not like `"additionalProperties": false,`
- radiationMode is just there for Form component to test enum
    - when parsing {} the albedo and cq are unexpectly set to their defaults, they should be absent
- wtheta has has been changed from number to number[],
    - model just uses first element and
    - Form should display a text field with comma seperated numbers
- prefer if/then/else over oneOf as its
    - easier to determine what is the condition
    - else block in JSON schema is not needed
- use flat layout, nesting in Form should be done with ui:group keyword
- defaults should be moved to own file with Config type
    - for placeholders and download/upload/merge/prune the default.json preset and config.schema.json should be combined
- allow ui:group to be more then one level. For example ["Mixed Layer", "Top variables"]

TODO move notes to documentation/issues
*/

export type JsonSchemaOfConfig = JSONSchemaType<Config>;

// TODO unable to use import with assert in app, so made copy of ./config.json here
// TODO the radiationMode is temporarily commented out here, as app does not need it yet
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
    // radiationMode: {
    //   type: "string",
    //   title: "Radiation mode",
    //   enum: ["constant", "dynamic", ""],
    //   default: "",
    //   "ui:group": "Radiation",
    // },
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
            type: "number",
            title: "ABL height",
            unit: "m",
            default: 200,
            "ui:group": "Mixed layer",
          },
          theta_0: {
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
            type: "number",
            title: "Temperature jump at h",
            "ui:group": "Mixed layer",
            default: 1,
            unit: "K",
          },
          q_0: {
            type: "number",
            "ui:group": "Mixed layer",
            unit: "kg kg-1",
            default: 0.008,
            title: "Mixed-layer specific humidity",
          },
          dq_0: {
            type: "number",
            description: "Specific humidity jump at h",
            unit: "kg kg-1",
            default: -0.001,
            "ui:group": "Mixed layer",
          },
          wtheta: {
            type: "array",
            items: {
              type: "number",
            },
            symbol: "wθ",
            "ui:group": "Mixed layer",
            unit: "K m s-1",
            title: "Surface kinematic heat flux",
            default: [0.1],
            minItems: 1,
          },
          advtheta: {
            type: "number",
            "ui:group": "Mixed layer",
            unit: "K s-1",
            default: 0,
            title: "Advection of heat",
          },
          gammatheta: {
            type: "number",
            "ui:group": "Mixed layer",
            unit: "K m-1",
            default: 0.006,
            title: "Free atmosphere potential temperature lapse rate",
          },
          wq: {
            type: "number",
            "ui:group": "Mixed layer",
            unit: "kg kg-1 m s-1",
            default: 0.0001,
            title: "Surface kinematic moisture flux",
          },
          advq: {
            type: "number",
            "ui:group": "Mixed layer",
            unit: "kg kg-1 s-1",
            default: 0,
            title: "Advection of moisture",
          },
          gammaq: {
            type: "number",
            "ui:group": "Mixed layer",
            unit: "kg kg-1 m-1",
            default: 0,
            title: "Free atmosphere specific humidity lapse rate",
          },
          divU: {
            type: "number",
            "ui:group": "Mixed layer",
            default: 0,
            unit: "s-1",
            title: "Horizontal large-scale divergence of wind",
          },
          beta: {
            type: "number",
            "ui:group": "Mixed layer",
            default: 0.2,
            title: "Entrainment ratio for virtual heat",
            symbol: "β",
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
    // {
    //   if: {
    //     properties: {
    //       radiationMode: {
    //         const: "dynamic",
    //       },
    //     },
    //   },
    //   // biome-ignore lint/suspicious/noThenProperty: part of JSON Schema
    //   then: {
    //     properties: {
    //       albedo: {
    //         type: "number",
    //         "ui:group": "Radiation",
    //         title: "Albedo",
    //         symbol: "𝜶",
    //         default: 0.2,
    //       },
    //     },
    //     required: ["albedo"],
    //   },
    // },
    // {
    //   if: {
    //     properties: {
    //       radiationMode: {
    //         const: "constant",
    //       },
    //     },
    //   },
    //   // biome-ignore lint/suspicious/noThenProperty: part of JSON Schema
    //   then: {
    //     properties: {
    //       cq: {
    //         type: "number",
    //         "ui:group": "Radiation",
    //         unit: "kg kg-1",
    //         title: "Constant radiation value",
    //         symbol: "cq",
    //         default: 0,
    //       },
    //     },
    //     required: ["cq"],
    //   },
    // },
  ],
};

export const jsonSchemaOfConfig =
  untypedSchema as unknown as JsonSchemaOfConfig;
