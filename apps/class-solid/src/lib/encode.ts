import type { DefinedError, JSONSchemaType } from "ajv";
import { unwrap } from "solid-js/store";

import { ValidationError, ajv, parse } from "@classmodel/class/validate";

import {
  type ExperimentConfig,
  type PartialExperimentConfig,
  pruneConfig,
} from "./experiment_config";
import { findPresetByName } from "./presets";
import type { Analysis, Experiment } from "./store";

export function decodeAppState(encoded: string): [Experiment[], Analysis[]] {
  const decoded = decodeURI(encoded);

  const parsed = JSON.parse(decoded);
  // TODO use ajv to validate experiment, permutation, and analysis
  // now only config is validated
  const experiments: Experiment[] = parsed.experiments.map(
    (exp: {
      name: string;
      description?: string;
      preset?: string;
      reference: unknown;
      permutations: Record<string, unknown>;
    }) => ({
      name: exp.name,
      description: exp.description,
      preset: exp.preset,
      reference: {
        config: parse(exp.reference),
      },
      permutations: Object.entries(exp.permutations).map(([name, config]) => ({
        name,
        config: parse(config),
      })),
    }),
  );
  const analyses: Analysis[] = [];
  return [experiments, analyses];
}

export function encodeAppState(
  experiments: Experiment[],
  analyses: Analysis[],
) {
  const rawExperiments = unwrap(experiments);
  const minimizedState = {
    experiments: rawExperiments.map((exp) => toPartial(exp.config)),
  };
  return encodeURI(JSON.stringify(minimizedState, undefined, 0));
}

export function toPartial(config: ExperimentConfig): PartialExperimentConfig {
  const preset = findPresetByName(config.preset);
  const reference = pruneConfig(config.reference, preset.config);
  return {
    reference,
    preset: config.preset,
    permutations: config.permutations.map((perm) =>
      pruneConfig(perm, config.reference, preset.config),
    ),
  };
}

export function fromPartial(
  partial: PartialExperimentConfig,
): ExperimentConfig {
  return parseExperimentConfig(partial);
}

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
  },
  required: ["preset", "reference", "permutations"],
} as unknown as JSONSchemaType<ExperimentConfig<object>>;
const validateExperimentConfigBase = ajv.compile(
  jsonSchemaOfExperimentConfigBase,
);

function parseExperimentConfigBase(input: unknown): ExperimentConfig<object> {
  // TODO make preset aware, aka when validating use defaults from preset
  if (!validateExperimentConfigBase(input)) {
    throw new ValidationError(
      validateExperimentConfigBase.errors as DefinedError[],
    );
  }
  return input;
}

/** Parse unknown input into a Experiment configuration
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
  // TODO a reference paramaeer not overwritten in a permutation should be in permutation.
  const permutations = base.permutations.map((perm) => preset.parse(perm));
  return {
    reference,
    preset: base.preset,
    permutations,
  };
}
