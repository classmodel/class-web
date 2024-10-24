import { CLASS } from "./class.js";
import type { Config } from "./config.js";
import { parse } from "./validate.js";

export type ClassOutput = Record<string, number[]>;

export function runClass(config: Config): ClassOutput {
  // TODO should we do validation/coercion here, in form, or both?
  const validatedConfig = parse(config);
  const model = new CLASS(validatedConfig);
  const output: ClassOutput = { t: [], h: [] };
  const z: string = 1.2;

  while (model.t < config.timeControl.runtime) {
    model.update();

    if (model.t % 60 === 0) {
      output.t.push(model.t);
      output.h.push(model.h);
    }
  }

  return output;
}
