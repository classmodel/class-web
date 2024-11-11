import { Show, createSignal } from "solid-js";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { showToast } from "./ui/toast";

function ResumeSessionButton() {
  return (
    <Show when={hasLocalStorage()}>
      <Button
        variant="outline"
        onClick={loadFromLocalStorage}
        class="flex h-44 w-56 flex-col gap-2 border border-dashed"
      >
        <MdiBackupRestore class="h-32 w-32" />
        <p>Resume from</p>
        <p>previous session</p>
      </Button>
    </Show>
  );
}

function StartFromSratchButton(props: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      class="flex h-44 w-56 flex-col gap-2 border border-dashed"
      onClick={props.onClick}
    >
      <MdiBeakerPlus class="h-32 w-32" />
      <p>Start from scratch</p>
      <p>(default config)</p>
    </Button>
  );
}

function StartFromUploadButton() {
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
      <Button
        onClick={openFilePicker}
        variant="outline"
        class="flex h-44 w-56 flex-col gap-2 border border-dashed"
      >
        <MdiUpload class="h-32 w-32" />
        <p>Start from upload</p>
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
        <p>Presets are not implemented yet</p>
      </DialogContent>
    </Dialog>
  );
}

function StartFromPresetButton() {
  const [open, setOpen] = createSignal(false);
  return (
    <>
      <PresetPicker open={open()} setOpen={setOpen} />
      <Button
        variant="outline"
        class="flex h-44 w-56 flex-col gap-2 border border-dashed"
        onClick={() => setOpen(true)}
      >
        <MdiFileDocumentOutline class="h-32 w-32" />
        <p>From preset</p>
      </Button>
    </>
  );
}

export function StartButtons(props: {
  onFromSratchClick: () => void;
}) {
  return (
    <Show when={!experiments.length}>
      <ResumeSessionButton />
      <StartFromSratchButton onClick={props.onFromSratchClick} />
      <StartFromUploadButton />
      <StartFromPresetButton />
    </Show>
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
      <DropdownMenu>
        <DropdownMenuTrigger title="Add experiment">
          <MdiPlusBox class="ml-2 inline-block align-bottom" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Add experiment</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={props.onFromSratchClick}
            class="cursor-pointer"
          >
            From scratch
          </DropdownMenuItem>
          <DropdownMenuItem>
            <UploadExperiment />
          </DropdownMenuItem>
          <DropdownMenuItem class="text-gray-400">
            <PresetPicker open={open()} setOpen={setOpen} />
            From preset
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Show>
  );
}
