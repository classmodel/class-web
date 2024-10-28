import { Show, createMemo, createSignal } from "solid-js";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { TextField, TextFieldInput } from "./ui/text-field";
import { showToast } from "./ui/toast";

export function ShareButton() {
  const [open, setOpen] = createSignal(false);
  const [isCopied, setIsCopied] = createSignal(false);
  let inputRef: HTMLInputElement | undefined;
  const shareableLink = createMemo(() => {
    if (!open()) {
      return "";
    }

    const appState = encodeAppState(experiments, analyses);
    const url = `${window.location.origin}#${appState}`;
    return url;
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
      {/* TODO disable when there are zero experiments or analyses */}
      <DialogTrigger class="flex items-center gap-2 border-transparent border-b-2 hover:border-sky-600">
        Share <MdiShareVariantOutline />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle class="mr-10">Share link</DialogTitle>
          <DialogDescription>
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
          </DialogDescription>
        </DialogHeader>

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
        <div aria-live="polite" class="sr-only">
          <Show when={isCopied()}>Link copied to clipboard</Show>
        </div>
      </DialogContent>
    </Dialog>
  );
}
