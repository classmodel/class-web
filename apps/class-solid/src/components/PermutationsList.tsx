import {
  type ClassConfig,
  classConfig,
  classDefaultConfigSchema,
} from "@classmodel/class/config";
import { type SubmitHandler, createForm } from "@modular-forms/solid";
import { For, createSignal } from "solid-js";
import { Button } from "~/components/ui/button";
import {
  type Experiment,
  type Permutation,
  deletePermutationFromExperiment,
  duplicatePermutation,
  promotePermutationToExperiment,
  setPermutationConfigInExperiment,
  swapPermutationAndReferenceConfiguration,
} from "~/lib/store";
import { ObjectField } from "./ObjectField";
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

const ClassConfigJsonSchema = classDefaultConfigSchema.definitions?.classConfig;

function PermutationConfigForm(props: {
  id: string;
  onSubmit: (config: Partial<ClassConfig>) => void;
  permutationName?: string;
  config: Partial<ClassConfig>;
}) {
  const [_, { Form, Field }] = createForm<ClassConfig>({
    initialValues: {
      title: props.permutationName ?? "",
      ...props.config,
    },
  });

  const handleSubmit: SubmitHandler<ClassConfig> = (values, event) => {
    // Parse only for validation
    const data = classConfig.parse(values);
    // TODO if parse fails, show error
    props.onSubmit(values);
  };

  return (
    <Form
      id={props.id}
      onSubmit={handleSubmit}
      shouldActive={false} // Also return from collapsed fields
      shouldDirty={true} // Don't return empty strings for unset fields
    >
      <div>
        <ObjectField
          schema={ClassConfigJsonSchema}
          value={props.config}
          Field={Field}
        />
      </div>
    </Form>
  );
}

function AddPermutationButton(props: { experiment: Experiment }) {
  const [open, setOpen] = createSignal(false);
  const permutationName = `${props.experiment.permutations.length + 1}`;
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
            {props.experiment.id}
          </DialogTitle>
        </DialogHeader>
        <PermutationConfigForm
          id="add-permutation-form"
          config={props.experiment.reference.config}
          permutationName={permutationName}
          onSubmit={(config) => {
            const { title, description, ...strippedConfig } = config;
            setPermutationConfigInExperiment(
              props.experiment.id,
              -1,
              strippedConfig,
              title ?? permutationName,
            );
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
  permutationIndex: number;
}) {
  const [open, setOpen] = createSignal(false);
  const permutationName =
    props.experiment.permutations[props.permutationIndex].name;
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
            {props.experiment.id}
          </DialogTitle>
        </DialogHeader>
        <PermutationConfigForm
          id="edit-permutation-form"
          permutationName={permutationName}
          config={props.experiment.permutations[props.permutationIndex].config}
          onSubmit={(config) => {
            const { title, description, ...strippedConfig } = config;
            setPermutationConfigInExperiment(
              props.experiment.id,
              props.permutationIndex,
              strippedConfig,
              title ?? permutationName,
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
  reference: Partial<ClassConfig>;
  permutation: Partial<ClassConfig>;
}) {
  const [open, setOpen] = createSignal(false);
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
            <pre>{JSON.stringify(props.reference, null, 2)}</pre>
          </fieldset>
          <fieldset class="border">
            <legend>Permutation configuration</legend>
            <pre>{JSON.stringify(props.permutation, null, 2)}</pre>
          </fieldset>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PermutationInfo(props: {
  experiment: Experiment;
  permutationIndex: number;
  perm: Permutation;
}) {
  return (
    <div class="flex flex-row items-center justify-center gap-1 p-2">
      <span class="">{props.perm.name}</span>
      <PermutationDifferenceButton
        reference={props.experiment.reference.config}
        permutation={props.perm.config}
      />
      <EditPermutationButton
        experiment={props.experiment}
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
                props.experiment.id,
                props.permutationIndex,
              )
            }
          >
            <MdiDelete /> Delete permutation
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              duplicatePermutation(props.experiment.id, props.permutationIndex);
            }}
          >
            <MdiContentCopy /> Duplicate permutation
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              promotePermutationToExperiment(
                props.experiment.id,
                props.permutationIndex,
              );
            }}
          >
            <MdiCakeVariantOutline /> Promote permutation to a new experiment
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              swapPermutationAndReferenceConfiguration(
                props.experiment.id,
                props.permutationIndex,
              );
            }}
          >
            <MdiRotateLeft /> Swap permutation with reference configuration
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function PermutationsList(props: { experiment: Experiment }) {
  return (
    <fieldset class="border">
      <legend class="flex flex-row items-center gap-2">
        Permutations
        <AddPermutationButton experiment={props.experiment} />
      </legend>
      <ul>
        <For each={props.experiment.permutations}>
          {(perm, permutationIndex) => (
            <li>
              <PermutationInfo
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
