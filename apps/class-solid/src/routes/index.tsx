import { createSignal, createUniqueId, For } from "solid-js";
import { Button } from "~/components/ui/button";
import { createStore } from "solid-js/store";
import { classConfig, ClassConfig } from "@repo/class/config";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Flex } from "~/components/ui/flex";
import {
  MdiCog,
  MdiContentCopy,
  MdiDelete,
  MdiDownload,
} from "~/components/icons";
import { ExperimentConfigForm } from "~/components/ExperimentConfigForm";

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
        <ExperimentConfigForm
          // TODO: not sure if passing around ids like this is the proper way to do things in solidjs
          // note, id ius used as form target in submit button below;
          id="experiment-config-form"
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
            setOpen(false);
          }}
        />
        <DialogFooter>
          <Button type="submit" form="experiment-config-form">
            Run
          </Button>
        </DialogFooter>
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

      <h2 class="text-4xl my-8">Experiments</h2>
      <Flex justifyContent="center" class="gap-4">
        <For each={experiments}>
          {(experiment) => (
            <Card class="w-[380px]">
              <CardHeader>
                {/* TODO: make name & description editable */}
                <CardTitle>{experiment.name}</CardTitle>
                <CardDescription>{experiment.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* TODO: implement functionality below */}

                <Button variant="outline">
                  <MdiDownload />
                </Button>
                <Button variant="outline">
                  <MdiCog />
                </Button>
                <Button variant="outline">
                  <MdiContentCopy />
                </Button>
                <Button variant="outline">
                  <MdiDelete />
                </Button>
              </CardContent>
            </Card>
          )}
        </For>
        <div>
          <div>
            <Button variant="outline" size="lg" onClick={addDefaultExperiment}>
              Add default experiment
            </Button>
          </div>
          <div>
            <AddCustomExperiment />
          </div>
        </div>
      </Flex>
    </main>
  );
}
