import { For, Show } from "solid-js";

import { AnalysisCard, addAnalysis } from "~/components/Analysis";
import { ExperimentCard } from "~/components/Experiment";
import { UploadExperiment } from "~/components/UploadExperiment";
import { MdiPlusBox } from "~/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Flex } from "~/components/ui/flex";

import { addExperiment, experiments } from "~/lib/store";
import { analyses } from "~/lib/store";

export default function Home() {
  return (
    <main class="mx-auto p-4 text-center text-gray-700">
      <h2 class="my-8 text-4xl">
        Experiments
        <DropdownMenu>
          <DropdownMenuTrigger>
            <MdiPlusBox class="ml-2 inline-block align-bottom" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Add experiment</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => addExperiment()}>
              Default settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <UploadExperiment />
            </DropdownMenuItem>
            <DropdownMenuItem class="text-gray-400">
              Preset (not implemented)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </h2>

      <Flex justifyContent="center" class="flex-wrap gap-4">
        <For each={experiments}>
          {(experiment) => ExperimentCard(experiment)}
        </For>
      </Flex>

      <h2 class="my-8 text-4xl">
        Analysis
        <Show when={experiments.length}>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <MdiPlusBox class="ml-2 inline-block align-bottom" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Add analysis</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => addAnalysis()}>
                Card
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addAnalysis("timeseries")}>
                Timeseries
              </DropdownMenuItem>
              <DropdownMenuItem class="text-gray-400">
                Vertical profile (not implemented)
              </DropdownMenuItem>
              <DropdownMenuItem class="text-gray-400">
                Skew-T diagram (not implemented)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Show>
      </h2>
      <Show when={experiments.length} fallback={<p>Add an experiment first</p>}>
        <Flex justifyContent="center" class="flex-wrap gap-4">
          <For each={analyses}>{(analysis) => AnalysisCard(analysis)}</For>
        </Flex>
      </Show>
    </main>
  );
}
