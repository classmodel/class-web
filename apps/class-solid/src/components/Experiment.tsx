import { createSignal } from "solid-js";
import { Button } from "~/components/ui/button";
import {
  type Experiment,
  deleteExperiment,
  duplicateExperiment,
  modifyExperiment,
} from "~/lib/store";
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

export function ExperimentSettingsDialog(experiment: Experiment) {
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
          onSubmit={async (newConfig) => {
            setOpen(false);
            modifyExperiment(experiment.id, newConfig);
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
        <ExperimentSettingsDialog {...experiment} />
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
