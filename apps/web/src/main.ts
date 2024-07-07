import "./style.scss";
import { experimentCard, outputCard } from "./components/cards";
import { buildForm, parseForm } from "./components/form";
import { runClass, defaultSettings, ClassOutput } from "@repo/class/class";

// Populate experiments section
const experimentsSection = document.getElementById("experiments")!;
experimentsSection.innerHTML += experimentCard();

// Add modal
function openSettingsDialog() {
  const modal = document.querySelector("dialog")!;
  modal.innerHTML = buildForm(defaultSettings); // TODO remember previous state
  function onsubmit() {
    const experimentSettings = parseForm();
    const output = runClass(experimentSettings); // TODO cast to correct type
    updateOutputCard(output);
    modal.close();
  }
  const button = modal.querySelector("button");
  button && button.addEventListener("click", () => onsubmit());
  modal.showModal();
  // TODO: fix typeerror "null is not a function" when button is clicked
}

const configureExperimentButton = document.getElementById(
  "configure-experiment"
)!;
configureExperimentButton.addEventListener("click", () => {
  openSettingsDialog();
});

// Populate output section
const outputSection = document.getElementById("output")!;
outputSection.innerHTML += outputCard(
  "Timeseries plot or vertical profile or radiosounding"
);
outputSection.innerHTML += outputCard("Simulation data in tabular form?");

function updateOutputCard(output: ClassOutput) {
  const card = outputSection.querySelector("article")!;
  card.querySelector("p")!.innerHTML = JSON.stringify(output);
}
