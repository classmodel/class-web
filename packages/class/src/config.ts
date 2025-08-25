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
    sw_wind: {
      type: "boolean",
      "ui:group": "Wind",
      title: "Wind switch",
      default: false,
    },
    sw_fire: {
      type: "boolean",
      "ui:group": "Fire",
      title: "Fire switch",
      default: false,
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
          qt: {
            symbol: "qt",
            type: "number",
            "ui:group": "Mixed layer",
            unit: "kg kg⁻¹",
            default: 0.008,
            title: "Mixed-layer specific humidity",
          },
          dqt: {
            symbol: "Δqt",
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
          gamma_theta: {
            symbol: "γ<sub>θ</sub>",
            type: "array",
            items: {
              type: "number",
            },
            minItems: 1,
            "ui:group": "Mixed layer",
            unit: "K m⁻¹",
            default: [0.006],
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
          gamma_qt: {
            symbol: "γ<sub>q</sub>",
            type: "array",
            items: {
              type: "number",
            },
            minItems: 1,
            "ui:group": "Mixed layer",
            unit: "kg kg⁻¹ m⁻¹",
            default: [0],
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
          p0: {
            symbol: "p<sub>0</sub>",
            type: "number",
            default: 101300,
            unit: "Pa",
            "ui:group": "Mixed layer",
            title: "Surface pressure",
          },
          z_theta: {
            symbol: "z<sub>θ</sub>",
            type: "array",
            items: {
              type: "number",
            },
            minItems: 1,
            "ui:group": "Mixed layer",
            unit: "m",
            default: [5000],
            title: "Anchor point(s) for γ_θ",
            description:
              "Each value specifies the end of the corresponding segment in γ_θ",
          },
          z_qt: {
            symbol: "z<sub>q</sub>",
            type: "array",
            items: {
              type: "number",
            },
            minItems: 1,
            "ui:group": "Mixed layer",
            unit: "m",
            default: [5000],
            title: "Anchor point(s) for γ_q",
            description:
              "Each value specifies the end of the corresponding segment in γ_q",
          },
        },
        required: [
          "h",
          "theta",
          "dtheta",
          "qt",
          "dqt",
          "wtheta",
          "advtheta",
          "gamma_theta",
          "wq",
          "p0",
          "advq",
          "gamma_qt",
          "divU",
          "beta",
          "z_theta",
          "z_qt",
        ],
      },
    },
    {
      if: {
        properties: {
          sw_wind: {
            const: true,
          },
        },
      },
      // biome-ignore lint/suspicious/noThenProperty: part of JSON Schema
      then: {
        properties: {
          u: {
            symbol: "u",
            type: "number",
            unit: "m s⁻¹",
            default: 6,
            title: "Mixed-layer u-wind speed",
            "ui:group": "Wind",
          },
          du: {
            symbol: "Δu",
            type: "number",
            unit: "m s⁻¹",
            default: 4,
            title: "U-wind jump at h",
            "ui:group": "Wind",
          },
          advu: {
            symbol: "adv(u)", // _adv not possible in unicode
            type: "number",
            "ui:group": "Wind",
            unit: "m s⁻²",
            default: 0,
            title: "Advection of u-wind",
          },
          gamma_u: {
            symbol: "γ<sub>u</sub>",
            type: "array",
            items: {
              type: "number",
            },
            minItems: 1,
            unit: "s⁻¹",
            default: [0],
            title: "Free atmosphere u-wind speed lapse rate",
            description: "Specify one or multiple segments",
            "ui:group": "Wind",
          },
          z_u: {
            symbol: "z_u",
            type: "array",
            items: {
              type: "number",
            },
            minItems: 1,
            unit: "m",
            default: [5000],
            title: "Anchor point(s) for γ_u",
            description:
              "Each value specifies the end of the corresponding segment in γ_u",
            "ui:group": "Wind",
          },
          v: {
            symbol: "v",
            type: "number",
            unit: "m s⁻¹",
            default: -4,
            title: "Mixed-layer v-wind speed",
            "ui:group": "Wind",
          },
          dv: {
            symbol: "Δv",
            type: "number",
            unit: "m s⁻¹",
            default: 4,
            title: "V-wind jump at h",
            "ui:group": "Wind",
          },
          advv: {
            symbol: "adv(v)", // _adv not possible in unicode
            type: "number",
            "ui:group": "Wind",
            unit: "m s⁻²",
            default: 0,
            title: "Advection of v-wind",
          },
          gamma_v: {
            symbol: "γ<sub>v</sub>",
            type: "array",
            items: {
              type: "number",
            },
            minItems: 1,
            unit: "s⁻¹",
            default: [0],
            title: "Free atmosphere v-wind speed lapse rate",
            description: "Specify one or multiple segments",
            "ui:group": "Wind",
          },
          z_v: {
            symbol: "z_v",
            type: "array",
            items: {
              type: "number",
            },
            minItems: 1,
            unit: "m",
            default: [5000],
            title: "Anchor point(s) for γ_v",
            description:
              "Each value specifies the end of the corresponding segment in γ_v",
            "ui:group": "Wind",
          },
          ustar: {
            symbol: "u*",
            type: "number",
            unit: "m s⁻¹",
            title: "Surface friction velocity",
            "ui:group": "Wind",
            default: 0.3,
          },
        },
        required: [
          "u",
          "du",
          "advu",
          "gamma_u",
          "z_u",
          "v",
          "dv",
          "advv",
          "gamma_v",
          "z_v",
          "ustar",
        ],
      },
    },
    {
      if: {
        properties: {
          sw_fire: {
            const: true,
          },
        },
      },
      // biome-ignore lint/suspicious/noThenProperty: part of JSON Schema
      then: {
        properties: {
          L: {
            symbol: "L<sub>fire</sub>",
            type: "number",
            unit: "m",
            default: 1000,
            title: "Length of the fire",
            "ui:group": "Fire",
          },
          d: {
            symbol: "d<sub>fire</sub>",
            type: "number",
            unit: "m",
            default: 10,
            title: "Depth of the fire",
            "ui:group": "Fire",
          },
          h0: {
            symbol: "h<sub>0, fire</sub>",
            type: "number",
            unit: "m",
            default: 20,
            title: "Height to start",
            "ui:group": "Fire",
          },
          C: {
            symbol: "C<sub>fire</sub>",
            type: "number",
            unit: "J kg⁻¹",
            default: 18.6208e6,
            title: "Heat stored in fuel",
            "ui:group": "Fire",
          },
          Cq: {
            symbol: "C<sub>q,fire</sub>",
            type: "number",
            unit: "kg kg⁻¹",
            default: 0,
            title: "Moisture per kg fuel released into plume",
            "ui:group": "Fire",
          },
          omega: {
            symbol: "ω<sub>fire</sub>",
            type: "number",
            unit: "kg m⁻²",
            default: 0.1,
            title: "Consumed fuel mass per area",
            "ui:group": "Fire",
          },
          spread: {
            symbol: "v<sub>fire</sub>",
            type: "number",
            unit: "m s⁻¹",
            default: 1.5,
            title: "Rate of spread of the fire",
            "ui:group": "Fire",
          },
          radiativeLoss: {
            symbol: "rl<sub>fire</sub>",
            type: "number",
            unit: "-",
            default: 0.7,
            title:
              "Fraction of F converted into radiative heating, and not diffused into the atmosphere",
            "ui:group": "Fire",
          },
        },
        required: ["L", "d", "h0", "C", "omega", "spread", "radiativeLoss"],
      },
    },
  ],
};

