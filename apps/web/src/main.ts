import "./style.scss";
import { outputCard } from "./output";
import { runClass, ClassConfig } from "@repo/class/class";
import { Experiment, experimentCard } from "./experiment";
import { Output } from "./output";

const experiments: Experiment[] = [];

// Populate experiments section
const experimentsSection = document.getElementById("experiments")!;
const addExperimentButton = document.getElementById("addExperiment")!;
addExperimentButton.addEventListener("click", () => addExperiment());

function addExperiment() {
  alert(
    "Adding experiment. In the future this could go straight to the configuration dialog. Alternatively, perhaps you could have a choice between some defaults or custom experiments"
  );
  const experiment = new Experiment();
  experiments.push(experiment);

  const onConfigure = (settings: ClassConfig) => {
    // Retrieve settings, update state, and start experiment
    experiment.settings = settings;
    const output = runClass(settings);
    experiment.output = output;
    alert(
      "Received output from class: \n" +
        JSON.stringify(output) +
        "\n In the future, this should trigger updates of the outputs."
    );
  };

  const onRemove = () => {
    // Update app state
    experiments.splice(experiments.indexOf(experiment), 1);
  };

  // Add to UI
  const card = experimentCard(experiment, onConfigure, onRemove);
  experimentsSection.appendChild(card);
}

// Populate output section
const outputSection = document.getElementById("outputs")!;
const addOutputButton = document.getElementById("addOutput")!;
addOutputButton.addEventListener("click", () => addOutput());

const outputs = [];

function addOutput() {
  alert(
    "Adding output. In the future this should open a configuration form to select e.g. whether you want a timeseries or profile/sounding, and which experiments / variables should be  plotted."
  );
  const output = new Output();
  outputs.push(output);

  // Add to UI
  const card = outputCard(output);
  outputSection.appendChild(card);
}

// function updateOutput(output: ClassOutput) {
//   const card = outputSection.querySelector("article")!;
//   card.querySelector("p")!.innerHTML = JSON.stringify(output);
// }
