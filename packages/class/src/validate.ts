/**
 * This module contains functions to validate and parse configuration objects.
 *
 * @module
 */
import { Ajv2019 } from "ajv/dist/2019.js";
import type { DefinedError, JSONSchemaType } from "ajv/dist/2019.js";
import { type Config, jsonSchemaOfConfig } from "./config.js";

export const ajv = new Ajv2019({
  coerceTypes: true,
  allErrors: true,
  useDefaults: "empty",
  code: { esm: true },
});
ajv.addKeyword({
  keyword: "unit",
  type: "number",
  schemaType: "string",
  // TODO Add validation, like if unit===K then value >= 0
});

/**
 * Validates the given input against the configuration JSON schema.
 *
 * Errors can be accessed via the `errors` property of this function.
 *
 * @param input - The input to be validated.
 * @returns `true` if the input is valid, `false` otherwise.
 */
export const validate = ajv.compile(jsonSchemaOfConfig);

export class ValidationError extends Error {
  public errors: DefinedError[] | null | undefined;

  constructor(errors: DefinedError[] | null | undefined) {
    super(`Invalid input: ${ajv.errorsText(errors)}`);
    this.errors = errors;
    this.name = "ValidationError";
  }
}

/**
 * Parses the given input and returns a Config object if the input is valid.
 *
 * @param input - The input to be parsed, which can be of any type.
 * @returns The validated input as a Config object.
 * @throws {ValidationError} If the input is not valid according to the validation rules.
 */
export function parse(input: unknown): Config {
  if (!validate(input)) {
    throw new ValidationError(validate.errors as DefinedError[]);
  }
  return input;
}

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object | undefined
      ? RecursivePartial<T[P]>
      : T[P];
};

export type PartialConfig = RecursivePartial<Config>;

/**
 * Prunes the default values from the given configuration object.
 *
 * This function compares the provided configuration object with the default
 * configuration and removes any properties that match the default values.
 * It currently handles only objects of objects.
 *
 * @param config - The configuration object to prune.
 * @returns A new configuration object with default values removed.
 */
export function pruneDefaults(config: PartialConfig): PartialConfig {
  const newConfig: PartialConfig = {};
  const defaultConfig = parse({});
  // TODO make more generic, now only handles object of objects
  for (const [key, value] of Object.entries(config)) {
    const tkey = key as keyof Config;
    if (typeof value === "object") {
      for (const [subKey, subValue] of Object.entries(value)) {
        const defaultParent = defaultConfig[tkey];
        const defaultValue =
          defaultParent[subKey as keyof typeof defaultParent];
        if (subValue !== defaultValue) {
          if (!newConfig[tkey]) {
            newConfig[tkey] = {};
          }
          (newConfig[tkey] as Record<string, unknown>)[subKey] = subValue;
        }
      }
    }
  }

  return newConfig;
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
export function overwriteDefaultsInJsonSchema<C>(
  schema: JSONSchemaType<C>,
  defaults: RecursivePartial<C>,
) {
  const newSchema = structuredClone(schema);
  // TODO make more generic, now only handles object of objects
  for (const key in defaults) {
    const val = defaults[key as keyof RecursivePartial<C>];
    for (const subkey in val) {
      const subval = val[subkey as keyof typeof val];
      const prop =
        newSchema.properties[key as keyof C].properties[
          subkey as keyof typeof val
        ];
      prop.default = subval;
    }
  }
  return newSchema;
}

// TODO move below to app, this is not a general utility, unless cli can run experiment
/**
 * An experiment configuration is a combination of a reference configuration and a set of permutation configurations.
 */
export interface ExperimentConfigSchema {
  name: string;
  description?: string;
  preset?: string;
  reference: PartialConfig;
  permutations: {
    name: string;
    config: PartialConfig;
  }[];
}
const jsonSchemaOfExperimentConfig = {
  type: "object",
  properties: {
    name: { type: "string" },
    description: {
      type: "string",
    },
    preset: { type: "string" },
    reference: jsonSchemaOfConfig,
    permutations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          config: jsonSchemaOfConfig,
        },
      },
    },
  },
  required: ["name", "reference"],
} as unknown as JSONSchemaType<ExperimentConfigSchema>;
// TODO remove cast via unknown

const validateExperimentConfig = ajv.compile(jsonSchemaOfExperimentConfig);

/** Parse unknown input into a Experiment configuration
 *
 * @param input - The input to be parsed.
 * @returns The validated input as a Experiment configuration object.
 * @throws {ValidationError} If the input is not valid according to the validation rules.
 */
export function parseExperimentConfig(input: unknown): ExperimentConfigSchema {
  if (!validateExperimentConfig(input)) {
    throw new ValidationError(
      validateExperimentConfig.errors as DefinedError[],
    );
  }
  return input;
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
  permutation: PartialConfig,
  reference: PartialConfig,
  preset?: PartialConfig,
): PartialConfig {
  const config = structuredClone(permutation);
  let config2 = reference;
  if (preset) {
    config2 = pruneConfig(reference, preset);
  }
  for (const section in config) {
    const s = config[section as keyof typeof config];
    const s2 = config2[section as keyof typeof config2];
    if (s === undefined || s2 === undefined) {
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
