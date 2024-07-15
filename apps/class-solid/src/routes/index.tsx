import { createSignal, createUniqueId, For } from "solid-js";
import { Button } from "~/components/ui/button";
import { createStore } from "solid-js/store"
import { classConfig, ClassConfig } from "@repo/class/config";
import { ClassOutput, runClass } from "@repo/class/runner";

interface Experiment {
  name: string;
  description: string;
  id: string;
  config: ClassConfig;
  output: ClassOutput | undefined;
}

const [experiments, setExperiments] = createStore<Experiment[]>([])

function addDefaultExperiment() {
  const id =  createUniqueId()
  const config = classConfig.parse({})
  const output = runClass(config)
  const newExperiment = {
    name: "Default experiment",
    description: "Default experiment",
    id,
    config,
    output
  }
  setExperiments(experiments.length, newExperiment);
}

export default function Home() {
  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <h1 class="max-6-xs text-6xl text-sky-700 font-thin uppercase my-16">Welcome to CLASS</h1>
      <Button variant='outline' size='lg' onClick={addDefaultExperiment}>Add default experiment</Button>
      <p class="mt-8">
        Start your first experiment by clicking this beautiful button
      </p>

      <ul>
      <For each={experiments}>
        {(experiment) => (
          <li>{experiment.name} {experiment.config.initialState.dq_0} {experiment.output!.h[experiment.output!.h.length-1]}</li>
        )}
      </For>
        </ul>
    </main>
  );
}
