import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
} from "solid-js";

import { Button, buttonVariants } from "~/components/ui/button";
import { createArchive, toConfigBlob } from "~/lib/download";
import {
  type Experiment,
  deleteExperiment,
  duplicateExperiment,
  modifyExperiment,
} from "~/lib/store";
import { ExperimentConfigForm } from "./ExperimentConfigForm";
import { PermutationsList } from "./PermutationsList";
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

export function ExperimentSettingsDialog(experiment: Experiment) {
  const [open, setOpen] = createSignal(
    experiment.reference.output === undefined,
  );

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger variant="outline" as={Button<"button">} title="Edit">
        <MdiCog />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Experiment</DialogTitle>
        </DialogHeader>
        <ExperimentConfigForm
          id="experiment-form"
          experiment={experiment}
          onSubmit={(newConfig, name, description) => {
            setOpen(false);
            modifyExperiment(experiment.id, newConfig, name, description);
          }}
        />
        <DialogFooter>
          <Button type="submit" form="experiment-form">
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

function DownloadExperimentConfiguration(props: { experiment: Experiment }) {
  const downloadUrl = createMemo(() => {
    return URL.createObjectURL(toConfigBlob(props.experiment));
  });

  onCleanup(() => {
    URL.revokeObjectURL(downloadUrl());
  });

  const filename = `class-${props.experiment.name}.json`;
  return (
    <a href={downloadUrl()} download={filename} type="application/json">
      Configuration
    </a>
  );
}

function DownloadExperimentArchive(props: { experiment: Experiment }) {
  const [url, setUrl] = createSignal<string>("");
  createEffect(async () => {
    const archive = await createArchive(props.experiment);
    const objectUrl = URL.createObjectURL(archive);
    setUrl(objectUrl);
    onCleanup(() => URL.revokeObjectURL(objectUrl));
  });

  const filename = `class-${props.experiment.id}.zip`;
  return (
    <a href={url()} download={filename} type="application/json">
      Config + output
    </a>
  );
}

function DownloadExperiment(props: { experiment: Experiment }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        class={buttonVariants({ variant: "outline" })}
        title="Download"
      >
        <MdiDownload />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <DownloadExperimentConfiguration experiment={props.experiment} />
        </DropdownMenuItem>
        <DropdownMenuItem>
          <DownloadExperimentArchive experiment={props.experiment} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ExperimentCard(experiment: Experiment) {
  return (
    <Card class="w-[380px]">
      <CardHeader>
        <CardTitle>{experiment.name}</CardTitle>
        <CardDescription>{experiment.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <PermutationsList experiment={experiment} />
      </CardContent>
      <CardFooter>
        <Show when={!experiment.running} fallback={<RunningIndicator />}>
          <DownloadExperiment experiment={experiment} />
          <ExperimentSettingsDialog {...experiment} />
          <Button
            variant="outline"
            title="Duplicate experiment"
            onClick={() => duplicateExperiment(experiment.id)}
          >
            <MdiContentCopy />
          </Button>
          <Button
            variant="outline"
            title="Delete experiment"
            onClick={() => deleteExperiment(experiment.id)}
          >
            <MdiDelete />
          </Button>
        </Show>
      </CardFooter>
    </Card>
  );
}
