import type { PartialConfig } from "./validate.js";

export interface Sweep {
  section: string;
  parameter: string;
  start: number;
  step: number;
  steps: number;
}
function cartesianProduct(values: PartialConfig[][]): PartialConfig[] {
  if (values.length === 0) return [];
  return values.reduce(
    (acc, curr) => {
      return acc.flatMap((a) =>
        curr.map((b) => {
          // TODO move config merging to a separate function or reuse
          // TODO make recursive and handle literals and arrays
          const merged = { ...a };
          for (const [section, params] of Object.entries(b)) {
            merged[section as keyof typeof merged] = {
              ...merged[section as keyof typeof merged],
              ...params,
            };
          }
          return merged;
        }),
      );
    },
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
