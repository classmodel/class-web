import { uploadExperiment } from "~/lib/store";

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
    file.text().then((body) => {
      const rawData = JSON.parse(body);
      uploadExperiment(rawData);
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
