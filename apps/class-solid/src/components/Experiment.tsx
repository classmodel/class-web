import { type ClassConfig, classConfig } from "@classmodel/class/config";
import type { ClassOutput } from "@classmodel/class/runner";
import { createSignal, createUniqueId } from "solid-js";
import { unwrap } from "solid-js/store";
import { Button } from "~/components/ui/button";
import { runClass } from "~/lib/runner";
import { experiments, setExperiments } from "~/lib/store";
import { ExperimentConfigForm } from "./ExperimentConfigForm";
import { MdiCog, MdiContentCopy, MdiDelete, MdiDownload } from "./icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export interface Experiment {
  name: string;
  description: string;
  id: string;
  config: ClassConfig;
  output: ClassOutput | undefined;
}

export async function runExperiment(id: string) {
  const expProxy = experiments.find((exp) => exp.id === id);
  if (!expProxy) {
    throw new Error("No experiment with id {id}");
  }
  const exp = unwrap(expProxy);
  const newOutput = await runClass(exp.config);
  setExperiments((e) => e.id === exp.id, "output", newOutput);
}

export function addExperiment() {
  const id = createUniqueId();
  const config = classConfig.parse({});
  const newExperiment: Experiment = {
    name: "My experiment",
    description: "Standard experiment",
    id,
    config,
    output: undefined,
  };
  setExperiments(experiments.length, newExperiment);
  return newExperiment;
}

export function duplicateExperiment(id: string) {
  const newId = createUniqueId();
  const copy = experiments.find((e) => e.id === id);
  setExperiments(experiments.length, { ...copy, id: newId });
}

function deleteExperiment(id: string) {
  setExperiments(experiments.filter((exp) => exp.id !== id));
}

export function ModifyExperiment(experiment: Experiment) {
  const [open, setOpen] = createSignal(true);
  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger variant="outline" as={Button<"button">}>
        <MdiCog />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Experiment {experiment.id}</DialogTitle>
          <DialogDescription>{experiment.description}</DialogDescription>
        </DialogHeader>
        <ExperimentConfigForm
          id={experiment.id}
          config={experiment.config}
          onSubmit={async (config) => {
            setExperiments(
              (exp, i) => exp.id === experiment.id,
              "config",
              config,
            );
            setOpen(false);
            await runExperiment(experiment.id);
          }}
        />
        <DialogFooter>
          <Button type="submit" form={experiment.id}>
            Run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ExperimentCard(experiment: Experiment) {
  return (
    <Card class="w-[380px]">
      <CardHeader>
        {/* TODO: make name & description editable */}
        <CardTitle>{experiment.name}</CardTitle>
        <CardDescription>{experiment.id}</CardDescription>
      </CardHeader>
      <CardContent>{experiment.description}</CardContent>
      <CardFooter>
        {/* TODO: implement download functionality */}
        <Button variant="outline">
          <MdiDownload />
        </Button>
        <ModifyExperiment {...experiment} />
        <Button variant="outline">
          <MdiContentCopy onClick={() => duplicateExperiment(experiment.id)} />
        </Button>
        <Button
          variant="outline"
          onClick={() => deleteExperiment(experiment.id)}
        >
          <MdiDelete />
        </Button>
      </CardFooter>
    </Card>
  );
}
