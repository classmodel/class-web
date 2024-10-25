import type { ClassOutput } from "@classmodel/class/runner";
import type { PartialConfig } from "@classmodel/class/validate";
import type { Experiment } from "./store";

interface VerticalProfileData {
  h: number[];
  theta: number[];
  q: number[];
}

interface ExperimentVerticalProfileData {
  reference: VerticalProfileData;
  permutations: VerticalProfileData[];
}

// Get vertical profiles for a single class run
export function getVerticalProfiles(
  output: ClassOutput | undefined,
  config: PartialConfig,
  t: number
): VerticalProfileData {
  if (output === undefined) {
    return { h: [], theta: [], q: [] };
  }

  // Extract height profile
  const height = output.h.slice(t)[0];
  const dh = 400; // how much free troposphere to display?
  const h = [0, height, height, height + dh];

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

  // Extract humidity profile
  const qs = output.q.slice(t)[0];
  const dq = output.dq.slice(t)[0];
  const gammaq = config.mixedLayer?.gammaq;
  const q = [qs, qs, qs + dq, qs + dq + dh * gammaq];
  return { h, theta, q };
}

// Get vertical profiles for reference + all permutations of experiment
export function getExperimentVerticalProfiles(
  experiment: Experiment,
  t = -1
): ExperimentVerticalProfileData {
  const reference = experiment.reference;

  const permutations = experiment.permutations.map((p) => {
    // TODO get additional config info from reference
    return {
      ...getVerticalProfiles(p.output, p.config, t),
    };
  });

  return {
    reference: getVerticalProfiles(reference.output, reference.config, t),
    permutations,
  };
}
