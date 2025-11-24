import { ajv } from "@classmodel/class/validate";
import { type DefinedError, type JSONSchemaType, ValidationError } from "ajv";

export interface BaseAnalysis {
  id: string;
  description: string;
  type: string;
  name: string;
}

export type TimeseriesAnalysis = BaseAnalysis & {
  xVariable: string;
  yVariable: string;
};

export type ProfilesAnalysis = BaseAnalysis & {
  variable: string;
  time: number;
};

export type SkewTAnalysis = BaseAnalysis & {
  time: number;
};

export type Analysis = TimeseriesAnalysis | ProfilesAnalysis | SkewTAnalysis;
export const analysisNames = [
  "Vertical profiles",
  "Timeseries",
  "Thermodynamic diagram",
];

export function parseAnalysis(raw: unknown): Analysis {
  const schema = {
    oneOf: [
      {
        required: [
          "id",
          "description",
          "type",
          "name",
          "xVariable",
          "yVariable",
        ],
        properties: {
          id: { type: "string" },
          description: { type: "string" },
          type: { const: "timeseries" },
          name: { type: "string" },
          xVariable: { type: "string" },
          yVariable: { type: "string" },
        },
        additionalProperties: false,
      },
      {
        type: "object",
        required: ["id", "description", "type", "name", "variable", "time"],
        properties: {
          id: { type: "string" },
          description: { type: "string" },
          type: { const: "profiles" },
          name: { type: "string" },
          variable: { type: "string" },
          time: { type: "number" },
        },
        additionalProperties: false,
      },
      {
        type: "object",
        required: ["id", "description", "type", "name", "time"],
        properties: {
          id: { type: "string" },
          description: { type: "string" },
          type: { const: "skewT" },
          name: { type: "string" },
          time: { type: "number" },
        },
        additionalProperties: false,
      },
    ],
  } as unknown as JSONSchemaType<Analysis>;
  const validate = ajv.compile(schema);
  if (!validate(raw)) {
    throw new ValidationError(validate.errors as DefinedError[]);
  }
  return raw;
}
