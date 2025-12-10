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

import simplify from "simplify-js";

import { type Parcel, calculatePlume } from "./fire.js";
import { generateProfiles } from "./profiles.js";
import { parse } from "./validate.js";

export type TimeSeries0D = Record<OutputVariableKey, number[]>;
export type TimeSeries1D = Record<string, { x: number; y: number }[][]>;

export interface ClassData {
  timeseries: TimeSeries0D;
  profiles?: TimeSeries1D;
  plumes?: TimeSeries1D;
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

  // Initialize output arrays
  const timeseries = Object.fromEntries(
    outputKeys.map((key) => [key, []]),
  ) as unknown as TimeSeries0D;
  const profiles: TimeSeries1D = {};
  const plumes: TimeSeries1D = {};

  // Helper function to parse class output
  // calculate profiles and fireplumes,
  // and export as timeseries
  const writeOutput = () => {
    const output: Partial<ClassOutput> = {};

    // Generate timeseries
    for (const key of outputKeys) {
      const value = model.getValue(key);
      if (value !== undefined) {
        output[key] = model.getValue(key);
        timeseries[key].push(value as number);
      }
    }

    // Generate profiles
    const keysToAlign = ["p", "T", "Td"];
    if (config.sw_ml) {
      const profile = generateProfiles(config, output as ClassOutput);
      const profileXY = profileToXY(profile as unknown as Profile);
      const simplifiedProfile = simplifyProfile(profileXY, 0.01, keysToAlign);

      for (const key of Object.keys(simplifiedProfile)) {
        profiles[key] = profiles[key] || []; // Initialize if not exists
        profiles[key].push(simplifiedProfile[key]);
      }

      // Generate plumes
      if (config.sw_fire) {
        const plume = calculatePlume(config, profile);
        const plumeXY = plumeToXY(plume);
        const simplifiedPlume = simplifyProfile(plumeXY, 0.01, keysToAlign);

        for (const key of Object.keys(simplifiedPlume)) {
          plumes[key] = plumes[key] || [];
          plumes[key].push(simplifiedPlume[key]);
        }
      }
    }
  };

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

type Profile = Record<string, number[]> & { z: number[] };

/**
 *
 * Convert a profile like {z: [], theta: [], qt: [], ...}
 * to a profile like: {theta: {x: [], y: []}, qt: {x: [], y:[]}, ...}
 *
 * Useful to simplify profiles independently for each variable
 * and also to quickly obtain the data for a line plot
 */
function profileToXY(
  profile: Profile,
): Record<string, { x: number; y: number }[]> {
  const result: Record<string, { x: number; y: number }[]> = {};

  for (const key of Object.keys(profile)) {
    const values = profile[key];
    if (!Array.isArray(values)) continue;

    // z is always the height
    const z = profile.z;

    result[key] = values.map((v, i) => ({ x: v, y: z[i] }));
  }

  return result;
}

function plumeToXY(plume: Parcel[]) {
  const vars = Object.keys(plume[0]).filter((k) => k !== "z");
  const result: Record<string, { x: number; y: number }[]> = {};

  for (const v of vars) result[v] = [];

  for (const row of plume) {
    for (const v of vars) {
      result[v].push({ x: row[v as keyof Parcel], y: row.z });
    }
  }
  return result;
}

/**
 * Compress a line by discarding points that are within a certain relative tolerance.
 * Using the simplify-js package, which implements the
 * Ramer-Douglas-Peucker algorithm
 */
function simplifyLine(
  line: { x: number; y: number }[],
  tolerance = 0.01,
): { x: number; y: number }[] {
  if (line.length <= 2) return line; // Nothing to simplify

  const xs = line.map((p) => p.x);
  const ys = line.map((p) => p.y);
  const xRange = Math.max(...xs) - Math.min(...xs);
  const yRange = Math.max(...ys) - Math.min(...ys);
  const relTol = Math.min(xRange, yRange) * tolerance;

  const simplified = simplify(line, relTol, true);
  // console.log(`Simplified from ${line.length} to ${simplified.length} points`);
  // console.log(`Simplified`);
  return simplified;
}

/**
 * Simplify and optionally align a profile.
 *
 * @param profileXY - Profile in {x: number; y: number}[] format
 * @param tolerance - Relative tolerance for simplification (default 0.01)
 * @param alignKeys - Array of variable keys to align. If `true`, align all. If `false` or empty, skip alignment.
 * @returns The simplified (and optionally partially aligned) profile
 */
function simplifyProfile(
  profileXY: Record<string, { x: number; y: number }[]>,
  tolerance = 0.01,
  alignKeys: string[] | true | false = true,
): Record<string, { x: number; y: number }[]> {
  // Simplify each variable
  const simplified: Record<string, { x: number; y: number }[]> = {};
  for (const key in profileXY) {
    simplified[key] = simplifyLine(profileXY[key], tolerance);
  }

  // Decide which keys to align
  let keysToAlign: string[];
  if (alignKeys === true) {
    keysToAlign = Object.keys(profileXY);
  } else if (Array.isArray(alignKeys) && alignKeys.length > 0) {
    keysToAlign = alignKeys;
  } else {
    return simplified; // nothing to align
  }

  // Step 3: Build union Z grid only for keys to align
  const zSet = new Set<number>(
    keysToAlign.flatMap((key) => simplified[key]?.map((pt) => pt.y) ?? []),
  );

  // console.log(zSet.size);

  // Align selected variables using original profileXY
  for (const key of keysToAlign) {
    if (profileXY[key]) {
      simplified[key] = profileXY[key].filter((pt) => zSet.has(pt.y));
    }
  }

  return simplified;
}
