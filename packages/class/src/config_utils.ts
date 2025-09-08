import type { Config } from "./config.js";
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
    if (k === "name" || k === "description") {
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