type GeneralConfig = {
  name: string;
  description?: string;
  dt: number;
  runtime: number;
};

export type WindConfig = {
  sw_wind: true;
  u: number;
  v: number;
  du: number;
  dv: number;
  advu: number;
  advv: number;
  gamma_u: number[];
  gamma_v: number[];
  z_u: number[];
  z_v: number[];
  ustar: number;
};
export type NoWindConfig = {
  sw_wind?: false;
};

export type MixedLayerConfig = {
  sw_ml: true;
  h: number;
  theta: number;
  dtheta: number;
  qt: number;
  dqt: number;
  wtheta: number[];
  advtheta: number;
  gamma_theta: number[];
  wq: number[];
  advq: number;
  gamma_qt: number[];
  divU: number;
  beta: number;
  p0: number;
  z_theta: number[];
  z_qt: number[];
};
type NoMixedLayerConfig = {
  sw_ml?: false;
};

export type FireConfig = {
  sw_fire: true;
  L: number;
  d: number;
  h0: number;
  C: number;
  Cq: number;
  omega: number;
  spread: number;
  radiativeLoss: number;
};
export type NoFireConfig = {
  sw_fire?: false;
};

// TODO: Don't allow WindConfig with NoMixedLayerConfig
export type Config = GeneralConfig &
  (MixedLayerConfig | NoMixedLayerConfig) &
  (WindConfig | NoWindConfig) &
  (FireConfig | NoFireConfig);

export type JsonSchemaOfConfig = JSONSchemaType<Config>;
export const jsonSchemaOfConfig =
  untypedSchema as unknown as JsonSchemaOfConfig;
