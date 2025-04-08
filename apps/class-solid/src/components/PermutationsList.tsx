import type { Config } from "@classmodel/class/config";
import { pruneConfig } from "@classmodel/class/config_utils";
import { Form } from "@classmodel/form";
import { overwriteDefaultsInJsonSchema } from "@classmodel/form/utils";
import { For, createMemo, createSignal, createUniqueId } from "solid-js";
import { unwrap } from "solid-js/store";
import { Button } from "~/components/ui/button";
import { findPresetByName } from "~/lib/presets";
import {
  type Experiment,
  deletePermutationFromExperiment,
  duplicatePermutation,
  promotePermutationToExperiment,
  setPermutationConfigInExperiment,
  swapPermutationAndReferenceConfiguration,
} from "~/lib/store";
import {
  MdiCakeVariantOutline,
  MdiCog,
  MdiContentCopy,
  MdiDelete,
  MdiLightVectorDifference,
  MdiMenu,
  MdiRotateLeft,
} from "./icons";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

function PermutationConfigForm(props: {
  id: string;
  onSubmit: (config: Config) => void;
  reference: Config;
  config: Config; // Config of the permutation
  preset: string;
}) {
  const jsonSchemaOfPermutation = createMemo(() => {
    const jsonSchemaOfPreset = findPresetByName(props.preset).schema;
    return overwriteDefaultsInJsonSchema(jsonSchemaOfPreset, props.reference);
  });

  return (
    <Form
      id={props.id}
      onSubmit={props.onSubmit}
      values={props.config}
      defaults={props.reference}
      schema={jsonSchemaOfPermutation()}
    />
  );
}

function AddPermutationButton(props: {
  experiment: Experiment;
  experimentIndex: number;
}) {
  const [open, setOpen] = createSignal(false);

  const initialPermutationConfig = createMemo(() => {
    const config = structuredClone(unwrap(props.experiment.config.reference));
    config.name = `${props.experiment.config.permutations.length + 1}`;
    config.description = "";
    return config;
  });

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger
        title="Add a permutation to the reference configuration of this experiment"
        variant="secondary"
        size="icon"
        as={Button<"button">}
      >
        +
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle class="mr-10">
            Permutation on reference configuration of experiment{" "}
            {props.experiment.config.reference.name}
          </DialogTitle>
        </DialogHeader>
        <PermutationConfigForm
          id="add-permutation-form"
          reference={props.experiment.config.reference}
          config={initialPermutationConfig()}
          preset={props.experiment.config.preset}
          onSubmit={(config) => {
            setPermutationConfigInExperiment(props.experimentIndex, -1, config);
            setOpen(false);
          }}
        />
        <DialogFooter>
          <Button type="submit" form="add-permutation-form">
            Run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditPermutationButton(props: {
  experiment: Experiment;
  experimentIndex: number;
  permutationIndex: number;
}) {
  const [open, setOpen] = createSignal(false);

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger
        title="Edit permutation"
        variant="outline"
        as={Button<"button">}
      >
        <MdiCog />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Permutation on reference configuration of experiment{" "}
            {props.experiment.config.reference.name}
          </DialogTitle>
        </DialogHeader>
        <PermutationConfigForm
          id="edit-permutation-form"
          reference={props.experiment.config.reference}
          config={props.experiment.config.permutations[props.permutationIndex]}
          preset={props.experiment.config.preset}
          onSubmit={(config) => {
            setPermutationConfigInExperiment(
              props.experimentIndex,
              props.permutationIndex,
              config,
            );
            setOpen(false);
          }}
        />
        <DialogFooter>
          <Button type="submit" form="edit-permutation-form">
            Run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PermutationDifferenceButton(props: {
  reference: Config;
  permutation: Config;
}) {
  const [open, setOpen] = createSignal(false);

  const prunedReference = createMemo(() => {
    if (!open()) {
      return ""; // Don't compute anything if the dialog is closed
    }
    const { name, description, ...pruned } = pruneConfig(
      unwrap(props.reference),
      unwrap(props.permutation),
    );
    return JSON.stringify(pruned, null, 2);
  });
  const prunedPermutation = createMemo(() => {
    if (!open()) {
      return "";
    }
    const { name, description, ...pruned } = pruneConfig(
      unwrap(props.permutation),
      unwrap(props.reference),
    );
    return JSON.stringify(pruned, null, 2);
  });
  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger
        variant="outline"
        title="View differences between this permutation and reference configuration"
        as={Button<"button">}
      >
        <MdiLightVectorDifference />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Differences between configurations</DialogTitle>
        </DialogHeader>
        <div class="grid grid-cols-2">
          <fieldset class="border">
            <legend>Reference configuration</legend>
            <pre>{prunedReference()}</pre>
          </fieldset>
          <fieldset class="border">
            <legend>Permutation configuration</legend>
            <pre title="PermutationConfig">{prunedPermutation()}</pre>
          </fieldset>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PermutationInfo(props: {
  experiment: Experiment;
  experimentIndex: number;
  permutationIndex: number;
  perm: Config;
}) {
  const id = createUniqueId();

  return (
    <article
      class="flex flex-row items-center justify-center gap-1 p-2"
      aria-labelledby={id}
    >
      <span id={id}>{props.perm.name}</span>
      <PermutationDifferenceButton
        reference={props.experiment.config.reference}
        permutation={props.perm}
      />
      <EditPermutationButton
        experiment={props.experiment}
        experimentIndex={props.experimentIndex}
        permutationIndex={props.permutationIndex}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          as={Button}
          variant="outline"
          title="Other actions"
        >
          <MdiMenu />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() =>
              deletePermutationFromExperiment(
                props.experimentIndex,
                props.permutationIndex,
              )
            }
          >
            <MdiDelete /> Delete permutation
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              duplicatePermutation(
                props.experimentIndex,
                props.permutationIndex,
              );
            }}
          >
            <MdiContentCopy /> Duplicate permutation
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              promotePermutationToExperiment(
                props.experimentIndex,
                props.permutationIndex,
              );
            }}
          >
            <MdiCakeVariantOutline /> Promote permutation to a new experiment
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              swapPermutationAndReferenceConfiguration(
                props.experimentIndex,
                props.permutationIndex,
              );
            }}
          >
            <MdiRotateLeft /> Swap permutation with reference configuration
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  );
}

export function PermutationsList(props: {
  experimentIndex: number;
  experiment: Experiment;
}) {
  return (
    <fieldset class="border">
      <legend class="flex flex-row items-center gap-2">
        Permutations
        <AddPermutationButton
          experiment={props.experiment}
          experimentIndex={props.experimentIndex}
        />
      </legend>
      <ul class="max-h-40 overflow-auto">
        <For each={props.experiment.config.permutations}>
          {(perm, permutationIndex) => (
            <li>
              <PermutationInfo
                experimentIndex={props.experimentIndex}
                experiment={props.experiment}
                permutationIndex={permutationIndex()}
                perm={perm}
              />
            </li>
          )}
        </For>
      </ul>
    </fieldset>
  );
}
