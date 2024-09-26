import {
  ConfigAsJsonSchema,
  type PartialConfig,
  ajv,
} from "@classmodel/class/validate";
import type { JSONSchemaType } from "ajv";

type NamedAndDescription = {
  title: string;
  description: string;
};
export type NamedConfig = NamedAndDescription & PartialConfig;

export const NamedConfigAsJsonSchema = {
  ...ConfigAsJsonSchema,
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    ...ConfigAsJsonSchema.properties,
  },
  required: [...ConfigAsJsonSchema.required, "title"],
} as JSONSchemaType<NamedConfig>;

export const validate = ajv.compile(NamedConfigAsJsonSchema);
