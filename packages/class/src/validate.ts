import Ajv from "ajv/dist/2019";
import type { ErrorObject, JSONSchemaType } from "ajv/dist/2019";

import type { Config } from "./config";
import rawConfigJson from "./config.json";

export const configJsonSchema =
  rawConfigJson as unknown as JSONSchemaType<Config>;

const ajv = new Ajv({
  coerceTypes: true,
  allErrors: true,
  code: { esm: true },
});
const ajvWithDefaults = new Ajv({
  coerceTypes: true,
  allErrors: true,
  useDefaults: true,
  code: { esm: true },
});
const ajvParser = ajvWithDefaults.compile(configJsonSchema);

export const validate = ajv.compile(configJsonSchema);

export class ValidationError extends Error {
  public errors: ErrorObject[] | null | undefined;

  constructor(errors: ErrorObject[] | null | undefined) {
    super(`Invalid input: ${ajv.errorsText(errors)}`);
    this.errors = errors;
    this.name = "ValidationError";
  }
}

export function parse(input: unknown): Config {
  if (!ajvParser(input)) {
    throw new ValidationError(validate.errors);
  }
  return input;
}
