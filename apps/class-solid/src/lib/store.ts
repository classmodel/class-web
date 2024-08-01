import { createStore } from "solid-js/store";
import type { Analysis } from "~/components/Analysis";
import type { Experiment } from "~/components/Experiment";

export const [experiments, setExperiments] = createStore<Experiment[]>([]);
export const [analyses, setAnalyses] = createStore<Analysis[]>([]);
