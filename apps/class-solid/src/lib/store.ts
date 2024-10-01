import { createStore, produce, unwrap } from "solid-js/store";

import type { ClassOutput } from "@classmodel/class/runner";
import type { PartialConfig } from "@classmodel/class/validate";
import type { Analysis } from "~/components/Analysis";
import {
  type NamedConfig,
  parseExperimentConfig,
} from "~/components/NamedConfig";
import { runClass } from "./runner";

export interface Permutation extends NamedConfig {
  output?: ClassOutput | undefined;
}

export interface Experiment {
  reference: Permutation;
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

function stripNames(perm: Permutation): PartialConfig {
  const { title, description, ...config } = perm;
  return config;
}

export function stripOutput(perm: Permutation): NamedConfig {
  const { output: _, ...config } = perm;
  return config;
}

export function stripOutputAndNames(perm: Permutation): PartialConfig {
  return stripNames(stripOutput(perm));
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
  const refConfig = stripOutputAndNames(exp.reference);
  const newOutput = await runClass(refConfig);

  setExperiments(
    id,
    produce((e) => {
      e.reference.output = newOutput;
    }),
  );

  // Run permutations
  for (const key in exp.permutations) {
    const perm = exp.permutations[key];
    const combinedConfig = mergeConfigurations(exp.reference, perm);
    const newOutput = await runClass(stripOutputAndNames(combinedConfig));

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

export async function addExperiment(config: NamedConfig) {
  console.log(JSON.stringify(config, null, 2));
  const newExperiment: Experiment = {
    reference: config,
    permutations: [],
    running: false,
  };
  setExperiments(experiments.length, newExperiment);
  await runExperiment(experiments.length - 1);
}

export function uploadExperiment(rawData: unknown) {
  const upload = parseExperimentConfig(rawData);
  const experiment: Experiment = {
    ...upload,
    running: false,
  };
  setExperiments(experiments.length, experiment);
}

export function duplicateExperiment(id: number) {
  const original = findExperiment(id);
  if (!original) {
    throw new Error("No experiment with id {id}");
  }

  const newExperiment = structuredClone(original.reference);
  newExperiment.title = `Copy of ${original.reference.title}`;
  addExperiment(newExperiment);
  let key = 0;
  for (const perm of original.permutations) {
    const newPermutation = structuredClone(perm);
    setPermutationConfigInExperiment(
      experiments.length - 1,
      key++,
      newPermutation,
    );
  }
  runExperiment(experiments.length - 1);
}

export function deleteExperiment(index: number) {
  setExperiments(experiments.filter((_, i) => i !== index));
}

export async function modifyExperiment(index: number, newConfig: NamedConfig) {
  setExperiments(index, "reference", newConfig);
  await runExperiment(index);
}

export async function setPermutationConfigInExperiment(
  experimentIndex: number,
  permutationIndex: number,
  config: NamedConfig,
) {
  setExperiments(
    experimentIndex,
    "permutations",
    permutationIndex === -1
      ? findExperiment(experimentIndex).permutations.length
      : permutationIndex,
    config,
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
  const perm = exp.permutations.find((perm) => perm.title === permutationName);
  if (!perm) {
    throw new Error(`No permutation with title ${permutationName}`);
  }
  return perm;
}

export function promotePermutationToExperiment(
  experimentIndex: number,
  permutationIndex: number,
) {
  const exp = findExperiment(experimentIndex);
  const perm = exp.permutations[permutationIndex];

  const combinedConfig = mergeConfigurations(exp.reference, perm);
  combinedConfig.title = perm.title;
  combinedConfig.description = perm.description;
  addExperiment(combinedConfig);
  // TODO dont show form of new experiment, just show the new card
}

export function duplicatePermutation(
  experimentIndex: number,
  permutationIndex: number,
) {
  const exp = findExperiment(experimentIndex);
  const perm = structuredClone(exp.permutations[permutationIndex]);
  perm.title = `Copy of ${perm.title}`;
  setPermutationConfigInExperiment(experimentIndex, -1, perm);
}

export function swapPermutationAndReferenceConfiguration(
  experimentIndex: number,
  permutationIndex: number,
) {
  const exp = findExperiment(experimentIndex);
  const refConfig = structuredClone(exp.reference);
  const perm = exp.permutations[permutationIndex];
  const permConfig = structuredClone(perm);

  setExperiments(experimentIndex, "reference", permConfig);
  setExperiments(experimentIndex, "permutations", permutationIndex, refConfig);
  runExperiment(experimentIndex);
}
