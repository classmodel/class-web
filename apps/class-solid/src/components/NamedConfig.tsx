import {
  type PartialConfig,
  ValidationError,
  ajv,
  jsonSchemaOfConfig,
} from "@classmodel/class/validate";
import type { DefinedError, JSONSchemaType } from "ajv";

export type NamedConfig = {
  title: string;
  description?: string;
} & PartialConfig;

export const jsonSchemaOfNamedConfig = {
  ...jsonSchemaOfConfig,
  properties: {
    title: { type: "string", title: "Title", minLength: 1 },
    description: { type: "string", title: "Description" },
    ...jsonSchemaOfConfig.properties,
  },
  required: ["title", ...jsonSchemaOfConfig.required],
} as JSONSchemaType<NamedConfig>;

export const validate = ajv.compile(jsonSchemaOfNamedConfig);

export interface ExperimentConfigSchema {
  reference: NamedConfig;
  permutations: NamedConfig[];
}
const jsonSchemaOfExperimentConfig = {
  type: "object",
  properties: {
    reference: {
      ...jsonSchemaOfNamedConfig,
      title: "Reference",
    },
    permutations: {
      type: "array",
      title: "Permutations",
      items: jsonSchemaOfNamedConfig,
      // uniqueItems: true // TODO enforce?
    },
  },
  required: ["reference:", "permutations"],
} as JSONSchemaType<ExperimentConfigSchema>;

const validateExperimentConfig = ajv.compile(jsonSchemaOfExperimentConfig);

export function parseExperimentConfig(input: unknown): ExperimentConfigSchema {
  if (!validateExperimentConfig(input)) {
    throw new ValidationError(validate.errors as DefinedError[]);
  }
  return input;
}
