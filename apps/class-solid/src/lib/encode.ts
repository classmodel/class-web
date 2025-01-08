import { parse, pruneConfig } from "@classmodel/class/validate";
import { unwrap } from "solid-js/store";
import { findPresetConfigByName } from "./presets";
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
    experiments: rawExperiments.map((exp) => {
      const preset = findPresetConfigByName(exp.preset);
      const reference = pruneConfig(exp.reference.config, preset);
      return {
        name: exp.name,
        description: exp.description,
        reference,
        preset: exp.preset,
        permutations: Object.fromEntries(
          exp.permutations.map((perm) => {
            return [
              perm.name,
              pruneConfig(perm.config, exp.reference.config, preset),
            ];
          }),
        ),
      };
    }),
  };
  console.log(JSON.stringify(minimizedState, undefined, 2));
  return encodeURI(JSON.stringify(minimizedState, undefined, 0));
}
