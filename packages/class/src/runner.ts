/**
 * This module contains the `runClass` function
 *
 * @module
 */
import { CLASS } from "./class.js";
import type { Config } from "./config.js";
import { type ClassOutput, outputVariables } from "./output.js";
import { parse } from "./validate.js";

/**
 * Runs the CLASS model with the given configuration and frequency.
 *
 * @param config - The configuration object for the CLASS model.
 * @param freq - The frequency in seconds at which to write output, defaults to 600.
 * @returns An object containing the output variables collected during the simulation.
 */
export function runClass(config: Config, freq = 600): ClassOutput {
  const validatedConfig = parse(config);
  const model = new CLASS(validatedConfig);

  const writeOutput = () => {
    for (const v of outputVariables) {
      const value = model.getValue(v.key);
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

    if (model.t % freq === 0) {
      writeOutput();
    }
  }

  return output;
}
