import { CLASS } from "./class";
import { classConfig, ClassConfig } from "./config";

export type ClassOutput = Record<string, number[]>;

export function runClass(config: ClassConfig): ClassOutput {
  console.log("CLASS called with the following config", config);

  // TODO should we do validation/coercion here, in form, or both?
  const validatedConfig = classConfig.parse(config);
  const model = new CLASS(validatedConfig);
  const output: ClassOutput = { t: [], h: [] };

  while (model.t < config.timeControl.runtime) {
    model.update();

    console.log(model.t, model.h);

    output.t.push(model.t);
    output.h.push(model.h);
  }

  return output;
}