import { type PartialConfig, mergeConfigurations } from "./config_utils.js";

export interface Sweep {
  section: string; // Only handles single level nesting
  parameter: string;
  start: number;
  step: number;
  steps: number;
}

function cartesianProduct(values: PartialConfig[][]): PartialConfig[] {
  if (values.length === 0) return [];
  return values.reduce(
    (acc, curr) =>
      acc.flatMap((a) => curr.map((b) => mergeConfigurations(a, b))),
    [{}],
  );
}
export function performSweep(sweeps: Sweep[]): PartialConfig[] {
  if (sweeps.length === 0) {
    return [];
  }

  const values = [];
  for (const sweep of sweeps) {
    const sweepValues = [];
    for (let i = 0; i < sweep.steps; i++) {
      const value = Number.parseFloat(
        (sweep.start + i * sweep.step).toFixed(4),
      );
      const perm = {
        [sweep.section]: {
          [sweep.parameter]: value,
        },
      };
      sweepValues.push(perm);
    }
    values.push(sweepValues);
  }

  return cartesianProduct(values);
}
