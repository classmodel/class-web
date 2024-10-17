import { uploadExperiment } from "~/lib/store";
import { showToast } from "./ui/toast";

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
