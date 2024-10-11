import {
  type ExperimentConfigSchema,
  type PartialConfig,
  parseExperimentConfig,
} from "@classmodel/class/validate";
import type { Experiment } from "./store";

/**
 * URL safe representation of an experiment
 *
 * @param experiment
 * @returns
 */
export function encodeExperiment(experiment: Experiment) {
  const minimizedExperiment = {
    n: experiment.name,
    d: experiment.description,
    r: experiment.reference.config,
    p: experiment.permutations.map((perm) => ({
      n: perm.name,
      c: perm.config,
    })),
  };
  return encodeURIComponent(JSON.stringify(minimizedExperiment, undefined, 0));
}

/**
 * Decode an experiment config from a URL safe string
 *
 * @param encoded
 * @returns
 *
 */
export function decodeExperiment(encoded: string): ExperimentConfigSchema {
  const decoded = JSON.parse(decodeURIComponent(encoded));
  const rawExperiment = {
    name: decoded.n,
    description: decoded.d,
    reference: decoded.r,
    permutations: decoded.p.map((perm: { n: string; c: PartialConfig }) => ({
      name: perm.n,
      config: perm.c,
    })),
  };
  return parseExperimentConfig(rawExperiment);
}
