import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onCleanup,
} from "solid-js";
import { unwrap } from "solid-js/store";
import { Button, buttonVariants } from "~/components/ui/button";
import { createArchive, toConfigBlob } from "~/lib/download";
import { findPresetByName } from "~/lib/presets";
import {
  type Experiment,
  addExperiment,
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

export function AddExperimentDialog(props: {
  nextIndex: number;
  onClose: () => void;
  open: boolean;
}) {
  const defaultPreset = findPresetByName();
  const initialExperimentConfig = createMemo(() => {
    return {
      preset: "Default",
      reference: {
        ...structuredClone(defaultPreset.config),
        name: `My experiment ${props.nextIndex}`,
      },
      permutations: [],
    };
  });

  function setOpen(value: boolean) {
    if (!value) {
      props.onClose();
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={setOpen}>
      <DialogContent class="min-w-[33%]">
        <DialogHeader>
          <DialogTitle class="mr-10 flex justify-between gap-1">
            Experiment
            <span class="text-gray-300 text-sm ">
              Preset: {defaultPreset.config.name}
            </span>
          </DialogTitle>
        </DialogHeader>
        <ExperimentConfigForm
          id="experiment-form"
          experiment={initialExperimentConfig()}
          onSubmit={(newConfig) => {
            props.onClose();
            addExperiment(newConfig);
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

export function ExperimentSettingsDialog(props: {
  experiment: Experiment;
  experimentIndex: number;
}) {
  const [open, setOpen] = createSignal(false);

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger variant="outline" as={Button<"button">} title="Edit">
        <MdiCog />
      </DialogTrigger>
      <DialogContent class="min-w-[33%]">
        <DialogHeader>
          <DialogTitle class="mr-10 flex justify-between gap-1">
            Experiment
            <span class="text-gray-300 text-sm ">
              Preset: {props.experiment.config.preset}
            </span>
          </DialogTitle>
        </DialogHeader>
        <ExperimentConfigForm
          id="experiment-form"
          experiment={props.experiment.config}
          onSubmit={(newConfig) => {
            setOpen(false);
            modifyExperiment(props.experimentIndex, newConfig);
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

function RunningIndicator(props: { progress: number | false }) {
  return (
    <div class="flex" role="status" aria-live="polite">
      <svg
        class="-ml-1 mr-3 h-5 w-5 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
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
      <span>
        Running {props.progress ? (props.progress * 100).toFixed() : 100}% ...
      </span>
    </div>
  );
}

function DownloadExperimentConfiguration(props: { experiment: Experiment }) {
  const downloadUrl = createMemo(() => {
    return URL.createObjectURL(toConfigBlob(unwrap(props.experiment.config)));
  });

  onCleanup(() => {
    URL.revokeObjectURL(downloadUrl());
  });

  const filename = `class-${props.experiment.config.reference.name}.json`;
  return (
    <a href={downloadUrl()} download={filename} type="application/json">
      Configuration
    </a>
  );
}

function DownloadExperimentArchive(props: { experiment: Experiment }) {
  const [url, setUrl] = createSignal<string>("");
  createEffect(async () => {
    const archive = await createArchive(unwrap(props.experiment));
    if (!archive) {
      return;
    }
    const objectUrl = URL.createObjectURL(archive);
    setUrl(objectUrl);
    onCleanup(() => URL.revokeObjectURL(objectUrl));
  });

  const filename = `class-${props.experiment.config.reference.name}.zip`;
  return (
    <a href={url()} download={filename} type="application/zip">
      Configuration and output
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

export function ExperimentCard(props: {
  experiment: Experiment;
  experimentIndex: number;
}) {
  const experiment = () => props.experiment;
  const experimentIndex = () => props.experimentIndex;
  const id = createUniqueId();
  const descriptionId = `${id}-description`;
  return (
    <Card
      class="w-[380px]"
      role="article"
      aria-labelledby={id}
      aria-describedby={descriptionId}
    >
      <CardHeader>
        <CardTitle id={id}>{experiment().config.reference.name}</CardTitle>
        <CardDescription id={descriptionId}>
          {experiment().config.reference.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PermutationsList
          experiment={experiment()}
          experimentIndex={experimentIndex()}
        />
      </CardContent>
      <CardFooter class="gap-1">
        <Show
          when={!experiment().output.running}
          fallback={<RunningIndicator progress={experiment().output.running} />}
        >
          <DownloadExperiment experiment={experiment()} />
          <ExperimentSettingsDialog
            experiment={experiment()}
            experimentIndex={experimentIndex()}
          />
          <Button
            variant="outline"
            title="Duplicate experiment"
            onClick={() => duplicateExperiment(experimentIndex())}
          >
            <MdiContentCopy />
          </Button>
          <Button
            variant="outline"
            title="Delete experiment"
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to delete this experiment?",
                )
              ) {
                deleteExperiment(experimentIndex());
              }
            }}
          >
            <MdiDelete />
          </Button>
        </Show>
      </CardFooter>
    </Card>
  );
}
