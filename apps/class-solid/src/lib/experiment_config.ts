import type { Config } from "@classmodel/class/config";
import type { PartialConfig } from "@classmodel/class/config_utils";
import { ValidationError, ajv } from "@classmodel/class/validate";
import { overwriteDefaultsInJsonSchema } from "@classmodel/form/utils";
import type { DefinedError, JSONSchemaType } from "ajv";
import { findPresetByName } from "./presets";

/*
Height (m AGL)	 Pressure (mb)	 Temperature (C)	 Relative humidity (%)	 Wind speed (m/s)	 Wind direction (true deg)
*/
export interface Observation {
  name: string;
  height: number[];
  pressure: number[];
  temperature: number[];
  relativeHumidity: number[];
  windSpeed: number[];
  windDirection: number[];
}

/**
 * An experiment configuration is a combination of a preset name and
 * a reference configuration and a set of permutation configurations.
 */
export interface ExperimentConfig<C = Config> {
  preset: string;
  reference: C;
  permutations: C[];
  observations?: Observation[];
}

/**
 * A partial experiment configuration used for input and output.
 *
 * Parameters in permutation which are same as in reference or preset are absent.
 * Parameters in reference which are same as in preset are absent.
 */
export type PartialExperimentConfig = ExperimentConfig<PartialConfig>;

/**
 * JSON schema of experiment config without checking the configs, thats done by the presets[x].parse()
 */
const jsonSchemaOfExperimentConfigBase = {
  type: "object",
  properties: {
    preset: { type: "string", default: "Default" },
    reference: {
      type: "object",
      additionalProperties: true,
    },
    permutations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true,
      },
      default: [],
    },
    observations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          height: { type: "array", items: { type: "number" } },
          pressure: { type: "array", items: { type: "number" } },
          temperature: { type: "array", items: { type: "number" } },
          relativeHumidity: { type: "array", items: { type: "number" } },
          windSpeed: { type: "array", items: { type: "number" } },
          windDirection: { type: "array", items: { type: "number" } },
        },
        required: [
          "name",
          "height",
          "pressure",
          "temperature",
          "relativeHumidity",
          "windSpeed",
          "windDirection",
        ],
      },
    },
  },
  required: ["preset", "reference", "permutations"],
} as unknown as JSONSchemaType<ExperimentConfig<object>>;

const validateExperimentConfigBase = ajv.compile(
  jsonSchemaOfExperimentConfigBase,
);

function parseExperimentConfigBase(input: unknown): ExperimentConfig<object> {
  if (!validateExperimentConfigBase(input)) {
    throw new ValidationError(
      validateExperimentConfigBase.errors as DefinedError[],
    );
  }
  return input;
}

/** Parse unknown input into an Experiment configuration
 *
 * The input can be partial, i.e. only contain the fields that are different from the preset or reference.
 *
 * @param input - The input to be parsed.
 * @returns The validated input as a Experiment configuration object.
 * @throws {ValidationError} If the input is not valid according to the validation rules.
 */
export function parseExperimentConfig(input: unknown): ExperimentConfig {
  const base = parseExperimentConfigBase(input);
  const preset = findPresetByName(base.preset);
  const reference = preset.parse(base.reference);

  // The partial permutation should be parsed with the reference as the base.
  // For example given parameter in preset is 10 and in reference is 20
  // If permutation has 30 then should stay 30.
  // If permutation has undefined then should be 20.
  const referenceSchema = overwriteDefaultsInJsonSchema(
    preset.schema,
    reference,
  );
  const referenceValidate = ajv.compile(referenceSchema);
  function permParse(input: unknown): Config {
    if (!referenceValidate(input)) {
      throw new ValidationError(referenceValidate.errors as DefinedError[]);
    }
    return input;
  }

  const permutations = base.permutations.map(permParse);
  const config: ExperimentConfig = {
    reference,
    preset: base.preset,
    permutations,
  };
  if (base.observations) {
    config.observations = base.observations;
  }
  return config;
}
