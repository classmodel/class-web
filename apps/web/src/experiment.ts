import {
  ClassConfig,
  classDefaultConfig,
  classDefaultConfigSchema,
  ClassOutput,
} from "@repo/class/class";

import { counter } from "./utils";

let _id = counter();

export class Experiment {
  name = "Default experiment";
  description = "Default experiment";
  id = _id.next().value;
  settings: ClassConfig = classDefaultConfig.parse({});
  output: ClassOutput = {};
}

export function experimentCard(
  experiment: Experiment,
  onConfigure: CallableFunction,
  onRemove: CallableFunction
) {
  const article = document.createElement("article");

  // Main ui
  article.innerHTML = /*html*/ `
    <nav>
        <ul>
            <li><strong>Experiment ${experiment.id}</strong></li>
        </ul>
        <ul>
            <li><button class="remove outline contrast"><strong>X</strong></button></li>
        </ul>
    </nav>

    <p>${experiment.description}</p>
    <button class="configure">
        Configure experiment
    </button>
  `;

  article.querySelector(".configure")!.addEventListener("click", () => {
    showSettingsDialog(onConfigure);
  });

  // The remove button should trigger actions outside this scope, so use a
  // callback for additional removal actions
  article.querySelector(".remove")!.addEventListener("click", () => {
    article.remove();
    onRemove();
  });

  return article;
}

function showSettingsDialog(onConfigure: CallableFunction) {
  // Populate the dialog with a form for this experiment
  const dialog = document.querySelector("dialog")!;
  const article = document.createElement("article");
  dialog.appendChild(article);
  article.innerHTML = buildForm();
  // TODO: form should include current state of experiment

  // Form submit should close the form but also trigger other actions like
  // starting a simulation
  article.querySelector("button")!.addEventListener("click", () => {
    // Parse form
    const form = article.querySelector("form")!;
    const formData = new FormData(form);
    const formDataObject = Object.fromEntries(formData);
    const parsedConfig = classDefaultConfig.parse(formDataObject);

    // Get out of the way
    dialog.close();

    // Trigger additional actions in outer scope
    onConfigure(parsedConfig);

    // Clean up DOM so we have a clean slate for the next form
    article.remove();
  });

  dialog.showModal();
}

export function buildForm(defaults = classDefaultConfigSchema) {
  // TODO combine "defaults" with previous state
  const settings = defaults.definitions.classDefaultConfig.properties;
  const settingsArray: object[] = [];
  Object.keys(settings).forEach((key) => {
    settingsArray.push({ ...settings[key], name: key });
  });
  return /*html*/ `
          <header>
              <h2>Configure your CLASS experiment</h2>
          </header>
          <form>
              ${settingsArray.map((setting) => asFieldSet(setting)).join("")}
          </form>
          <footer>

              <button>Start simulation</button>
          </footer>
          `;
}

function asFieldSet(setting: any) {
  // TODO get proper types for setting
  // TODO work for other types than number/range
  // TODO replace with form generator from external lib?
  return /*html*/ `
            <fieldset role="group">
                <label for="${setting.name}">
                <small id="${setting.name}-description">${setting.description}</small>
                <input
                    type="range"
                    value="${setting.default}"
                    min="${setting.minimum}"
                    max="${setting.maximum}"
                    name="${setting.name}"
                    aria-label="${setting.name}"
                    aria-describedby="${setting.name}-description"
                />
                </label>
            </fieldset>
        `;
}
