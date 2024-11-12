import { parse, pruneDefaults } from "@classmodel/class/validate";
import { unwrap } from "solid-js/store";
import type { Analysis, Experiment } from "./store";

export function decodeAppState(encoded: string): [Experiment[], Analysis[]] {
  const decoded = decodeURI(encoded);
  const parsed = JSON.parse(decoded);
  // TODO use ajv to validate experiment, permutation, and analysis
  // now only config is validated
  const experiments: Experiment[] = parsed.experiments.map(
    (exp: {
      name: string;
      description: string;
      reference: unknown;
      permutations: Record<string, unknown>;
    }) => ({
      name: exp.name,
      description: exp.description,
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
    experiments: rawExperiments.map((exp) => ({
      name: exp.name,
      description: exp.description,
      reference: pruneDefaults(exp.reference.config),
      permutations: Object.fromEntries(
        exp.permutations.map((perm) => [
          perm.name,
          // TODO if reference.var and prem.var are the same also remove prem.var
          pruneDefaults(perm.config),
        ]),
      ),
    })),
  };
  return encodeURI(JSON.stringify(minimizedState, undefined, 0));
}
