import { type Sweep, performSweep } from "@classmodel/class/sweep";
import {
  type PartialConfig,
  overwriteDefaultsInJsonSchema,
} from "@classmodel/class/validate";
import { For, createMemo, createSignal } from "solid-js";
import { unwrap } from "solid-js/store";
import { Button } from "~/components/ui/button";
import {
  type Experiment,
  type Permutation,
  runExperiment,
  setExperiments,
} from "~/lib/store";
import { jsonSchemaOfNamedConfig } from "./NamedConfig";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

function nameForPermutation(config: PartialConfig): string {
  const chunks = [];
  for (const [section, params] of Object.entries(config)) {
    const paramChunks = [];
    for (const [param, value] of Object.entries(params)) {
      paramChunks.push(`${param}=${value}`);
    }
    // Add section?
    chunks.push(paramChunks.join(","));
  }
  return chunks.join(",");
}

function config2permutation(config: PartialConfig): Permutation {
  return {
    config,
    name: nameForPermutation(config),
  };
}

function configs2Permutations(configs: PartialConfig[]): Permutation[] {
  return configs.map(config2permutation);
}

export function PermutationSweepButton(props: {
  experiment: Experiment;
  experimentIndex: number;
}) {
  const jsonSchemaOfPermutation = createMemo(() => {
    return overwriteDefaultsInJsonSchema(
      jsonSchemaOfNamedConfig,
      unwrap(props.experiment.reference.config),
    );
  });

  const sweeps: Sweep[] = [
    {
      section: "initialState",
      parameter: "h_0",
      start: 100,
      step: 100,
      steps: 5,
    },
    {
      section: "mixedLayer",
      parameter: "beta",
      start: 0.1,
      step: 0.1,
      steps: 5,
    },
  ];

  function addSweep() {
    const configs = performSweep(sweeps);
    const perms = configs2Permutations(configs);
    setOpen(false);
    // TODO overwrite or append to existing permutations?
    setExperiments(props.experimentIndex, "permutations", perms);
    runExperiment(props.experimentIndex);
  }
  const [open, setOpen] = createSignal(false);
  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger
        title="Sweep over h_0 and beta"
        variant="secondary"
        size="icon"
        as={Button<"button">}
      >
        S
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle class="mr-10">
            Perform a sweep over parameters
          </DialogTitle>
        </DialogHeader>
        {/* TODO make configure by user, using a form with user can pick the parameter, start, step, and steps. */}
        <div class="p-4">
          <p class="mb-4">
            This will create a set of permutations, for combination of the
            following parameters:
          </p>
          <ul class="list-inside list-disc">
            <For each={sweeps}>
              {(sweep) => (
                <li>
                  {sweep.section}.{sweep.parameter} from {sweep.start} with
                  increment of {sweep.step} for {sweep.steps} steps
                </li>
              )}
            </For>
          </ul>
        </div>
        <DialogFooter>
          <Button type="button" form="add-permutation-form" onClick={addSweep}>
            Perform sweep
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
