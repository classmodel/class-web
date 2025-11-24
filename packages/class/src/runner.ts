/**
 * This module contains the `runClass` function
 *
 * @module
 */
import { CLASS } from "./class.js";
import type { Config } from "./config.js";
import { type FirePlume, calculatePlume } from "./fire.js";
import {
  type ClassOutput,
  type OutputVariableKey,
  outputVariables,
} from "./output.js";
import { type ClassProfile, generateProfiles } from "./profiles.js";
import { parse } from "./validate.js";

type ClassTimeSeries = Record<OutputVariableKey, number[]>;
type ClassProfiles = ClassProfile[];
type ClassFirePlumes = FirePlume[];
export interface ClassData {
  timeseries: ClassTimeSeries;
  profiles?: ClassProfiles;
  plumes?: ClassFirePlumes;
}

/**
 * Runs the CLASS model with the given configuration and frequency.
 *
 * @param config - The configuration object for the CLASS model.
 * @param freq - The frequency in seconds at which to write output, defaults to 600.
 * @returns An object containing the output variables collected during the simulation.
 */
export function runClass(config: Config, freq = 600): ClassData {
  const validatedConfig = parse(config);
  const model = new CLASS(validatedConfig);

  const outputKeys = Object.keys(outputVariables) as OutputVariableKey[];

  const writeOutput = () => {
    const output: Partial<ClassOutput> = {};
    for (const key of outputKeys) {
      const value = model.getValue(key);
      if (value !== undefined) {
        output[key] = model.getValue(key);
        timeseries[key].push(value as number);
      }

      // Include profiles
      if (config.sw_ml) {
        const profile = generateProfiles(config, output as ClassOutput);
        profiles.push(profile);

        // Include fireplumes
        if (config.sw_fire) {
          const plume = calculatePlume(config, profile);
          plumes.push(plume);
        }
      }
    }
  };

  // Initialize output arrays
  const timeseries = Object.fromEntries(
    outputKeys.map((key) => [key, []]),
  ) as unknown as ClassTimeSeries;
  const profiles: ClassProfiles = [];
  const plumes: ClassFirePlumes = [];

  // Initial time
  writeOutput();

  // Update loop
  while (model.t <= config.runtime) {
    model.update();

    if (model.t % freq === 0) {
      writeOutput();
    }
  }

  // Construct ClassData
  if (config.sw_ml) {
    if (config.sw_fire) {
      return { timeseries, profiles, plumes };
    }
    return { timeseries, profiles };
  }
  return { timeseries };
}