import type { Config, JsonSchemaOfConfig } from "@classmodel/class/config";
import type { PartialConfig } from "@classmodel/class/validate";

/**
 * An experiment configuration is a combination of a reference configuration and a set of permutation configurations.
 */
export interface ExperimentConfig<C = Config> {
  preset: string;
  reference: C;
  permutations: C[];
}

/**
 * A partial experiment configuration used for input and output.
 *
 * Parameters in permutation which are same as in reference or preset are absent.
 * Parameters in reference which are same as in preset are absent.
 */
export type PartialExperimentConfig = ExperimentConfig<PartialConfig>;

/**
 *
 * From first config remove all parameters that are the same as in the second config or third config.
 *
 * @param permutation
 * @param reference
 * @param preset
 * @returns Pruned permutation configuration
 */
export function pruneConfig(
  permutation: Config,
  reference: Config,
  preset?: Config,
): PartialConfig {
  let config = structuredClone(permutation);
  let config2 = reference;
  if (preset) {
    config = pruneConfig(permutation, reference) as Config;
    config2 = preset;
  }
  for (const section in config) {
    const s = config[section as keyof typeof config];
    const s2 = config2[section as keyof typeof config2];
    if (s === undefined || s2 === undefined) {
      continue;
    }
    if (typeof s === "string") {
      // Do not prune name and description
      continue;
    }
    for (const key in s) {
      const k = key as keyof typeof s;
      const k2 = key as keyof typeof s2;
      if (s[k] === s2[k2]) {
        delete s[k];
      }
    }
    if (Object.keys(s).length === 0) {
      delete config[section as keyof typeof config];
    }
  }
  return config;
}

/**
 * Overwrites the default values in a JSON schema with the provided defaults.
 *
 * @param schema - The original JSON schema to be modified.
 * @param defaults - An object containing the default values to overwrite in the schema.
 * @returns A new JSON schema with the default values overwritten.
 *
 * @remarks
 * This function currently only handles objects of objects and needs to be made more generic.
 *
 * @example
 * ```typescript
 * const schema = {
 *   properties: {
 *     setting1: {
 *       properties: {
 *         subsetting1: { type: 'string', default: 'oldValue' }
 *       }
 *     }
 *   }
 * };
 *
 * const defaults = {
 *   setting1: {
 *     subsetting1: 'newValue'
 *   }
 * };
 *
 * const newSchema = overwriteDefaultsInJsonSchema(schema, defaults);
 * console.log(newSchema.properties.setting1.properties.subsetting1.default); // 'newValue'
 * ```
 */
export function overwriteDefaultsInJsonSchema(
  schema: JsonSchemaOfConfig,
  defaults: Config,
) {
  const newSchema = structuredClone(schema);
  // TODO make more generic, now only handles object of objects
  for (const key in defaults) {
    const val = defaults[key as keyof Config];
    if (typeof val !== "object") {
      continue;
    }
    for (const subkey in val) {
      const subval = val[subkey as keyof typeof val];
      const prop =
        newSchema.properties[key as keyof Config].properties[
          subkey as keyof typeof val
        ];
      prop.default = subval;
    }
  }
  return newSchema;
}

// biome-ignore lint/suspicious/noExplicitAny: recursion is hard to type
export function mergeConfigurations(reference: any, permutation: any) {
  const merged = { ...reference };

  for (const key in permutation) {
    if (
      permutation[key] &&
      typeof permutation[key] === "object" &&
      !Array.isArray(permutation[key])
    ) {
      merged[key] = mergeConfigurations(reference[key], permutation[key]);
    } else {
      merged[key] = permutation[key];
    }
  }

  return merged;
}
