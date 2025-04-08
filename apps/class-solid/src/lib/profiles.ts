import type { Config } from "@classmodel/class/config";
import type { ClassOutput } from "@classmodel/class/runner";
import type { Point } from "~/components/plots/Line";
import type { Observation } from "./experiment_config";

// Get vertical profiles for a single class run
export function getVerticalProfiles(
  output: ClassOutput | undefined,
  config: Config,
  variable = "theta",
  t = -1,
): Point[] {
  // Guard against undefined output
  if (output === undefined || !config.sw_ml) {
    return [];
  }

  // Extract height profile
  const height = output.h.slice(t)[0];
  const dh = 1600; // how much free troposphere to display?
  const hProfile = [0, height, height, height + dh];
  if (variable === "theta") {
    // Extract potential temperature profile
    const theta = output.theta.slice(t)[0];
    const dtheta = output.dtheta.slice(t)[0];
    const gammatheta = config.gammatheta;
    const thetaProfile = [
      theta,
      theta,
      theta + dtheta,
      theta + dtheta + dh * gammatheta,
    ];
    return hProfile.map((h, i) => ({ x: thetaProfile[i], y: h }));
  }
  if (variable === "q") {
    // Extract humidity profile
    const q = output.q.slice(t)[0];
    const dq = output.dq.slice(t)[0];
    const gammaq = config.gammaq;
    const qProfile = [q, q, q + dq, q + dq + dh * gammaq];
    return hProfile.map((h, i) => ({ x: qProfile[i], y: h }));
  }
  return [];
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
 * Calculate potential temperature from temperature
 */
const tToTheta = (T: number, p: number, p0 = 1000) => {
  const R = 287; // specific gas constant for dry air
  const cp = 1004; // specific heat of dry air at constant pressure
  const theta = T * (p / p0) ** -(R / cp);
  return theta;
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

function calculateSpecificHumidity(T: number, p: number, rh: number) {
  // Constants
  const epsilon = 0.622; // Ratio of gas constants for dry air and water vapor
  const es0 = 6.112; // Reference saturation vapor pressure in hPa

  // Calculate saturation vapor pressure (Tetens formula)
  const es = es0 * Math.exp((17.67 * (T - 273.15)) / (T - 29.65));

  // Actual vapor pressure
  const e = (rh / 100) * es;

  // Mixing ratio (kg/kg)
  const w = (epsilon * e) / (p - e);

  // Specific humidity
  return w / (1 + w);
}

export function getThermodynamicProfiles(
  output: ClassOutput | undefined,
  config: Config,
  t = -1,
) {
  // Guard against undefined output
  if (output === undefined || !config.sw_ml) {
    return [];
  }

  let theta = output.theta.slice(t)[0];
  let q = output.q.slice(t)[0];
  const dtheta = output.dtheta.slice(t)[0];
  const dq = output.dq.slice(t)[0];
  const h = output.h.slice(t)[0];
  const gammaTheta = config.gammatheta;
  const gammaq = config.gammaq;

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

export function observationsForProfile(obs: Observation, variable = "theta") {
  return {
    label: obs.name,
    color: "#000000",
    linestyle: "none",
    data: obs.height.map((h, i) => {
      const T = obs.temperature[i] + 273.15;
      const rh = obs.relativeHumidity[i];
      const p = obs.pressure[i];
      const theta = tToTheta(T, p);
      const q = calculateSpecificHumidity(T, p, rh);
      if (variable === "theta") {
        return { y: h, x: theta };
      }
      return { y: h, x: q };
    }),
  };
}

export function observationsForSounding(obs: Observation) {
  return {
    data: obs.height.map((h, i) => {
      const T = obs.temperature[i] + 273.15;
      const p = obs.pressure[i];
      const rh = obs.relativeHumidity[i];
      const q = calculateSpecificHumidity(T, p, rh);
      const Td = dewpoint(q, p);
      return { p, T, Td };
    }),
    label: obs.name,
    color: "#000000",
    linestyle: "none",
  };
}
