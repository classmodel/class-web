import { createStore } from "solid-js/store";
import type { Experiment } from "~/components/Experiment";

export const [experiments, setExperiments] = createStore<Experiment[]>([]);
