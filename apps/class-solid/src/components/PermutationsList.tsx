import type { Config } from "@classmodel/class/config";
import { pruneConfig } from "@classmodel/class/config_utils";
import { Form } from "@classmodel/form";
import { overwriteDefaultsInJsonSchema } from "@classmodel/form/utils";
import { For, createMemo, createSignal } from "solid-js";
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
  DropdownMenuSeparator,
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
        variant="outline"
        size="tinyicon"
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
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.setOpen}>
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
            props.setOpen(false);
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

function PermutationDifferenceDialog(props: {
  reference: Config;
  permutation: Config;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const prunedReference = createMemo(() => {
    if (!props.open) {
      return ""; // Don't compute anything if the dialog is closed
    }
    const { name, description, ...pruned } = pruneConfig(
      unwrap(props.reference),
      unwrap(props.permutation),
    );
    return JSON.stringify(pruned, null, 2);
  });
  const prunedPermutation = createMemo(() => {
    if (!props.open) {
      return "";
    }
    const { name, description, ...pruned } = pruneConfig(
      unwrap(props.permutation),
      unwrap(props.reference),
    );
    return JSON.stringify(pruned, null, 2);
  });
  return (
    <Dialog open={props.open} onOpenChange={props.setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Differences between configurations</DialogTitle>
        </DialogHeader>
        <div class="grid min-w-96 grid-cols-2 gap-2">
          <fieldset class="border">
            <legend>Reference</legend>
            <pre>{prunedReference()}</pre>
          </fieldset>
          <fieldset class="border">
            <legend>Permutation</legend>
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
  const [openDifferenceDialog, setOpenDifferenceDialog] = createSignal(false);
  const [openEditDialog, setOpenEditDialog] = createSignal(false);
  return (
    <>
      <PermutationDifferenceDialog
        reference={props.experiment.config.reference}
        permutation={props.perm}
        open={openDifferenceDialog()}
        setOpen={setOpenDifferenceDialog}
      />
      <EditPermutationButton
        experiment={props.experiment}
        experimentIndex={props.experimentIndex}
        permutationIndex={props.permutationIndex}
        open={openEditDialog()}
        setOpen={setOpenEditDialog}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          as={Button}
          variant="outline"
          title="Click for permutation actions"
        >
          {props.perm.name}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setOpenDifferenceDialog(true)}>
            <MdiLightVectorDifference />
            &nbsp;View differences with reference configuration
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setOpenEditDialog(true)}>
            <MdiCog />
            &nbsp;Edit permutation
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              duplicatePermutation(
                props.experimentIndex,
                props.permutationIndex,
              );
            }}
          >
            <MdiContentCopy />
            &nbsp;Duplicate permutation
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              promotePermutationToExperiment(
                props.experimentIndex,
                props.permutationIndex,
              );
            }}
          >
            <MdiCakeVariantOutline />
            &nbsp;Promote permutation to a new experiment
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              swapPermutationAndReferenceConfiguration(
                props.experimentIndex,
                props.permutationIndex,
              );
            }}
          >
            <MdiRotateLeft />
            &nbsp;Swap permutation with reference configuration
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() =>
              deletePermutationFromExperiment(
                props.experimentIndex,
                props.permutationIndex,
              )
            }
          >
            <MdiDelete />
            &nbsp;Delete permutation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export function PermutationsList(props: {
  experimentIndex: number;
  experiment: Experiment;
}) {
  return (
    <section aria-label="permutations" class="justify-self-center">
      <h2 class="flex items-center gap-1 text-lg">
        Permutations
        <AddPermutationButton
          experiment={props.experiment}
          experimentIndex={props.experimentIndex}
        />
      </h2>
      <ul class="max-h-40 overflow-auto py-2">
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
    </section>
  );
}
