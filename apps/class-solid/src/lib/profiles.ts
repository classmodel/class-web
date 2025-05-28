import type { Config } from "@classmodel/class/config";
import type { ClassOutput } from "@classmodel/class/output";
import { findInsertIndex } from "@classmodel/class/utils";
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

  if (variable === "theta") {
    let z = output.h.slice(t)[0];
    let theta = output.theta.slice(t)[0];
    const dtheta = output.dtheta.slice(t)[0];
    const gamma_theta = config.gamma_theta;
    const z_theta = config.z_theta;
    const maxHeight = z_theta.slice(-1)[0];

    // Mixed layer
    const profile = [
      { x: theta, y: 0 },
      { x: theta, y: z },
    ];

    // Inversion
    theta += dtheta;
    profile.push({ x: theta, y: z });

    // Free troposphere
    while (z < maxHeight) {
      const idx = findInsertIndex(z_theta, z);
      const lapse_rate = gamma_theta[idx] ?? 0;
      const dz = z_theta[idx] - z;
      z += dz;
      theta += lapse_rate * dz;
      profile.push({ x: theta, y: z });
    }
    return profile;
  }

  if (variable === "q") {
    let z = output.h.slice(t)[0];
    let q = output.q.slice(t)[0];
    const dq = output.dq.slice(t)[0];
    const gamma_qt = config.gamma_qt;
    const z_qt = config.z_qt;
    const maxHeight = z_qt.slice(-1)[0];

    // Mixed layer
    const profile = [
      { x: q, y: 0 },
      { x: q, y: z },
    ];

    // Inversion
    q += dq;
    profile.push({ x: q, y: z });

    // Free troposphere
    while (z < maxHeight) {
      const idx = findInsertIndex(z_qt, z);
      const lapse_rate = gamma_qt[idx] ?? 0;
      const dz = z_qt[idx] - z;
      z += dz;
      q += lapse_rate * dz;
      profile.push({ x: q, y: z });
    }
    return profile;
  }

  if (config.sw_wind && variable === "u") {
    let z = output.h.slice(t)[0];
    let u = output.u.slice(t)[0];
    const du = output.du.slice(t)[0];
    const gammau = config.gamma_u;
    const z_u = config.z_u;
    const maxHeight = z_u.slice(-1)[0];

    // Mixed layer
    const profile = [
      { x: u, y: 0 },
      { x: u, y: z },
    ];

    // Inversion
    u += du;
    profile.push({ x: u, y: z });

    // Free troposphere
    while (z < maxHeight) {
      const idx = findInsertIndex(z_u, z);
      const lapse_rate = gammau[idx] ?? 0;
      const dz = z_u[idx] - z;
      z += dz;
      u += lapse_rate * dz;
      profile.push({ x: u, y: z });
    }
    return profile;
  }

  if (config.sw_wind && variable === "v") {
    let z = output.h.slice(t)[0];
    let v = output.v.slice(t)[0];
    const dv = output.dv.slice(t)[0];
    const gammav = config.gamma_v;
    const z_v = config.z_v;
    const maxHeight = z_v.slice(-1)[0];

    // Mixed layer
    const profile = [
      { x: v, y: 0 },
      { x: v, y: z },
    ];

    // Inversion
    v += dv;
    profile.push({ x: v, y: z });

    // Free troposphere
    while (z < maxHeight) {
      const idx = findInsertIndex(z_v, z);
      const lapse_rate = gammav[idx] ?? 0;
      const dz = z_v[idx] - z;
      z += dz;
      v += lapse_rate * dz;
      profile.push({ x: v, y: z });
    }
    return profile;
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
  const gamma_theta = config.gamma_theta;
  const gamma_qt = config.gamma_qt;
  const z_theta = config.z_theta;
  const z_qt = config.z_qt;

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
  let z = zArrayMixedLayer.slice(-1)[0];
  dz = 200;
  while (p > 100) {
    // Note: idx can exceed length of anchor points, then lapse becomes undefined and profile stops
    const idx_th = findInsertIndex(z_theta, z);
    const lapse_theta = gamma_theta[idx_th];
    const idx_q = findInsertIndex(z_qt, z);
    const lapse_q = gamma_qt[idx_q];
    theta += dz * lapse_theta;
    q += dz * lapse_q;
    p += pressureDiff(T, q, p, dz);
    z += dz;
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
      const { u, v } = windSpeedDirectionToUV(
        obs.windSpeed[i],
        obs.windDirection[i],
      );

      switch (variable) {
        case "theta":
          return { y: h, x: theta };
        case "q":
          return { y: h, x: q };
        case "u":
          return { y: h, x: u };
        case "v":
          return { y: h, x: v };
        default:
          throw new Error(`Unknown variable '${variable}'`);
      }
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

function windSpeedDirectionToUV(
  speed: number,
  directionDeg: number,
): { u: number; v: number } {
  const directionRad = (directionDeg * Math.PI) / 180;

  const u = -speed * Math.sin(directionRad); // zonal (east-west)
  const v = -speed * Math.cos(directionRad); // meridional (north-south)

  return { u, v };
}
