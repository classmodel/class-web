import { For, Show, createSignal, onMount } from "solid-js";

import { AnalysisCard } from "~/components/Analysis";
import { AddExperimentDialog, ExperimentCard } from "~/components/Experiment";
import { StartButtons, StartMenu } from "~/components/StartButtons";
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
import { onPageLoad } from "~/lib/state";

import { addAnalysis, analysisNames, experiments } from "~/lib/store";
import { analyses } from "~/lib/store";

export default function Home() {
  const [openAddDialog, setOpenAddDialog] = createSignal(false);

  onMount(onPageLoad);

  return (
    <main class="mx-auto p-4 text-center text-gray-700">
      <h2 class="my-8 text-4xl">
        Experiments
        <StartMenu onFromSratchClick={() => setOpenAddDialog(true)} />
      </h2>
      <AddExperimentDialog
        nextIndex={experiments.length + 1}
        open={openAddDialog()}
        onClose={() => setOpenAddDialog(false)}
      />

      <Flex
        justifyContent="center"
        alignItems="stretch"
        class="flex-wrap gap-4"
      >
        <Show when={!experiments.length}>
          <StartButtons
            onFromSratchClick={() => setOpenAddDialog(true)}
            afterClick={() => {}}
          />
        </Show>
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
              <For each={analysisNames}>
                {(name) => (
                  <DropdownMenuItem onClick={() => addAnalysis(name)}>
                    {name}
                  </DropdownMenuItem>
                )}
              </For>
            </DropdownMenuContent>
          </DropdownMenu>
        </Show>
      </h2>
      <Show when={experiments.length} fallback={<p>Add an experiment first</p>}>
        <Flex
          justifyContent="center"
          alignItems="stretch"
          class="flex-wrap gap-4"
        >
          <For each={analyses}>{(analysis) => AnalysisCard(analysis)}</For>
        </Flex>
      </Show>
      <Toaster />
    </main>
  );
}
