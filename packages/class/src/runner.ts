/**
 * This module contains the `runClass` function
 *
 * @module
 */
import { CLASS } from "./class.js";
import type { Config } from "./config.js";
import {
  type ClassOutput,
  type OutputVariableKey,
  outputVariables,
} from "./output.js";
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

  const output_keys = Object.keys(outputVariables) as OutputVariableKey[];

  const writeOutput = () => {
    for (const key of output_keys) {
      const value = model.getValue(key);
      if (value !== undefined) {
        (output[key] as number[]).push(value as number);
      }
    }
  };

  const output = Object.fromEntries(
    output_keys.map((key) => [key, []]),
  ) as unknown as ClassOutput;

  // Initial time
  writeOutput();

  // Update loop
  while (model.t <= config.runtime) {
    model.update();

    if (model.t % freq === 0) {
      writeOutput();
    }
  }

  return output;
}
