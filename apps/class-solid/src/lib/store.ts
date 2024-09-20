import { type ClassConfig, classConfig } from "@classmodel/class/config";
import type { ClassOutput } from "@classmodel/class/runner";
import { createStore, produce, unwrap } from "solid-js/store";
import { z } from "zod";
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
  const exp = findExperiment(id);

  setExperiments(
    (e) => e.id === exp.id,
    produce((e) => {
      e.running = true;
    }),
  );

  // TODO make lazy, if config does not change do not rerun
  // or make more specific like runReference and runPermutation

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

function findExperiment(id: string) {
  const expProxy = experiments.find((exp) => exp.id === id);
  if (!expProxy) {
    throw new Error(`No experiment with id ${id}`);
  }
  const exp = unwrap(expProxy);
  return exp;
}

export function addExperiment(config: Partial<ClassConfig> = {}) {
  const id = bumpLastExperimentId();
  const newExperiment: Experiment = {
    name: `My experiment ${id}`,
    description: "Standard experiment",
    id,
    reference: {
      config,
    },
    permutations: {},
    running: false,
  };
  setExperiments(experiments.length, newExperiment);
  return newExperiment;
}

const ExperimentConfigSchema = z.object({
  name: z.string(),
  description: z.string().default("Standard experiment"),
  reference: classConfig.partial(),
  permutations: z.record(classConfig.partial()),
});
export type ExperimentConfigSchema = z.infer<typeof ExperimentConfigSchema>;

export function uploadExperiment(rawData: unknown) {
  const upload = ExperimentConfigSchema.parse(rawData);
  const id = bumpLastExperimentId();
  const experiment: Experiment = {
    name: upload.name, // TODO check name is not already used
    description: upload.description,
    id,
    reference: {
      config: upload.reference,
    },
    permutations: Object.fromEntries(
      Object.entries(upload.permutations).map(([key, config]) => [
        key,
        { config },
      ]),
    ),
    running: false,
  };
  setExperiments(experiments.length, experiment);
  // TODO dont trigger opening of form of reference configuration
}

export function duplicateExperiment(id: string) {
  const original = unwrap(experiments.find((e) => e.id === id));
  if (!original) {
    throw new Error("No experiment with id {id}");
  }

  const newExperiment = addExperiment({ ...original.reference.config });
  for (const key in original.permutations) {
    setPermutationConfigInExperiment(
      newExperiment.id,
      key,
      original.permutations[key].config,
    );
  }
  runExperiment(newExperiment.id);
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
    permutationName,
    // @ts-ignore thats how you delete a key in solid see https://docs.solidjs.com/reference/store-utilities/create-store#setter
    undefined,
  );
}

export function promotePermutationToExperiment(
  experimentId: string,
  permutationName: string,
) {
  const exp = findExperiment(experimentId);
  const combinedConfig = mergeConfigurations(
    exp.reference.config,
    exp.permutations[permutationName].config,
  );
  addExperiment(combinedConfig);
  // TODO dont show form of new experiment, just show the new card
}
