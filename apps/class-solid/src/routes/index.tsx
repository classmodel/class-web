import { For, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import { Flex } from "~/components/ui/flex";
import {
  ExperimentCard,
  addDefaultExperiment,
  AddCustomExperiment,
} from "~/components/Experiment";

import { experiments } from "~/lib/store";
import { analyses } from "~/lib/store";
import { addAnalysis, AnalysisCard } from "~/components/Analysis";

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
          <div>
            <Button variant="outline" size="lg">
              Upload experiment config (not implemented)
            </Button>{" "}
          </div>
          <div>
            <Button variant="outline" size="lg">
              Add experiment from choice of presets (not implemented)
            </Button>
          </div>
        </div>
      </Flex>

      <h2 class="text-4xl my-8">Analysis</h2>
      <Show when={experiments.length} fallback={<p>Add an experiment first</p>}>
        <Flex justifyContent="center" class="gap-4">
          <For each={analyses}>{(analysis) => AnalysisCard(analysis)}</For>
          <div>
            <div>
              <Button variant="outline" size="lg" onClick={() => addAnalysis()}>
                Add standard analysis
              </Button>
            </div>
            <div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => addAnalysis("timeseries")}
              >
                Add timeseries plot
              </Button>
            </div>
            <div>
              <Button variant="outline" size="lg">
                Add vertical profile plot (not implemented)
              </Button>
            </div>
            <div>
              <Button variant="outline" size="lg">
                Add output table (not implemented)
              </Button>
            </div>
          </div>
        </Flex>
      </Show>
    </main>
  );
}
