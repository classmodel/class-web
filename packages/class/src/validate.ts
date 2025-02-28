/**
 * This module contains functions to validate and parse configuration objects.
 *
 * @module
 */
import { Ajv2020, type DefinedError } from "ajv/dist/2020.js";
import { type Config, jsonSchemaOfConfig } from "./config.js";

// buildValidate() in @classmodel/form duplicates this code
// TODO dedup, by moving ajv helpers to own package
// so @classmode/class and @classmodel/form can both use it
// without having both depend on each other
export const ajv = new Ajv2020({
  coerceTypes: true,
  allErrors: true,
  useDefaults: "empty",
  code: { esm: true },
});

ajv.addKeyword({
  keyword: "unit",
  type: ["number", "array"],
  schemaType: "string",
  // TODO Add validation, like if unit===K then value >= 0
});
ajv.addKeyword({
  keyword: "symbol",
  type: ["number", "array"],
  schemaType: "string",
});
/**
 * When property has 'ui:group' keyword, it will be grouped in the UI inside the group of the same name.
 */
ajv.addKeyword({
  keyword: "ui:group",
  schemaType: "string",
});
ajv.addKeyword({
  keyword: "ui:widget",
  schemaType: "string",
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
