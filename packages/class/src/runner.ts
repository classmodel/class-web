import { CLASS } from "./class";
import type { Config } from "./config";
import { parse } from "./validate";

export type ClassOutput = Record<string, number[]>;

export function runClass(config: Config): ClassOutput {
  // TODO should we do validation/coercion here, in form, or both?
  const validatedConfig = parse(config);
  const model = new CLASS(validatedConfig);
  const output: ClassOutput = { t: [], h: [] };

  while (model.t < config.timeControl.runtime) {
    model.update();

    if (model.t % 60 === 0) {
      output.t.push(model.t);
      output.h.push(model.h);
    }
  }

  return output;
}
