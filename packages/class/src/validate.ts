/**
 * This module contains functions to validate and parse configuration objects.
 *
 * @module
 */
import { Ajv2019 } from "ajv/dist/2019.js";
import type { DefinedError } from "ajv/dist/2019.js";
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
