import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

export const classDefaultConfig = z.object({
  h: z.coerce
    .number()
    .min(0)
    .max(10)
    .default(5)
    .describe("Initial ABL height [m]"),
  theta: z.coerce
    .number()
    .min(0)
    .max(10)
    .default(5)
    .describe("Initial mixed-layer potential temperature [K]"),
  dtheta: z.coerce
    .number()
    .min(0)
    .max(10)
    .default(5)
    .describe("Initial temperature jump at h [K]"),
  q: z.coerce
    .number()
    .min(0)
    .max(10)
    .default(5)
    .describe("Initial mixed-layer specific humidity [kg kg-1]"),
  dq: z.coerce
    .number()
    .min(0)
    .max(10)
    .default(5)
    .describe("Initial specific humidity jump at h [kg kg-1]"),
});

export type ClassConfig = z.infer<typeof classDefaultConfig>;
export const classDefaultConfigSchema = zodToJsonSchema(
  classDefaultConfig,
  "classDefaultConfig"
);
export type ClassOutput = Record<string, number[]>;

export function runClass(config: ClassConfig): ClassOutput {
  console.log("CLASS called with the following config", config);
  let output = { h: [1, 2, 3, 4, 5, 6] };
  return output;
}
