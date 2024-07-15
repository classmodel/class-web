import { createSignal, createUniqueId, For, Match, Switch } from "solid-js";
import { Button } from "~/components/ui/button";
import { createStore } from "solid-js/store";
import {
  classConfig,
  ClassConfig,
  classDefaultConfigSchema,
} from "@repo/class/config";
import { ClassOutput, runClass } from "@repo/class/runner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from "~/components/ui/text-field";

interface Experiment {
  name: string;
  description: string;
  id: string;
  config: ClassConfig;
  output: ClassOutput | undefined;
}

const [experiments, setExperiments] = createStore<Experiment[]>([]);

function addDefaultExperiment() {
  const id = createUniqueId();
  const config = classConfig.parse({});
  const output = runClass(config);
  const newExperiment = {
    name: "Default experiment",
    description: "Default experiment",
    id,
    config,
    output,
  };
  setExperiments(experiments.length, newExperiment);
}

function ObjectField({ schema, name = "" }: { schema: any; name?: string }) {
  return (
    <fieldset class="border p-2">
      <legend>{schema.description ?? name}</legend>
      <div>
      <For each={Object.entries(schema.properties)}>
        {([propName, propSchema]) => (
          <PropField name={`${name}.${propName}`} schema={propSchema} />
        )}
      </For>
      </div>
    </fieldset>
  );
}

function PropField({ name, schema }: { name: string; schema: any }) {
  return (
    <Switch fallback={<p>Unknown type</p>}>
      <Match when={schema.type === "object"}>
        <ObjectField name={name} schema={schema} />
      </Match>
      <Match when={schema.type === "number"}>
        <MyTextField name={name} schema={schema} />
      </Match>
      <Match when={schema.type === "string"}>
        <MyTextField name={name} schema={schema} />
      </Match>
    </Switch>
  );
}

function MyTextField({name, schema}: {name: string, schema: any}) {
  return (
    <TextField class="grid w-full max-w-sm items-center gap-1.5">
      <TextFieldLabel for={name}>{schema.description ?? name}</TextFieldLabel>
      <TextFieldInput type="text" id={name} name={name} placeholder={schema.default} />
    </TextField>
  );
}

const ClassConfigJsonSchema = classDefaultConfigSchema.definitions!.classConfig;

function EditExperimentConfig({
  config,
  onSubmit,
}: {
  config: ClassConfig;
  onSubmit: (c: ClassConfig) => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const rawData = Object.fromEntries(formData.entries());
        // TODO nest form rawData to shape of classConfig
        // ".initialState.h_0" => { initialState: { h_0: ... } }
        const data = classConfig.parse(rawData);
        onSubmit(data);
      }}
    >
      <ObjectField schema={ClassConfigJsonSchema} />
      <Button type="submit">Run</Button>
    </form>
  );
}

function AddCustomExperiment() {
  const config = classConfig.parse({});
  const [open, setOpen] = createSignal(false);
  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger variant="outline" size="lg" as={Button<"button">}>
        Add custom experiment
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add custom experiment</DialogTitle>
          <DialogDescription>
            Configure your custom experiment here.
          </DialogDescription>
        </DialogHeader>
        <EditExperimentConfig
          config={config}
          onSubmit={(config) => {
            const id = createUniqueId();
            const output = runClass(config);
            const newExperiment = {
              name: "Custom experiment",
              description: "Custom experiment",
              id,
              config,
              output,
            };
            setExperiments(experiments.length, newExperiment);
            setOpen(false)
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export default function Home() {
  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <h1 class="max-6-xs text-6xl text-sky-700 font-thin uppercase my-16">
        Welcome to CLASS
      </h1>

      <Button variant="outline" size="lg" onClick={addDefaultExperiment}>
        Add default experiment
      </Button>
      <AddCustomExperiment />

      <p class="mt-8">
        Start your first experiment by clicking this beautiful button
      </p>

      <ul>
        <For each={experiments}>
          {(experiment) => (
            <li>
              {experiment.name} {experiment.config.initialState.dq_0}{" "}
              {experiment.output!.h[experiment.output!.h.length - 1]}
            </li>
          )}
        </For>
      </ul>
    </main>
  );
}
