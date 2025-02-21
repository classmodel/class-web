import type { Config, JsonSchemaOfConfig } from "./config.js";

/**
 * Overwrite values in first configuration with second configuration.
 *
 * @param first
 * @param second
 * @returns Shallow copy of first with values of second.
 */
// biome-ignore lint/suspicious/noExplicitAny: recursion is hard to type
export function mergeConfigurations(first: any, second: any) {
  const merged = { ...first };

  for (const key in second) {
    if (
      second[key] &&
      typeof second[key] === "object" &&
      !Array.isArray(second[key])
    ) {
      merged[key] = mergeConfigurations(first[key], second[key]);
    } else {
      merged[key] = second[key];
    }
  }

  return merged;
}

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object | undefined
      ? RecursivePartial<T[P]>
      : T[P];
};

/**
 * Config with all values optional.
 */
export type PartialConfig = RecursivePartial<Config>;

function compareArray<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) {
    return false
  }
  for (let index = 0; index < a.length; index++) {
    if (a[index] !== b[index]) {
      return false
    }
  }
  return true
}

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
      if (Array.isArray(s[k]) && Array.isArray(s2[k2]) && compareArray(s[k], s2[k2])) {
        delete s[k]
      } else if (s[k] === s2[k2]) {
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
