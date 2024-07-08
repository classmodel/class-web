import {
  classDefaultConfigSchema,
  classDefaultConfig,
  ClassConfig,
} from "@repo/class/class";

function asFieldSet(setting: object) {
  // TODO get proper types for setting
  // TODO work for other types than number/range
  // TODO replace with form generator from external lib?
  return /*html*/ `
        <fieldset role="group">
            <label for="${setting.name}">
            <small id="${setting.name}-description">${setting.description}</small>
            <input
                type="range"
                value="${setting.value}"
                min="${setting.min}"
                max="${setting.max}"
                name="${setting.name}"
                aria-label="${setting.name}"
                aria-describedby="${setting.name}-description"
            />
            </label>
        </fieldset>
    `;
}

export function buildForm(defaults = classDefaultConfigSchema) {
  // TODO combine "defaults" with previous state
  const settings = defaults.definitions.classDefaultConfig.properties;
  const settingsArray = Object.keys(settings).map((key) => settings[key]);
  return /*html*/ `
    <article>
        <header>
            <h2>Configure your CLASS experiment</h2>
        </header>
        <form>
            ${settingsArray.map((setting) => asFieldSet(setting)).join("")}
        </form>
        <footer>

            <button onclick=${onsubmit}()>Start simulation</button>
        </footer>
        </article>
        `;
}

export function parseForm(): ClassConfig {
  const form = document.querySelector("form")!;
  const formData = new FormData(form);
  const formDataObject = Object.fromEntries(formData);
  const parsedConfig = classDefaultConfig.parse(formDataObject);
  return parsedConfig;
}
