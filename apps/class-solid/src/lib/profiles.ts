import type { ClassOutput } from "@classmodel/class/runner";
import type { PartialConfig } from "@classmodel/class/validate";
import type { ChartData } from "../components/LinePlot";
import type { Experiment } from "./store";

interface ChartDataXY {
  x: number[];
  y: number[];
}

// Get vertical profiles for a single class run
export function getVerticalProfiles(
  output: ClassOutput | undefined,
  config: PartialConfig,
  variable: "theta" | "q" = "theta",
  t = -1
): ChartDataXY {
  // Guard against undefined output
  if (output === undefined) {
    return { y: [], x: [] };
  }

  // Extract height profile
  const height = output.h.slice(t)[0];
  const dh = 400; // how much free troposphere to display?
  const h = [0, height, height, height + dh];

  if (variable === "theta") {
    // Extract potential temperature profile
    const thetas = output.theta.slice(t)[0];
    const dtheta = output.dtheta.slice(t)[0];
    const gammatheta = config.mixedLayer?.gammatheta;
    const theta = [
      thetas,
      thetas,
      thetas + dtheta,
      thetas + dtheta + dh * gammatheta,
    ];
    return { y: h, x: theta };
  }

  if (variable === "q") {
    // Extract humidity profile
    const qs = output.q.slice(t)[0];
    const dq = output.dq.slice(t)[0];
    const gammaq = config.mixedLayer?.gammaq;
    const q = [qs, qs, qs + dq, qs + dq + dh * gammaq];
    return { y: h, x: q };
  }

  return { y: [], x: [] };
}

// Get vertical profiles for reference + all permutations of experiment
export function getExperimentVerticalProfiles(
  experiment: Experiment,
  variable: "theta" | "q" = "theta",
  t = -1
): ChartData[] {
  const reference = experiment.reference;
  const permutations = experiment.permutations.map((p) => {
    // TODO get additional config info from reference
    // permutations probably usually don't have gammaq/gammatetha set?
    return {
      label: `${experiment.name}/${p.name}`,
      ...getVerticalProfiles(p.output, p.config, variable, t),
    };
  });

  return [
    {
      label: experiment.name,
      ...getVerticalProfiles(reference.output, reference.config, variable, t),
    },
    ...permutations,
  ];
}
