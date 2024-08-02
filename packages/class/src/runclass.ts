import { CLASS } from "./class";
import { classConfig } from "./config";
import type { ClassOutput } from "./runner";

const config = classConfig.parse({});
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
