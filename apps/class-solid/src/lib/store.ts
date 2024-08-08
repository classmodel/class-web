import type { ClassConfig } from "@classmodel/class/config";
import { classConfig } from "@classmodel/class/config";
import type { ClassOutput } from "@classmodel/class/runner";
import { createStore, unwrap } from "solid-js/store";
import type { Analysis } from "~/components/Analysis";
import { runClass } from "./runner";

export interface Experiment {
  name: string;
  description: string;
  id: string;
  config: ClassConfig;
  output: ClassOutput | undefined;
}

let lastExperimentId = 0;

function bumpLastExperimentId(): string {
  lastExperimentId++;
  return lastExperimentId.toString();
}

export const [experiments, setExperiments] = createStore<Experiment[]>([]);
export const [analyses, setAnalyses] = createStore<Analysis[]>([]);

export async function runExperiment(id: string) {
  const expProxy = experiments.find((exp) => exp.id === id);
  if (!expProxy) {
    throw new Error(`No experiment with id ${id}`);
  }
  const exp = unwrap(expProxy);
  const newOutput = await runClass(exp.config);
  setExperiments((e) => e.id === exp.id, "output", newOutput);
}

export function addExperiment(config: ClassConfig = classConfig.parse({})) {
  const id = bumpLastExperimentId();
  const newExperiment: Experiment = {
    name: "My experiment",
    description: "Standard experiment",
    id: id.toString(),
    config,
    output: undefined,
  };
  setExperiments(experiments.length, newExperiment);
  return newExperiment;
}

export function duplicateExperiment(id: string) {
  const original = unwrap(experiments.find((e) => e.id === id));
  if (!original) {
    throw new Error("No experiment with id {id}");
  }
  addExperiment(original.config);
}

export function deleteExperiment(id: string) {
  setExperiments(experiments.filter((exp) => exp.id !== id));
}

export async function modifyExperiment(id: string, newConfig: ClassConfig) {
  setExperiments((exp, i) => exp.id === id, "config", newConfig);
  await runExperiment(id);
}

export function setExperimentName(id: string, newName: string) {
  setExperiments((exp) => exp.id === id, "name", newName);
}

export function setExperimentDescription(id: string, newDescription: string) {
  setExperiments((exp) => exp.id === id, "description", newDescription);
}
