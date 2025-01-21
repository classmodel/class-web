import { createUniqueId } from "solid-js";
import { createStore, produce, unwrap } from "solid-js/store";

import type { Config } from "@classmodel/class/config";
import type { ClassOutput } from "@classmodel/class/runner";

import {
  mergeConfigurations,
  pruneConfig,
} from "@classmodel/class/config_utils";
import { decodeAppState } from "./encode";
import { parseExperimentConfig } from "./experiment_config";
import type { ExperimentConfig } from "./experiment_config";
import { findPresetByName } from "./presets";
import { runClass } from "./runner";

interface ExperimentOutput {
  reference?: ClassOutput;
  permutations: Array<ClassOutput | undefined>;
  running: number | false;
}

export type Experiment = {
  config: ExperimentConfig;
  output: ExperimentOutput;
};

export const [experiments, setExperiments] = createStore<Experiment[]>([]);
export const [analyses, setAnalyses] = createStore<Analysis[]>([]);

export async function runExperiment(id: number) {
  const exp = experiments[id];

  setExperiments(id, "output", "running", 0.0001);

  // TODO make lazy, if config does not change do not rerun
  // or make more specific like runReference and runPermutation

  // Run reference
  const referenceConfig = unwrap(exp.config.reference);
  const newOutput = await runClass(referenceConfig);

  setExperiments(id, "output", "reference", newOutput);

  // Run permutations
  let permCounter = 0;
  for (const proxiedPerm of exp.config.permutations) {
    const permConfig = unwrap(proxiedPerm);
    const combinedConfig = mergeConfigurations(
      referenceConfig,
      permConfig,
    ) as Config;
    const newOutput = await runClass(combinedConfig);
    setExperiments(id, "output", "permutations", permCounter, newOutput);
    permCounter++;
  }

  setExperiments(id, "output", "running", false);

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

export async function addExperiment(reference: Config) {
  const newExperiment: Experiment = {
    config: {
      preset: "Default",
      reference,
      permutations: [],
    },
    output: {
      permutations: [],
      running: false,
    },
  };
  setExperiments(experiments.length, newExperiment);
  await runExperiment(experiments.length - 1);
}

export async function uploadExperiment(rawData: unknown) {
  const defaultPreset = findPresetByName();
  const upload = parseExperimentConfig(rawData);
  const experiment: Experiment = {
    config: {
      preset: upload.preset ?? defaultPreset.config.name,
      reference: upload.reference,
      permutations: upload.permutations,
    },
    output: {
      permutations: [],
      running: false,
    },
  };
  setExperiments(experiments.length, experiment);
  await runExperiment(experiments.length - 1);
}

export function duplicateExperiment(id: number) {
  const config = structuredClone(findExperiment(id).config);
  config.reference.name = `Copy of ${config.reference.name}`;
  const newExperiment: Experiment = {
    config: config,
    output: {
      reference: undefined,
      permutations: [],
      running: false,
    },
  };

  setExperiments(experiments.length, newExperiment);
  runExperiment(experiments.length - 1);
}

export function deleteExperiment(index: number) {
  setExperiments(experiments.filter((_, i) => i !== index));
}

export async function modifyExperiment(index: number, newConfig: Config) {
  setExperiments(
    index,
    "config",
    produce((e) => {
      const oldConfig = unwrap(e.reference);
      e.reference = newConfig;
      e.permutations = e.permutations.map((perm) => {
        const oldPermConfig = unwrap(perm);
        const permPrunedConfig = pruneConfig(oldPermConfig, oldConfig);
        return mergeConfigurations(newConfig, permPrunedConfig);
      });
    }),
  );
  await runExperiment(index);
}

export async function setPermutationConfigInExperiment(
  experimentIndex: number,
  permutationIndex: number, // use -1 to add a permutation
  config: Config,
) {
  setExperiments(
    experimentIndex,
    "config",
    "permutations",
    permutationIndex === -1
      ? findExperiment(experimentIndex).config.permutations.length
      : permutationIndex,
    config,
  );
  await runExperiment(experimentIndex);
}

export async function deletePermutationFromExperiment(
  experimentIndex: number,
  permutationIndex: number,
) {
  setExperiments(experimentIndex, "config", "permutations", (perms) =>
    perms.filter((_, i) => i !== permutationIndex),
  );
}

export function findPermutation(exp: Experiment, permutationName: string) {
  const perm = exp.config.permutations.find(
    (perm) => perm.name === permutationName,
  );
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
  const perm = exp.config.permutations[permutationIndex];

  const newConfig = structuredClone(perm);
  addExperiment(newConfig);
  // TODO should permutation be removed from original experiment?
}

export function duplicatePermutation(
  experimentIndex: number,
  permutationIndex: number,
) {
  const exp = findExperiment(experimentIndex);
  const perm = structuredClone(exp.config.permutations[permutationIndex]);
  perm.name = `Copy of ${perm.name}`;
  setPermutationConfigInExperiment(experimentIndex, -1, perm);
  runExperiment(experimentIndex);
}

export function swapPermutationAndReferenceConfiguration(
  experimentIndex: number,
  permutationIndex: number,
) {
  const exp = findExperiment(experimentIndex);
  const refConfig = structuredClone(exp.config.reference);
  const perm = exp.config.permutations[permutationIndex];
  const permConfig = structuredClone(perm);

  setExperiments(experimentIndex, "config", "reference", permConfig);
  setExperiments(
    experimentIndex,
    "config",
    "permutations",
    permutationIndex,
    refConfig,
  );
  // TODO should names also be swapped?

  // TODO update all other permutations?
  // As they are full configs which where based on the reference

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
