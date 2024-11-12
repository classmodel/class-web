import { createStore, produce, unwrap } from "solid-js/store";

import type { ClassOutput } from "@classmodel/class/runner";
import {
  type PartialConfig,
  parseExperimentConfig,
  pruneDefaults,
} from "@classmodel/class/validate";
import { createUniqueId } from "solid-js";
import { decodeAppState } from "./encode";
import { runClass } from "./runner";

export interface Permutation<C extends PartialConfig = PartialConfig> {
  name: string;
  config: C;
  // TODO Could use per run state to show progress of run of reference and each permutation
  // running: boolean;
}

export interface Experiment {
  name: string;
  description: string;
  reference: {
    // TODO change reference.config to config, as there are no other keys in reference
    config: PartialConfig;
  };
  permutations: Permutation[];
  running: number | false;
}

export const [experiments, setExperiments] = createStore<Experiment[]>([]);
export const [analyses, setAnalyses] = createStore<Analysis[]>([]);

interface ExperimentOutput {
  reference: ClassOutput;
  permutations: ClassOutput[];
}

// Outputs must store outside store as they are too big to wrap in proxy
export const outputs: ExperimentOutput[] = [];

export function outputForExperiment(
  index: number | Experiment,
): ExperimentOutput | undefined {
  if (typeof index === "object") {
    const i = experiments.indexOf(index);
    return outputs[i];
  }
  return outputs[index];
}

export function outputForPermutation(
  experiment: ExperimentOutput | undefined,
  permutationIndex: number,
) {
  if (!experiment || experiment.permutations.length <= permutationIndex) {
    return { t: [], h: [], theta: [], dtheta: [] };
  }
  return experiment.permutations[permutationIndex];
}

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
  const exp = experiments[id];

  setExperiments(id, "running", 0);

  // TODO make lazy, if config does not change do not rerun
  // or make more specific like runReference and runPermutation

  // Run reference
  const referenceConfig = unwrap(exp.reference.config);
  const newOutput = await runClass(referenceConfig);

  outputs[id] = {
    reference: newOutput,
    permutations: [],
  };

  // Run permutations
  let permCounter = 0;
  for (const proxiedPerm of exp.permutations) {
    const permConfig = unwrap(proxiedPerm.config);
    const combinedConfig = mergeConfigurations(referenceConfig, permConfig);
    const newOutput = await runClass(combinedConfig);
    outputs[id].permutations[permCounter] = newOutput;
    permCounter++;
  }

  setExperiments(id, "running", false);

  // If no analyis are set then add all of them
  if (analyses.length === 0) {
    for (const key of Object.keys(analysisNames) as AnalysisType[]) {
      addAnalysis(key);
    }
  }
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

export async function uploadExperiment(rawData: unknown) {
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
  await runExperiment(experiments.length - 1);
}

export function duplicateExperiment(id: number) {
  const original = structuredClone(findExperiment(id));

  const newExperiment = {
    ...original,
    name: `Copy of ${original.name}`,
    description: original.description,
    running: 0,
  };
  setExperiments(experiments.length, newExperiment);
  runExperiment(experiments.length - 1);
}

export function deleteExperiment(index: number) {
  setExperiments(experiments.filter((_, i) => i !== index));
  outputs.splice(index, 1);
}

export async function modifyExperiment(
  index: number,
  newConfig: PartialConfig,
  name: string,
  description: string,
) {
  setExperiments(
    index,
    produce((e) => {
      e.reference.config = newConfig;
      e.name = name;
      e.description = description;
      e.permutations = e.permutations.map((perm) => {
        const config = mergeConfigurations(
          newConfig,
          pruneDefaults(perm.config),
        );
        return {
          ...perm,
          config,
        };
      });
    }),
  );
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
  outputs[experimentIndex].permutations.splice(permutationIndex, 1);
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

  const newConfig = structuredClone(perm.config);
  addExperiment(newConfig, perm.name, "");
  // TODO should permutation be removed from original experiment?
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
  runExperiment(experimentIndex);
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

export async function loadStateFromString(rawState: string): Promise<void> {
  const [loadedExperiments, loadedAnalyses] = decodeAppState(rawState);
  setExperiments(loadedExperiments);
  await Promise.all(loadedExperiments.map((_, i) => runExperiment(i)));
}

const analysisNames = {
  profiles: "Vertical profiles",
  timeseries: "Timeseries",
  finalheight: "Final height",
} as const;
type AnalysisType = keyof typeof analysisNames;

export interface Analysis {
  name: string;
  description: string;
  id: string;
  experiments: Experiment[] | undefined;
  type: AnalysisType;
}

export function addAnalysis(type: AnalysisType) {
  const name = analysisNames[type];

  setAnalyses(analyses.length, {
    name,
    id: createUniqueId(),
    experiments: experiments,
    type,
  });
}

export function deleteAnalysis(analysis: Analysis) {
  setAnalyses(analyses.filter((ana) => ana.id !== analysis.id));
}
