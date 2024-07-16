import { For } from "solid-js";
import { Button } from "~/components/ui/button";
import { Flex } from "~/components/ui/flex";
import {
  ExperimentCard,
  addDefaultExperiment,
  AddCustomExperiment,
} from "~/components/Experiment";

import { experiments } from "~/lib/store";

export default function Home() {
  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <h1 class="max-6-xs text-6xl text-sky-700 font-thin uppercase my-16">
        Welcome to CLASS
      </h1>

      <h2 class="text-4xl my-8">Experiments</h2>
      <Flex justifyContent="center" class="gap-4">
        <For each={experiments}>
          {(experiment) => ExperimentCard(experiment)}
        </For>
        <div>
          <div>
            <Button variant="outline" size="lg" onClick={addDefaultExperiment}>
              Add default experiment
            </Button>
          </div>
          <div>
            <AddCustomExperiment />
          </div>
        </div>
      </Flex>
    </main>
  );
}
