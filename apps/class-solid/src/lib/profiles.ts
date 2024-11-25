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
    // TODO: make sure config contains gammatheta
    const gammatheta = config.mixedLayer?.gammatheta ?? 0.006;
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
    // TODO: make sure config contains gammaq
    const gammaq = config.mixedLayer?.gammaq ?? 0;
    const q = [qs, qs, qs + dq, qs + dq + dh * gammaq];
    return { y: h, x: q };
  }

  return { y: [], x: [] };
}

/**
 * https://en.wikipedia.org/wiki/Dew_point#Calculating_the_dew_point
 */
const dewpoint = (q: number, p: number) => {
  // Empirical fit parameters (Sonntag1990, see wikipedia entry for more options)
  const A = 6.112;
  const B = 17.62;
  const C = 243.12;

  const w = q / (1 - q); // mixing ratio
  const e = (w * p) / (w + 0.622); // Actual vapour pressure; Wallace and Hobbs 3.59

  const Td = (C * Math.log(e / A)) / (B - Math.log(e / A));

  return Td + 273.15;
};

/**
 * Calculate temperature from potential temperature
 * https://unidata.github.io/MetPy/latest/api/generated/metpy.calc.temperature_from_potential_temperature.html#
 */
const thetaToT = (theta: number, p: number, p0 = 1000) => {
  const R = 287; // specific gas constant for dry air
  const cp = 1004; // specific heat of dry air at constant pressure
  const T = theta * (p / p0) ** (R / cp);
  return T;
};

/**
 * Calculate pressure difference over layer using hypsometric equation
 * Wallace & Hobbs eq (3.23)
 */
const pressureDiff = (T: number, q: number, p: number, dz: number) => {
  const Rd = 287; // specific gas constant for dry air
  const g = 9.81; // gravity
  const w = q / (1 - q); // mixing ratio
  const Tv = T * (1 + 0.61 * w); // virtual temperature
  const dp = (dz * p * g) / (Rd * Tv);
  return -dp;
};

/**
 * Calculate thickness of layer using hypsometric equation
 * Wallace & Hobbs eq (3.23)
 */
const thickness = (T: number, q: number, p: number, dp: number) => {
  const Rd = 287; // specific gas constant for dry air
  const g = 9.81; // gravity
  const w = q / (1 - q); // mixing ratio
  const Tv = T * (1 + 0.61 * w); // virtual temperature
  const dz = (dp * Rd * Tv) / (p * g);
  return dz;
};

export function getThermodynamicProfiles(
  output: ClassOutput | undefined,
  config: PartialConfig,
  t = -1,
) {
  // Guard against undefined output
  if (output === undefined) {
    return [];
  }

  let theta = output.theta.slice(t)[0];
  let q = output.q.slice(t)[0];
  const dtheta = output.dtheta.slice(t)[0];
  const dq = output.dq.slice(t)[0];
  const h = output.h.slice(t)[0];
  // TODO: ensure config contains gammatheta and gammaq
  const gammaTheta = config.mixedLayer?.gammatheta ?? 0.006;
  const gammaq = config.mixedLayer?.gammaq ?? 0;

  const nz = 25;
  let dz = h / nz;
  const zArrayMixedLayer = [...Array(nz).keys()].map((i) => i * dz);

  let p = 1000; // hPa??
  let T = theta;
  let Td = dewpoint(q, p);
  const soundingData: { p: number; T: number; Td: number }[] = [{ p, T, Td }];

  // Mixed layer
  for (const z of zArrayMixedLayer) {
    p += pressureDiff(T, q, p, dz);
    T = thetaToT(theta, p);
    Td = dewpoint(q, p);

    soundingData.push({ p, T, Td });
  }

  // Inversion
  theta += dtheta;
  q += dq;
  T = thetaToT(theta, p);
  Td = dewpoint(q, p);
  soundingData.push({ p, T, Td });

  // Free troposphere
  dz = 200;
  while (p > 100) {
    theta += dz * gammaTheta;
    q += dz * gammaq;
    p += pressureDiff(T, q, p, dz);
    T = thetaToT(theta, p);
    Td = dewpoint(q, p);

    soundingData.push({ p, T, Td });
  }

  return soundingData;
}
