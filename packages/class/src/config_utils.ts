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

function isArrayEqual<T>(a: T[], b: T[]): boolean {
  if (!(a && b) && a.length !== b.length) {
    return false;
  }
  for (let index = 0; index < a.length; index++) {
    if (a[index] !== b[index]) {
      return false;
    }
  }
  return true;
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
  for (const key in config) {
    const k = key as keyof typeof config;
    const k2 = key as keyof typeof config;
    if (typeof config[k] === "string") {
      // Do not prune name and description
      continue;
    }
    const v = config[k];
    const v2 = config2[k2];
    if (v === undefined && v2 === undefined) {
      delete config[k];
    } else if (Array.isArray(v) && Array.isArray(v2) && isArrayEqual(v, v2)) {
      delete config[k];
    } else if (v === v2) {
      delete config[k];
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
  // TODO make more generic, now only handles .properties and .allOf[n].then.properties
  for (const key in defaults) {
    const val = defaults[key as keyof Config];
    const prop = newSchema.properties[key as keyof Config];
    if (prop && "default" in prop) {
      prop.default = val;
    }
    // for (const subkey in val) {
    //   const subval = val[subkey as keyof typeof val];
    //   const prop =
    //     newSchema.properties[key as keyof Config].properties[
    //       subkey as keyof typeof val
    //     ];
    //   prop.default = subval;
    // }
  }
  for (const ifs of newSchema.allOf) {
    const props = ifs.then.properties;
    for (const key in defaults) {
      const val = defaults[key as keyof Config];
      const prop = props[key as keyof Config];
      if (prop && "default" in prop) {
        prop.default = val;
      }
    }
  }
  return newSchema;
}
