import { For, Show } from "solid-js";

import { AnalysisCard, addAnalysis } from "~/components/Analysis";
import {
  AddCustomExperiment,
  ExperimentCard,
  addDefaultExperiment,
} from "~/components/Experiment";
import { Button } from "~/components/ui/button";
import { Flex } from "~/components/ui/flex";

import { experiments } from "~/lib/store";
import { analyses } from "~/lib/store";

export default function Home() {
  return (
    <main class="mx-auto p-4 text-center text-gray-700">
      <h1 class="max-6-xs my-16 font-thin text-6xl text-sky-700 uppercase">
        Welcome to CLASS
      </h1>

      <h2 class="my-8 text-4xl">Experiments</h2>
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

      <h2 class="my-8 text-4xl">Analysis</h2>
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
