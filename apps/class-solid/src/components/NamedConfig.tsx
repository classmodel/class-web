import {
  type PartialConfig,
  ajv,
  jsonSchemaOfConfig,
} from "@classmodel/class/validate";
import type { JSONSchemaType } from "ajv";

type NamedAndDescription = {
  title: string;
  description: string;
};
export type NamedConfig = NamedAndDescription & PartialConfig;

export const jsonSchemaOfNamedConfig = {
  ...jsonSchemaOfConfig,
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    ...jsonSchemaOfConfig.properties,
  },
  required: [...jsonSchemaOfConfig.required, "title"],
} as JSONSchemaType<NamedConfig>;

export const validate = ajv.compile(jsonSchemaOfNamedConfig);
