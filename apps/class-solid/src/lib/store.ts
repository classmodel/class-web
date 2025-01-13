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
  output?: ClassOutput | undefined;
  // TODO Could use per run state to show progress of run of reference and each permutation
  // running: boolean;
}

export interface Experiment {
  name: string;
  description: string;
  reference: {
    // TODO change reference.config to config, as there are no other keys in reference
    config: PartialConfig;
    output?: ClassOutput | undefined;
  };
  permutations: Permutation[];
  running: number | false;
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
  const exp = experiments[id];

  setExperiments(id, "running", 0.0001);

  // TODO make lazy, if config does not change do not rerun
  // or make more specific like runReference and runPermutation

  // Run reference
  const referenceConfig = unwrap(exp.reference.config);
  const newOutput = await runClass(referenceConfig);

  setExperiments(id, "reference", "output", newOutput);

  // Run permutations
  let permCounter = 0;
  for (const proxiedPerm of exp.permutations) {
    const permConfig = unwrap(proxiedPerm.config);
    const combinedConfig = mergeConfigurations(referenceConfig, permConfig);
    const newOutput = await runClass(combinedConfig);
    setExperiments(id, "permutations", permCounter, "output", newOutput);
    permCounter++;
  }

  setExperiments(id, "running", false);

  // If no analyis are set then add all of them
  if (analyses.length === 0) {
    for (const name of analysisNames) {
      addAnalysis(name);
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

export interface Analysis {
  id: string;
  description: string;
  type: string;
  name: string;
}

export type TimeseriesAnalysis = Analysis & {
  xVariable: string;
  yVariable: string;
};

export type ProfilesAnalysis = Analysis & {
  variable: string;
  time: number;
};

export type SkewTAnalysis = Analysis & {
  time: number;
};

export type AnalysisType =
  | TimeseriesAnalysis
  | ProfilesAnalysis
  | SkewTAnalysis;
export const analysisNames = [
  "Vertical profiles",
  "Timeseries",
  "Thermodynamic diagram",
];

export function addAnalysis(name: string) {
  let newAnalysis: Analysis;

  switch (name) {
    case "Timeseries":
      newAnalysis = {
        id: createUniqueId(),
        description: "",
        type: "timeseries",
        name: "Timeseries",
        xVariable: "t",
        yVariable: "h",
      } as TimeseriesAnalysis;
      break;
    case "Vertical profiles":
      newAnalysis = {
        id: createUniqueId(),
        description: "",
        type: "profiles",
        name: "Vertical profiles",
        variable: "Potential temperature [K]",
        time: Number.POSITIVE_INFINITY,
      } as ProfilesAnalysis;
      break;
    case "Thermodynamic diagram":
      newAnalysis = {
        id: createUniqueId(),
        description: "",
        type: "skewT",
        name: "Thermodynamic diagram",
        time: Number.POSITIVE_INFINITY,
      } as SkewTAnalysis;
      break;
    default:
      throw new Error(`Unknown analysis type: ${name}`);
  }

  setAnalyses(analyses.length, newAnalysis);
}

export function deleteAnalysis(analysis: Analysis) {
  setAnalyses(analyses.filter((ana) => ana.id !== analysis.id));
}

export function updateAnalysis(analysis: Analysis, newData: object) {
  setAnalyses(
    produce((analyses) => {
      const currentAnalysis = analyses.find((a) => a.id === analysis.id);
      if (currentAnalysis) {
        Object.assign(currentAnalysis, newData);
      }
    }),
  );
}
