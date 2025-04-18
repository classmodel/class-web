/**
 * This module contains the `runClass` function
 *
 * @module
 */
import { CLASS } from "./class.js";
import type { Config } from "./config.js";
import { parse } from "./validate.js";

export interface OutputVariable {
  key: string;
  title: string;
  unit: string;
  symbol: string;
}

export const outputVariables: OutputVariable[] = [
  {
    key: "t",
    title: "Time",
    unit: "s",
    symbol: "t",
  },
  {
    key: "h",
    title: "ABL height",
    unit: "m",
    symbol: "h",
  },
  {
    key: "theta",
    title: "Potential temperature",
    unit: "K",
    symbol: "θ",
  },
  {
    key: "dtheta",
    title: "Potential temperature jump",
    unit: "K",
    symbol: "Δθ",
  },
  {
    key: "q",
    title: "Specific humidity",
    unit: "kg kg⁻¹",
    symbol: "q",
  },
  {
    key: "dq",
    title: "Specific humidity jump",
    unit: "kg kg⁻¹",
    symbol: "Δq",
  },
  {
    key: "dthetav",
    title: "Virtual temperature jump at h",
    unit: "K",
    symbol: "Δθᵥ",
  },
  {
    key: "we",
    title: "Entrainment velocity",
    unit: "m s⁻¹",
    symbol: "wₑ",
  },
  {
    key: "ws",
    title: "Large-scale vertical velocity",
    unit: "m s⁻¹",
    symbol: "wₛ",
  },
  {
    key: "wthetave",
    title: "Entrainment virtual heat flux",
    unit: "K m s⁻¹",
    symbol: "(w'θ')ᵥₑ",
  },
  {
    key: "wthetav",
    title: "Surface virtual heat flux",
    unit: "K m s⁻¹",
    symbol: "(w'θ')ᵥ",
  },
];

export type ClassOutput = {
  [K in (typeof outputVariables)[number]["key"]]: number[];
};

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
