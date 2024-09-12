import type { ClassConfig } from "@classmodel/class/config";
import type { ClassOutput } from "@classmodel/class/runner";
import { createStore, produce, unwrap } from "solid-js/store";
import type { Analysis } from "~/components/Analysis";
import { runClass } from "./runner";

export interface Permutation<
  C extends Partial<ClassConfig> = Partial<ClassConfig>,
> {
  config: C;
  output?: ClassOutput | undefined;
  // TODO Could use per run state to show progress of run of reference and each permutation
  // running: boolean;
}

export interface Experiment {
  name: string;
  description: string;
  id: string;
  // TODO make config of reference a full ClassConfig,
  // will need refactoring of add and run experiment
  reference: Permutation;
  permutations: Record<string, Permutation>;
  running: boolean;
}

let lastExperimentId = 0;

function bumpLastExperimentId(): string {
  lastExperimentId++;
  return lastExperimentId.toString();
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

export async function runExperiment(id: string) {
  const expProxy = experiments.find((exp) => exp.id === id);
  if (!expProxy) {
    throw new Error(`No experiment with id ${id}`);
  }
  const exp = unwrap(expProxy);

  setExperiments(
    (e) => e.id === exp.id,
    produce((e) => {
      e.running = true;
    }),
  );

  // TODO make lazy, if config does not change do not rerun

  // Run reference
  const newOutput = await runClass(exp.reference.config);

  setExperiments(
    (e) => e.id === exp.id,
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
      (e) => e.id === exp.id,
      produce((e) => {
        e.permutations[key].output = newOutput;
      }),
    );
  }

  setExperiments(
    (e) => e.id === exp.id,
    produce((e) => {
      e.running = false;
    }),
  );
}

export function addExperiment(config: Partial<ClassConfig> = {}) {
  const id = bumpLastExperimentId();
  const newExperiment: Experiment = {
    name: `My experiment ${id}`,
    description: "Standard experiment",
    id: id.toString(),
    reference: {
      config,
    },
    permutations: {},
    running: false,
  };
  setExperiments(experiments.length, newExperiment);
  return newExperiment;
}

export function duplicateExperiment(id: string) {
  const original = unwrap(experiments.find((e) => e.id === id));
  if (!original) {
    throw new Error("No experiment with id {id}");
  }

  addExperiment({ ...original.reference.config });
}

export function deleteExperiment(id: string) {
  setExperiments(experiments.filter((exp) => exp.id !== id));
}

export async function modifyExperiment(
  id: string,
  newConfig: Partial<ClassConfig>,
) {
  setExperiments((exp, i) => exp.id === id, "reference", "config", newConfig);
  await runExperiment(id);
}

export function setExperimentName(id: string, newName: string) {
  setExperiments((exp) => exp.id === id, "name", newName);
}

export function setExperimentDescription(id: string, newDescription: string) {
  setExperiments((exp) => exp.id === id, "description", newDescription);
}

export async function setPermutationConfigInExperiment(
  experimentId: string,
  permutationName: string,
  config: Partial<ClassConfig>,
) {
  setExperiments(
    (exp) => exp.id === experimentId,
    "permutations",
    permutationName,
    { config },
  );
  await runExperiment(experimentId);
}

export async function deletePermutationFromExperiment(
  experimentId: string,
  permutationName: string,
) {
  setExperiments(
    (exp) => exp.id === experimentId,
    "permutations",
    (permutations) => {
      const { [permutationName]: toDelete, ...newPermutations } = permutations;
      return newPermutations;
    },
  );
  await runExperiment(experimentId);
  // TODO after delete experiment is still shown unchanged
}
