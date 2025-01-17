import { For, Show, createSignal } from "solid-js";
import type { ExperimentConfig } from "~/lib/experiment_config";
import { presets } from "~/lib/presets";
import { hasLocalStorage, loadFromLocalStorage } from "~/lib/state";
import { experiments, uploadExperiment } from "~/lib/store";
import {
  MdiBackupRestore,
  MdiBeakerPlus,
  MdiFileDocumentOutline,
  MdiPlusBox,
  MdiUpload,
} from "./icons";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Flex } from "./ui/flex";
import { showToast } from "./ui/toast";

function ResumeSessionButton(props: { afterClick: () => void }) {
  return (
    <Show when={hasLocalStorage()}>
      <Button
        variant="outline"
        onClick={() => {
          loadFromLocalStorage();
          props.afterClick();
        }}
        class="flex h-44 w-56 flex-col gap-2 border border-dashed"
      >
        <MdiBackupRestore class="h-32 w-32" />
        <Show
          when={experiments.length}
          fallback={
            <>
              <p>Resume from</p>
              <p>saved session</p>
            </>
          }
        >
          <p>Restore</p>
          <p>saved session</p>
        </Show>
      </Button>
    </Show>
  );
}

function StartFromSratchButton(props: {
  onClick: () => void;
  afterClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      class="flex h-44 w-56 flex-col gap-2 border border-dashed"
      onClick={() => {
        props.onClick();
        props.afterClick();
      }}
    >
      <MdiBeakerPlus class="h-32 w-32" />
      <Show
        when={experiments.length}
        fallback={
          <>
            <p>Start from scratch</p>
            <p>(default config)</p>
          </>
        }
      >
        <p>From scratch</p>
        <p>(default config)</p>
      </Show>
    </Button>
  );
}

function StartFromUploadButton(props: {
  afterClick: () => void;
}) {
  let ref: HTMLInputElement | undefined;

  function openFilePicker() {
    ref?.click();
  }

  function onUpload(
    event: Event & {
      currentTarget: HTMLInputElement;
      target: HTMLInputElement;
    },
  ) {
    if (!event.target.files) {
      return;
    }
    const file = event.target.files[0];
    file
      .text()
      .then((body) => {
        const rawData = JSON.parse(body);
        return uploadExperiment(rawData);
      })
      .then(() => {
        props.afterClick();
        showToast({
          title: "Experiment uploaded",
          variant: "success",
          duration: 1000,
        });
      })
      .catch((error) => {
        props.afterClick();
        console.error(error);
        showToast({
          title: "Failed to upload experiment",
          description: `${error}`,
          variant: "error",
        });
      });
  }

  return (
    <>
      <Button
        onClick={openFilePicker}
        variant="outline"
        class="flex h-44 w-56 flex-col gap-2 border border-dashed"
      >
        <MdiUpload class="h-32 w-32" />
        <Show when={experiments.length} fallback={<p>Start from upload</p>}>
          <p>From upload</p>
        </Show>
      </Button>
      <input
        ref={ref}
        type="file"
        onChange={onUpload}
        class="hidden"
        accept="application/json,.json"
      />
    </>
  );
}

function PresetPicker(props: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.setOpen}>
      <DialogContent class="min-w-[33%]">
        <DialogHeader>
          <DialogTitle class="mr-10">Pick a preset</DialogTitle>
        </DialogHeader>
        <Flex justifyContent="center" class="flex-wrap gap-4">
          <For each={presets}>
            {(preset) => (
              <Button
                variant="outline"
                class="flex h-44 w-56 flex-col gap-2 border border-dashed"
                onClick={() => {
                  props.setOpen(false);
                  const experiment: ExperimentConfig = {
                    preset: preset.config.name,
                    reference: preset.config,
                    permutations: [],
                  };
                  uploadExperiment(experiment)
                    .then(() => {
                      showToast({
                        title: "Experiment preset loaded",
                        variant: "success",
                        duration: 1000,
                      });
                    })
                    .catch((error) => {
                      console.error(error);
                      showToast({
                        title: "Failed to load preset",
                        description: `${error}`,
                        variant: "error",
                      });
                    });
                }}
              >
                <h1 class="text-xl">{preset.config.name}</h1>
                <div>{preset.config.description}</div>
              </Button>
            )}
          </For>
        </Flex>
      </DialogContent>
    </Dialog>
  );
}

function StartFromPresetButton(props: {
  afterClick: () => void;
}) {
  const [open, setOpen] = createSignal(false);
  return (
    <>
      <PresetPicker
        open={open()}
        setOpen={(v) => {
          if (!v) {
            props.afterClick();
          }
          setOpen(v);
        }}
      />
      <Button
        variant="outline"
        class="flex h-44 w-56 flex-col gap-2 border border-dashed"
        onClick={() => setOpen(true)}
      >
        <MdiFileDocumentOutline class="h-32 w-32" />
        <Show when={experiments.length} fallback={<p>Start from preset</p>}>
          <p>From preset</p>
        </Show>
      </Button>
    </>
  );
}

export function StartButtons(props: {
  onFromSratchClick: () => void;
  afterClick: () => void;
}) {
  return (
    <>
      <StartFromSratchButton
        onClick={props.onFromSratchClick}
        afterClick={props.afterClick}
      />
      <StartFromUploadButton afterClick={props.afterClick} />
      <ResumeSessionButton afterClick={props.afterClick} />
      <StartFromPresetButton afterClick={props.afterClick} />
    </>
  );
}

export function UploadExperiment() {
  let ref: HTMLInputElement | undefined;

  function openFilePicker() {
    ref?.click();
  }

  function onUpload(
    event: Event & {
      currentTarget: HTMLInputElement;
      target: HTMLInputElement;
    },
  ) {
    if (!event.target.files) {
      return;
    }
    const file = event.target.files[0];
    file
      .text()
      .then((body) => {
        const rawData = JSON.parse(body);
        return uploadExperiment(rawData);
      })
      .then(() => {
        showToast({
          title: "Experiment uploaded",
          variant: "success",
          duration: 1000,
        });
      })
      .catch((error) => {
        console.error(error);
        showToast({
          title: "Failed to upload experiment",
          description: `${error}`,
          variant: "error",
        });
      });
  }
  return (
    <>
      <button type="button" class="cursor-pointer" onClick={openFilePicker}>
        Upload
      </button>
      <input
        ref={ref}
        type="file"
        onChange={onUpload}
        class="hidden"
        accept="application/json,.json"
      />
    </>
  );
}

export function StartMenu(props: {
  onFromSratchClick: () => void;
}) {
  const [open, setOpen] = createSignal(false);
  return (
    <Show when={experiments.length}>
      <Dialog open={open()} onOpenChange={setOpen}>
        <DialogTrigger
          as={Button<"button">}
          variant="ghost"
          class="align-middle"
        >
          <MdiPlusBox class="h-10 w-10" />
        </DialogTrigger>
        <DialogContent class="">
          <DialogHeader>
            <DialogTitle>Add experiment</DialogTitle>
          </DialogHeader>
          <div class="flex gap-4">
            <StartButtons
              afterClick={() => setOpen(false)}
              onFromSratchClick={props.onFromSratchClick}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Show>
  );
}
