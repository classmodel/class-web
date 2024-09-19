import {
  type ClassConfig,
  classConfig,
  classDefaultConfigSchema,
} from "@classmodel/class/config";
import { For, createSignal } from "solid-js";
import { Button } from "~/components/ui/button";
import { inflate } from "~/lib/inflate";
import {
  type Experiment,
  type Permutation,
  deletePermutationFromExperiment,
  promotePermutationToExperiment,
  setPermutationConfigInExperiment,
} from "~/lib/store";
import { MyTextField, ObjectField } from "./ObjectField";
import {
  MdiCakeVariantOutline,
  MdiCog,
  MdiDelete,
  MdiLightVectorDifference,
} from "./icons";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

function PermutationConfigForm(props: {
  id: string;
  onSubmit: (name: string, config: Partial<ClassConfig>) => void;
  permutationName?: string;
  config: Partial<ClassConfig>;
}) {
  const schema = classDefaultConfigSchema.definitions?.classConfig;
  return (
    <form
      id={props.id}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const rawData = Object.fromEntries(formData.entries());
        const { name, ...rawDataWithoutName } = rawData;
        const nameAsString = typeof name === "string" ? name : "";
        const nestedData = inflate(rawDataWithoutName);
        // Parse only for validation
        const data = classConfig.parse(nestedData);
        props.onSubmit(nameAsString, nestedData);
      }}
    >
      <MyTextField
        name="name"
        schema={{ type: "string", description: "Name of permutation" }}
        value={props.permutationName}
        required
        minlength="1"
        // TODO allow changing name of existing permutation
        disabled={!!props.permutationName}
      />
      <div class="grid grid-flow-col gap-1">
        <ObjectField schema={schema} value={props.config} />
      </div>
    </form>
  );
}

function AddPermutationButton(props: { experiment: Experiment }) {
  const [open, setOpen] = createSignal(false);
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
          <DialogTitle>
            Permutation on reference configuration of experiment{" "}
            {props.experiment.id}
          </DialogTitle>
        </DialogHeader>
        <PermutationConfigForm
          id="add-permutation-form"
          config={props.experiment.reference.config}
          onSubmit={(name, config) => {
            setPermutationConfigInExperiment(props.experiment.id, name, config);
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
  permutationName: string;
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
            {props.experiment.id}
          </DialogTitle>
        </DialogHeader>
        <PermutationConfigForm
          id="edit-permutation-form"
          permutationName={props.permutationName}
          config={props.experiment.permutations[props.permutationName].config}
          onSubmit={(_, config) => {
            setPermutationConfigInExperiment(
              props.experiment.id,
              props.permutationName,
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
  permutationName: string;
  perm: Permutation;
}) {
  return (
    <div class="flex flex-row items-center justify-center gap-1 p-2">
      <span class="">{props.permutationName}</span>
      <PermutationDifferenceButton
        reference={props.experiment.reference.config}
        permutation={props.perm.config}
      />
      <EditPermutationButton
        experiment={props.experiment}
        permutationName={props.permutationName}
      />
      <Button
        variant="outline"
        title="Promote permutation to an experiment"
        onClick={() => {
          promotePermutationToExperiment(
            props.experiment.id,
            props.permutationName,
          );
        }}
      >
        <MdiCakeVariantOutline />
      </Button>
      <Button
        variant="outline"
        title="Delete permutation"
        onClick={() =>
          deletePermutationFromExperiment(
            props.experiment.id,
            props.permutationName,
          )
        }
      >
        <MdiDelete />
      </Button>
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
        <For each={Object.entries(props.experiment.permutations)}>
          {([key, perm]) => (
            <li>
              <PermutationInfo
                experiment={props.experiment}
                permutationName={key}
                perm={perm}
              />
            </li>
          )}
        </For>
      </ul>
    </fieldset>
  );
}
