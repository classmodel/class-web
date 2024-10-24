/**
 * Script to run Class model with default configuration.
 *
 * @module
 */
import { CLASS } from "./class";
import type { ClassOutput } from "./runner";
import { parse } from "./validate";

const config = parse({});
const model = new CLASS(config);
const output: ClassOutput = { t: [], h: [] };

while (model.t < config.timeControl.runtime) {
  model.update();

  if (model.t % 60 === 0) {
    output.t.push(model.t);
    output.h.push(model.h);
  }
}

console.log(output);
