import { pruneConfig } from "@classmodel/class/config_utils";
import { unwrap } from "solid-js/store";
import {
  type ExperimentConfig,
  type PartialExperimentConfig,
  parseExperimentConfig,
} from "./experiment_config";
import { findPresetByName } from "./presets";
import type { Analysis, Experiment } from "./store";

export function decodeAppState(encoded: string): [Experiment[], Analysis[]] {
  const decoded = decodeURI(encoded);

  const parsed = JSON.parse(decoded);
  const experiments: Experiment[] = [];
  if (typeof parsed === "object" && Array.isArray(parsed.experiments)) {
    for (const exp of parsed.experiments) {
      const config = parseExperimentConfig(exp);
      const experiment: Experiment = {
        config,
        output: {
          running: false,
          permutations: [],
        },
      };
      experiments.push(experiment);
    }
  } else {
    console.error("No experiments found in ", encoded);
  }

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
      pruneConfig(perm, config.reference),
    ),
    observations: config.observations,
  };
}

export function fromPartial(
  partial: PartialExperimentConfig,
): ExperimentConfig {
  return parseExperimentConfig(partial);
}
