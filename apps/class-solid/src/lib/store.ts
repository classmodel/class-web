import { createStore, produce, unwrap } from "solid-js/store";

import type { ClassOutput } from "@classmodel/class/runner";
import {
  type PartialConfig,
  parseExperimentConfig,
} from "@classmodel/class/validate";
import type { Analysis } from "~/components/Analysis";
import { runClass } from "./runner";

export interface Permutation<C extends PartialConfig = PartialConfig> {
  name: string;
  config: C;
  output?: ClassOutput | undefined;
  // TODO Could use per run state to show progress of run of reference and each permutation
  // running: boolean;
}

export interface Experiment {
  name: string;
  description: string;
  reference: {
    config: PartialConfig;
    output?: ClassOutput | undefined;
  };
  permutations: Permutation[];
  running: boolean;
}

export const [experiments, setExperiments] = createStore<Experiment[]>([]);
export const [analyses, setAnalyses] = createStore<Analysis[]>([]);

// biome-ignore lint/suspicious/noExplicitAny: recursion is hard to type
function mergeConfigurations(reference: any, permutation: any) {
  const merged = { ...reference };

  for (const key in permutation) {
    if (
      permutation[key] &&
      typeof permutation[key] === "object" &&
      !Array.isArray(permutation[key])
    ) {
      merged[key] = mergeConfigurations(reference[key], permutation[key]);
    } else {
      merged[key] = permutation[key];
    }
  }

  return merged;
}

export async function runExperiment(id: number) {
  const exp = findExperiment(id);

  setExperiments(
    id,
    produce((e) => {
      e.running = true;
    }),
  );

  // TODO make lazy, if config does not change do not rerun
  // or make more specific like runReference and runPermutation

  // Run reference
  const newOutput = await runClass(exp.reference.config);

  setExperiments(
    id,
    produce((e) => {
      e.reference.output = newOutput;
    }),
  );

  // Run permutations
  for (const key in exp.permutations) {
    const perm = exp.permutations[key];
    const combinedConfig = mergeConfigurations(
      exp.reference.config,
      perm.config,
    );
    const newOutput = await runClass(combinedConfig);

    setExperiments(
      id,
      produce((e) => {
        e.permutations[key].output = newOutput;
      }),
    );
  }

  setExperiments(
    id,
    produce((e) => {
      e.running = false;
    }),
  );
}

function findExperiment(index: number) {
  const expProxy = experiments[index];
  if (!expProxy) {
    throw new Error(`No experiment with index ${index}`);
  }
  const exp = unwrap(expProxy);
  return exp;
}

export async function addExperiment(
  config: PartialConfig = {},
  name?: string,
  description?: string,
) {
  const newExperiment: Experiment = {
    name: name ?? `My experiment ${experiments.length}`,
    description: description ?? "Standard experiment",
    reference: {
      config,
    },
    permutations: [],
    running: false,
  };
  setExperiments(experiments.length, newExperiment);
  await runExperiment(experiments.length - 1);
}

export function uploadExperiment(rawData: unknown) {
  const upload = parseExperimentConfig(rawData);
  const experiment: Experiment = {
    name: upload.name, // TODO check name is not already used
    description: upload.description ?? "",
    reference: {
      config: upload.reference,
    },
    permutations: upload.permutations,
    running: false,
  };
  setExperiments(experiments.length, experiment);
}

export function duplicateExperiment(id: number) {
  const original = structuredClone(findExperiment(id));

  addExperiment(original.reference.config, `Copy of ${original.name}`, original.description);
  let key = 0;
  for (const perm of original.permutations) {
    setPermutationConfigInExperiment(
      experiments.length - 1,
      key++,
      perm.config,
      perm.name,
    );
  }
  runExperiment(experiments.length - 1);
}

export function deleteExperiment(index: number) {
  setExperiments(experiments.filter((_, i) => i !== index));
}

export async function modifyExperiment(
  index: number,
  newConfig: PartialConfig,
  name: string,
  description: string,
) {
  setExperiments(index, "reference", "config", newConfig);
  setExperiments(index, (exp) => ({
    ...exp,
    name,
    description,
  }));
  await runExperiment(index);
}

export async function setPermutationConfigInExperiment(
  experimentIndex: number,
  permutationIndex: number,
  config: PartialConfig,
  name: string,
) {
  setExperiments(
    experimentIndex,
    "permutations",
    permutationIndex === -1
      ? findExperiment(experimentIndex).permutations.length
      : permutationIndex,
    { config, name },
  );
  await runExperiment(experimentIndex);
}

export async function deletePermutationFromExperiment(
  experimentIndex: number,
  permutationIndex: number,
) {
  setExperiments(experimentIndex, "permutations", (perms) =>
    perms.filter((_, i) => i !== permutationIndex),
  );
}

export function findPermutation(exp: Experiment, permutationName: string) {
  const perm = exp.permutations.find((perm) => perm.name === permutationName);
  if (!perm) {
    throw new Error(`No permutation with name ${permutationName}`);
  }
  return perm;
}

export function promotePermutationToExperiment(
  experimentIndex: number,
  permutationIndex: number,
) {
  const exp = findExperiment(experimentIndex);
  const perm = exp.permutations[permutationIndex];

  const combinedConfig = mergeConfigurations(exp.reference.config, perm.config);
  addExperiment(combinedConfig, perm.name);
  // TODO dont show form of new experiment, just show the new card
}

export function duplicatePermutation(
  experimentIndex: number,
  permutationIndex: number,
) {
  const exp = findExperiment(experimentIndex);
  const perm = exp.permutations[permutationIndex];
  setPermutationConfigInExperiment(
    experimentIndex,
    -1,
    structuredClone(perm.config),
    `Copy of ${perm.name}`,
  );
}

export function swapPermutationAndReferenceConfiguration(
  experimentIndex: number,
  permutationIndex: number,
) {
  const exp = findExperiment(experimentIndex);
  const refConfig = structuredClone(exp.reference.config);
  const perm = exp.permutations[permutationIndex];
  const permConfig = structuredClone(perm.config);

  setExperiments(experimentIndex, "reference", "config", permConfig);
  setExperiments(
    experimentIndex,
    "permutations",
    permutationIndex,
    "config",
    refConfig,
  );
  // TODO should names also be swapped?
  runExperiment(experimentIndex);
}
