import { For, Show, createSignal, onCleanup, onMount } from "solid-js";

import { AnalysisCard, addAnalysis } from "~/components/Analysis";
import { AddExperimentDialog, ExperimentCard } from "~/components/Experiment";
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
import { Toaster } from "~/components/ui/toast";
import { onPageLeave, onPageLoad } from "~/lib/onPageTransition";

import { experiments } from "~/lib/store";
import { analyses } from "~/lib/store";

export default function Home() {
  const [openAddDialog, setOpenAddDialog] = createSignal(false);

  onMount(onPageLoad);
  onCleanup(onPageLeave);

  return (
    <main class="mx-auto p-4 text-center text-gray-700">
      <h2 class="my-8 text-4xl">
        Experiments
        <DropdownMenu>
          <DropdownMenuTrigger title="Add experiment">
            <MdiPlusBox class="ml-2 inline-block align-bottom" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Add experiment</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setOpenAddDialog(true)}
              class="cursor-pointer"
            >
              From scratch
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
      <AddExperimentDialog
        nextIndex={experiments.length + 1}
        open={openAddDialog()}
        onClose={() => setOpenAddDialog(false)}
      />

      <Flex justifyContent="center" class="flex-wrap gap-4">
        <For each={experiments}>
          {(experiment, index) => (
            <ExperimentCard experiment={experiment} experimentIndex={index()} />
          )}
        </For>
      </Flex>

      <h2 class="my-8 text-4xl">
        Analysis
        <Show when={experiments.length}>
          <DropdownMenu>
            <DropdownMenuTrigger title="Add analysis">
              <MdiPlusBox class="ml-2 inline-block align-bottom" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Add analysis</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => addAnalysis()}>
                Final height
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addAnalysis("timeseries")}>
                Timeseries
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addAnalysis("profiles")}>
                Vertical profile
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
      <Toaster />
    </main>
  );
}
