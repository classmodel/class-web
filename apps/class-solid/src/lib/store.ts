import { type ClassConfig, classConfig } from "@classmodel/class/config";
import type { ClassOutput } from "@classmodel/class/runner";
import { createStore, produce, unwrap } from "solid-js/store";
import { z } from "zod";
import type { Analysis } from "~/components/Analysis";
import { runClass } from "./runner";

export interface Permutation<
  C extends Partial<ClassConfig> = Partial<ClassConfig>,
> {
  name: string;
  config: C;
  output?: ClassOutput | undefined;
  // TODO Could use per run state to show progress of run of reference and each permutation
  // running: boolean;
}

export interface Experiment {
  name: string;
  description: string;
  id: string;
  reference: {
    config: Partial<ClassConfig>;
    output?: ClassOutput | undefined;
  };
  permutations: Permutation[];
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

export function addExperiment(
  config: Partial<ClassConfig> = {},
  name?: string,
) {
  const id = bumpLastExperimentId();
  const newExperiment: Experiment = {
    name: name ?? `My experiment ${id}`,
    description: "Standard experiment",
    id,
    reference: {
      config,
    },
    permutations: [],
    running: false,
  };
  setExperiments(experiments.length, newExperiment);
  return newExperiment;
}

const ExperimentConfigSchema = z.object({
  name: z.string(),
  description: z.string().default("Standard experiment"),
  reference: classConfig.partial(),
  permutations: z.array(
    z.object({
      config: classConfig.partial(),
      name: z.string(),
    }),
  ),
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
    permutations: upload.permutations.map(({ name, config }) => {
      return { name, config };
    }),
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

  const newExperiment = addExperiment(
    { ...original.reference.config },
    `Copy of ${original.name}`,
  );
  let key = 0;
  for (const perm of original.permutations) {
    setPermutationConfigInExperiment(
      newExperiment.id,
      key++,
      perm.config,
      perm.name,
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
  permutationIndex: number,
  config: Partial<ClassConfig>,
  name: string,
) {
  setExperiments(
    (exp) => exp.id === experimentId,
    "permutations",
    permutationIndex === -1
      ? findExperiment(experimentId).permutations.length
      : permutationIndex,
    { config, name },
  );
  await runExperiment(experimentId);
}

export async function deletePermutationFromExperiment(
  experimentId: string,
  permutationIndex: number,
) {
  setExperiments(
    (exp) => exp.id === experimentId,
    "permutations",
    permutationIndex,
    // @ts-ignore thats how you delete a key in solid see https://docs.solidjs.com/reference/store-utilities/create-store#setter
    undefined,
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
  experimentId: string,
  permutationIndex: number,
) {
  const exp = findExperiment(experimentId);
  const perm = exp.permutations[permutationIndex];

  const combinedConfig = mergeConfigurations(exp.reference.config, perm.config);
  addExperiment(combinedConfig, perm.name);
  // TODO dont show form of new experiment, just show the new card
}
