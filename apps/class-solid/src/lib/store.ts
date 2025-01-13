import { createUniqueId } from "solid-js";
import { createStore, produce, unwrap } from "solid-js/store";

import type { Config } from "@classmodel/class/config";
import type { ClassOutput } from "@classmodel/class/runner";

import { decodeAppState, parseExperimentConfig } from "./encode";
import {
  type ExperimentConfig,
  mergeConfigurations,
  pruneConfig,
} from "./experiment_config";
import { findPresetByName } from "./presets";
import { runClass } from "./runner";

interface ExperimentOutput {
  reference: ClassOutput;
  permutations: ClassOutput[];
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
    const combinedConfig = mergeConfigurations(referenceConfig, permConfig);
    const newOutput = await runClass(combinedConfig);
    setExperiments(id, "output", "permutations", permCounter, newOutput);
    permCounter++;
  }

  setExperiments(id, "output", "running", false);

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

export async function addExperiment(config: Config) {
  const newExperiment: Experiment = {
    config: {
      preset: "Default",
      reference: {
        ...config,
        name: config.name ?? `My experiment ${experiments.length}`,
        description: config.description ?? "Standard experiment",
      },
      permutations: [],
    },
    output: {
      reference: {},
      permutations: [],
      running: false,
    },
  };
  setExperiments(experiments.length, newExperiment);
  await runExperiment(experiments.length - 1);
}

export async function uploadExperiment(rawData: unknown) {
  const preset = findPresetByName();
  const upload = parseExperimentConfig(rawData);
  const experiment: Experiment = {
    config: {
      preset: upload.preset,
      reference: upload.reference,
      permutations: upload.permutations,
    },
    output: {
      reference: {},
      permutations: [],
      running: false,
    },
  };
  setExperiments(experiments.length, experiment);
  await runExperiment(experiments.length - 1);
}

export function duplicateExperiment(id: number) {
  const original = structuredClone(findExperiment(id));

  const newExperiment = {
    ...original,
    name: `Copy of ${original.config.reference.name}`,
    description: original.config.reference.description,
    running: 0,
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
      const oldConfig = e.reference;
      e.reference = newConfig;
      e.permutations = e.permutations.map((perm) => {
        const permPrunedConfig = pruneConfig(unwrap(perm), unwrap(oldConfig));
        const config = mergeConfigurations(newConfig, permPrunedConfig);
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

export const analysisNames = {
  profiles: "Vertical profiles",
  timeseries: "Timeseries",
  skewT: "Thermodynamic diagram",
  // finalheight: "Final height",  // keep for development but not in production
} as const;
export type AnalysisType = keyof typeof analysisNames;

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
