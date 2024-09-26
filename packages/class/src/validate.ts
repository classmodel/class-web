import Ajv from "ajv/dist/2019";
import type { DefinedError, JSONSchemaType } from "ajv/dist/2019";

import type { Config } from "./config";
import rawConfigJson from "./config.json";

export const configJsonSchema =
  rawConfigJson as unknown as JSONSchemaType<Config>;


const ajv = new Ajv({
  coerceTypes: true,
  allErrors: true,
  code: { esm: true },
});
export const validate = ajv.compile(configJsonSchema);

const ajvWithDefaults = new Ajv({
  coerceTypes: true,
  allErrors: true,
  useDefaults: true,
  code: { esm: true },
});
const validateWithDefaults = ajvWithDefaults.compile(configJsonSchema);


export class ValidationError extends Error {
  public errors: DefinedError[] | null | undefined;

  constructor(errors: DefinedError[] | null | undefined) {
    super(`Invalid input: ${ajv.errorsText(errors)}`);
    this.errors = errors;
    this.name = "ValidationError";
  }
}

export function partialParse(input: unknown): Config {
  if (!validate(input)) {
    throw new ValidationError(validate.errors as DefinedError[]);
  }
  return input;
}

export function parse(input: unknown): Config {
  if (!validateWithDefaults(input)) {
    throw new ValidationError(validateWithDefaults.errors as DefinedError[]);
  }
  return input;
}
