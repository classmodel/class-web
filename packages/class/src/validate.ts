import Ajv from "ajv/dist/2019";
import type { DefinedError, JSONSchemaType } from "ajv/dist/2019";

import type { Config } from "./config";
import rawConfigJson from "./config.json";

/**
 * The JSON schema for the configuration object.
 */
export const ConfigAsJsonSchema =
  rawConfigJson as unknown as JSONSchemaType<Config>;

const ajv = new Ajv({
  coerceTypes: true,
  allErrors: true,
  useDefaults: true,
  code: { esm: true },
});

/**
 * Validates the given input against the configuration JSON schema.
 *
 * Errors can be accessed via the `errors` property of this function.
 *
 * @param input - The input to be validated.
 * @returns `true` if the input is valid, `false` otherwise.
 *
 */
export const validate = ajv.compile(ConfigAsJsonSchema);

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
export function pruneDefaults(config: Config): PartialConfig {
  const newConfig: PartialConfig = {};
  const defaultConfig = parse({});
  // TODO make more generic, now only handles object of objects
  for (const [key, value] of Object.entries(config)) {
    const tkey = key as keyof Config;
    if (typeof value === "object") {
      for (const [subKey, subValue] of Object.entries(value)) {
        const defaultValue = (defaultConfig[tkey] as Record<string, unknown>)[
          subKey
        ];
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
