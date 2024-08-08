import { Show, createSignal } from "solid-js";
import { Button } from "~/components/ui/button";
import {
  type Experiment,
  deleteExperiment,
  duplicateExperiment,
  modifyExperiment,
  setExperimentDescription,
  setExperimentName,
} from "~/lib/store";
import { EditableText } from "./EditableText";
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
  const [open, setOpen] = createSignal(experiment.output === undefined);

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

function RunningIndicator() {
  return (
    <div class="flex">
      <svg
        class="-ml-1 mr-3 h-5 w-5 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <title>Running</title>
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span>Running ...</span>
    </div>
  );
}

export function ExperimentCard(experiment: Experiment) {
  return (
    <Card class="w-[380px]">
      <CardHeader>
        <CardTitle>
          <EditableText
            text={experiment.name}
            onChange={(name) => setExperimentName(experiment.id, name)}
          />
        </CardTitle>
        <CardDescription>{experiment.id}</CardDescription>
      </CardHeader>
      <CardContent>
        <EditableText
          text={experiment.description}
          onChange={(description) =>
            setExperimentDescription(experiment.id, description)
          }
        />
      </CardContent>
      <CardFooter>
        <Show when={!experiment.running} fallback={<RunningIndicator />}>
          {/* TODO: implement download functionality */}
          <Button variant="outline">
            <MdiDownload />
          </Button>
          <ExperimentSettingsDialog {...experiment} />
          <Button variant="outline">
            <MdiContentCopy
              onClick={() => duplicateExperiment(experiment.id)}
            />
          </Button>
          <Button
            variant="outline"
            onClick={() => deleteExperiment(experiment.id)}
          >
            <MdiDelete />
          </Button>
        </Show>
      </CardFooter>
    </Card>
  );
}
