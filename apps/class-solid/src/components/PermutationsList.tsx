import {
  type PartialConfig,
  overwriteDefaultsInJsonSchema,
  pruneDefaults,
} from "@classmodel/class/validate";
import { type SubmitHandler, createForm } from "@modular-forms/solid";
import { For, createMemo, createSignal, createUniqueId } from "solid-js";
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
import {
  type NamedConfig,
  jsonSchemaOfNamedConfig,
  validate,
} from "./NamedConfig";
import { ObjectField } from "./ObjectField";
import { ajvForm } from "./ajvForm";
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
  onSubmit: (config: NamedConfig) => void;
  permutationName?: string;
  reference: PartialConfig;
  config: PartialConfig;
}) {
  const jsonSchemaOfPermutation = createMemo(() => {
    return overwriteDefaultsInJsonSchema(
      jsonSchemaOfNamedConfig,
      props.reference,
    );
  });
  const [_, { Form, Field }] = createForm<NamedConfig>({
    initialValues: {
      title: props.permutationName ?? "",
      ...pruneDefaults(props.config),
    },
    validate: ajvForm(validate),
  });

  const handleSubmit: SubmitHandler<NamedConfig> = (values: NamedConfig) => {
    // Use validate to coerce strings to numbers
    validate(values);
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
          schema={jsonSchemaOfPermutation()}
          value={pruneDefaults(props.config)}
          Field={Field}
        />
      </div>
    </Form>
  );
}

function AddPermutationButton(props: {
  experiment: Experiment;
  experimentIndex: number;
}) {
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
            {props.experiment.name}
          </DialogTitle>
        </DialogHeader>
        <PermutationConfigForm
          id="add-permutation-form"
          reference={props.experiment.reference.config}
          config={{}}
          permutationName={permutationName}
          onSubmit={(config) => {
            const { title, description, ...strippedConfig } = config;
            setPermutationConfigInExperiment(
              props.experimentIndex,
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
  experimentIndex: number;
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
            {props.experiment.name}
          </DialogTitle>
        </DialogHeader>
        <PermutationConfigForm
          id="edit-permutation-form"
          permutationName={permutationName}
          reference={props.experiment.reference.config}
          config={props.experiment.permutations[props.permutationIndex].config}
          onSubmit={(config) => {
            const { title, description, ...strippedConfig } = config;
            setPermutationConfigInExperiment(
              props.experimentIndex,
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
  reference: PartialConfig;
  permutation: PartialConfig;
}) {
  const [open, setOpen] = createSignal(false);
  const prunedReference = createMemo(() =>
    JSON.stringify(pruneDefaults(props.reference), null, 2),
  );
  const prunedPermutation = createMemo(() =>
    JSON.stringify(pruneDefaults(props.permutation), null, 2),
  );
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
            <pre>{prunedPermutation()}</pre>
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
  perm: Permutation;
}) {
  const id = createUniqueId();
  return (
    <article
      class="flex flex-row items-center justify-center gap-1 p-2"
      aria-labelledby={id}
    >
      <span id={id}>{props.perm.name}</span>
      <PermutationDifferenceButton
        reference={props.experiment.reference.config}
        permutation={props.perm.config}
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
      <ul>
        <For each={props.experiment.permutations}>
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
