import { ClassConfig, runClass } from "@repo/class/class";

const parseForm = () => {
  const form = document.getElementById("form")!;
  const formData = new FormData(form);
  const formObject: Partial<Record<keyof ClassConfig, any>> =
    Object.fromEntries(formData);
  // TODO cast form values to correct types.
  let output = runClass(formObject as ClassConfig);

  console.log(output);
  sessionStorage.setItem("classOutput", JSON.stringify(output));
  return output;
};

function updateOutput() {
  const classOutput = sessionStorage.getItem("classOutput") || "";

  const outputCard = document.getElementById("outputBody")!;
  outputCard.innerHTML = classOutput;
}

document
  .getElementById("form")
  ?.addEventListener("submit", (e: SubmitEvent) => {
    e.preventDefault();
    parseForm();
    updateOutput();
    // TODO: close modal
  });
