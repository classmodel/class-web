import type { ClassOutput } from "@classmodel/class/runner";
import type { PartialConfig } from "@classmodel/class/validate";

// Get vertical profiles for a single class run
export function getVerticalProfiles(
  output: ClassOutput | undefined,
  config: PartialConfig,
  variable: "theta" | "q" = "theta",
  t = -1,
): { x: number[]; y: number[] } {
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
