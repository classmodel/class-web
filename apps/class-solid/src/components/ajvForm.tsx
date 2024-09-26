import type {
  FieldValues,
  FormErrors,
  PartialValues,
  ValidateForm,
} from "@modular-forms/solid";
import type { ValidateFunction } from "ajv";

/**
 * Creates a modular form validator from an AJV validate function.
 *
 * @param validate - The AJV validate function. Return of `new Ajv().compile(schema)`.
 * @returns A validation function.
 */
export function ajvForm<TFieldValues extends FieldValues>(
  validate: ValidateFunction<TFieldValues>,
): ValidateForm<TFieldValues> {
  // Modelled after
  // https://github.com/fabian-hiller/modular-forms/blob/main/packages/solid/src/adapters/zodForm.ts
  // but ajv does not have async version of validate
  return (values: PartialValues<TFieldValues>) => {
    const formErrors: Record<string, string> = {};
    if (!validate(values)) {
      const ajvErrors = validate.errors ?? [];
      for (const error of ajvErrors) {
        const path = error.instancePath.slice(1).replace("/", ".");
        formErrors[path] = error.message ?? "Invalid value";
      }
      // TODO convert ajv errors to modular form errors
      console.error({ values, ajvErrors, formErrors });
    }
    return formErrors as FormErrors<TFieldValues>;
  };
}
