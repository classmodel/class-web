import { Show, createMemo, createSignal, onCleanup } from "solid-js";
import { Button } from "~/components/ui/button";
import { encodeAppState } from "~/lib/encode";
import { analyses, experiments } from "~/lib/store";
import {
  MdiClipboard,
  MdiClipboardCheck,
  MdiShareVariantOutline,
} from "./icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { TextField, TextFieldInput } from "./ui/text-field";
import { showToast } from "./ui/toast";

const MAX_SHAREABLE_LINK_LENGTH = 32_000;

export function ShareButton() {
  const [open, setOpen] = createSignal(false);
  const [isCopied, setIsCopied] = createSignal(false);
  let inputRef: HTMLInputElement | undefined;
  const encodedAppState = createMemo(() => {
    if (!open()) {
      return "";
    }
    return encodeAppState(experiments, analyses);
  });
  const shareableLink = createMemo(() => {
    const basePath = import.meta.env.DEV
      ? ""
      : import.meta.env.BASE_URL.replace("/_build", "");
    const url = `${window.location.origin}${basePath}#${encodedAppState()}`;
    return url;
  });
  const downloadUrl = createMemo(() => {
    return URL.createObjectURL(
      new Blob([decodeURI(encodedAppState())], {
        type: "application/json",
      }),
    );
  });
  onCleanup(() => {
    URL.revokeObjectURL(downloadUrl());
  });

  const filename = createMemo(() => {
    const names = experiments.map((e) => e.config.reference.name).join("-");
    return `class-${names.slice(0, 120)}.json`;
  });

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shareableLink());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset copied state after 2 seconds
      showToast({
        title: "Share link copied to clipboard",
        duration: 1000,
      });
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  }

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (open) {
      setTimeout(() => {
        inputRef?.focus();
        inputRef?.select();
      }, 0);
    }
  };

  return (
    <Dialog open={open()} onOpenChange={handleOpenChange}>
      <DialogTrigger class="flex items-center gap-2 border-transparent border-b-2 hover:border-sky-600">
        Share <MdiShareVariantOutline />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle class="mr-10">Share link</DialogTitle>
        </DialogHeader>
        <Show
          when={shareableLink().length < MAX_SHAREABLE_LINK_LENGTH}
          fallback={
            <>
              <p>
                Cannot embed application state in shareable link, it is too
                large.
              </p>
              <p>
                Alternatively you can create your own shareable link by hosting
                the state remotely:
              </p>
              <ol class="list-inside list-decimal space-y-1">
                <li>
                  <a
                    class="underline"
                    href={downloadUrl()}
                    download={filename()}
                    type="application/json"
                  >
                    Download state
                  </a>{" "}
                  as file
                </li>
                <li>
                  Upload the state file to some static hosting service like your
                  own web server or an AWS S3 bucket.
                </li>
                <li>
                  Open the CLASS web application with
                  "https://classmodel.github.io/class-web?s=&lt;your remote
                  url&gt;".
                </li>
              </ol>
              <p>
                Make sure the CLASS web application is{" "}
                <a
                  href="https://enable-cors.org/server.html"
                  target="_blank"
                  rel="noreferrer"
                  class="underline"
                >
                  allowed to download from remote location
                </a>
                .
              </p>
            </>
          }
        >
          <Show
            when={experiments.length > 0}
            fallback={
              <p>Nothing to share. Please add at least one experiment.</p>
            }
          >
            <div>
              Anyone with{" "}
              <a
                target="_blank"
                rel="noreferrer"
                class="font-medium underline underline-offset-4"
                href={shareableLink()}
              >
                this link
              </a>{" "}
              will be able to view the current application state in their web
              browser.
            </div>
            <div class="flex items-center space-x-2">
              <TextField class="w-full" defaultValue={shareableLink()}>
                <TextFieldInput
                  ref={inputRef}
                  type="text"
                  readonly
                  class="w-full"
                  aria-label="Shareable link for current application state"
                />
              </TextField>
              <Button
                type="submit"
                variant="outline"
                size="icon"
                class="px-3"
                onClick={copyToClipboard}
                aria-label={isCopied() ? "Link copied" : "Copy link"}
              >
                <span class="sr-only">Copy</span>
                <Show when={isCopied()} fallback={<MdiClipboard />}>
                  <MdiClipboardCheck />
                </Show>
              </Button>
            </div>
          </Show>
        </Show>
        <div aria-live="polite" class="sr-only">
          <Show when={isCopied()}>Link copied to clipboard</Show>
        </div>
      </DialogContent>
    </Dialog>
  );
}
