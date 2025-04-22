/**
 * This module contains the `runClass` function
 *
 * @module
 */
import { CLASS } from "./class.js";
import type { Config } from "./config.js";
import { type ClassOutput, outputVariables } from "./output.js";
import { parse } from "./validate.js";

export function runClass(config: Config): ClassOutput {
  const validatedConfig = parse(config);
  const model = new CLASS(validatedConfig);

  const writeOutput = () => {
    for (const v of outputVariables) {
      const value =
        model[v.key as keyof CLASS] ?? (v.key === "t" ? model.t : undefined);
      if (value !== undefined) {
        (output[v.key] as number[]).push(value as number);
      }
    }
  };

  const output = Object.fromEntries(
    outputVariables.map((v) => [v.key, []]),
  ) as ClassOutput;

  // Initial time
  writeOutput();

  // Update loop
  while (model.t < config.runtime) {
    model.update();

    if (model.t % 600 === 0) {
      writeOutput();
    }
  }

  return output;
}
