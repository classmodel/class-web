import { jsonSchemaOfConfig } from "@classmodel/class/config";
import { type PartialConfig, ajv } from "@classmodel/class/validate";
import type { JSONSchemaType } from "ajv";

type NamedAndDescription = {
  title: string;
  description: string;
};
export type NamedConfig = NamedAndDescription & PartialConfig;

export const jsonSchemaOfNamedConfig = {
  ...jsonSchemaOfConfig,
  properties: {
    title: { type: "string", title: "Title", minLength: 1 },
    description: { type: "string", title: "Description" },
    ...jsonSchemaOfConfig.properties,
  },
  required: [...jsonSchemaOfConfig.required, "title"],
} as JSONSchemaType<NamedConfig>;

export const validate = ajv.compile(jsonSchemaOfNamedConfig);
