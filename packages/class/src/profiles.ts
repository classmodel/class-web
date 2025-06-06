// profiles.ts

import type { MixedLayerConfig, NoWindConfig, WindConfig } from "./config.js";
import type { ClassOutputAtSingleTime } from "./output.js";
import { dewpoint, virtualTemperature } from "./thermodynamics.js";

const CONSTANTS = {
  g: 9.81, // Gravity [m/s²]
  cp: 1004, // Specific heat of dry air at constant pressure [J/(kg·K)]
  Rd: 287, // Specific gas constant for dry air [J/(kg·K)]
};

/**
 * Atmospheric vertical profiles
 */
export interface ClassProfile {
  z: number[]; // Height levels (cell centers) [m]
  theta: number[]; // Potential temperature [K]
  thetav: number[]; // Virtual potential temperature [K]
  qt: number[]; // Total specific humidity [kg/kg]
  u: number[]; // U-component of wind [m/s]
  v: number[]; // V-component of wind [m/s]
  p: number[]; // Pressure [Pa]
  exner: number[]; // Exner function [-]
  T: number[]; // Temperature [K]
  Td: number[]; // Dew point temperature [K]
  rho: number[]; // Density [kg/m³]
}

export const NoProfile: ClassProfile = {
  z: [],
  theta: [],
  thetav: [],
  qt: [],
  u: [],
  v: [],
  p: [],
  exner: [],
  T: [],
  Td: [],
  rho: [],
};

/**
 * Generate vertical atmospheric profiles based on CLASS config + output
 */
export function generateProfiles(
  config: MixedLayerConfig & (WindConfig | NoWindConfig),
  output: ClassOutputAtSingleTime,
  dz = 1,
): ClassProfile {
  const { Rd, cp, g } = CONSTANTS;
  const { h, theta, qt, u, v, dtheta, dqt, du, dv } = output;
  const { z_theta, z_qt, gamma_theta, gamma_qt } = config;
  const { p0 } = config;

  // Determine top of profile based on the lowest z value across all variables
  const getLastValue = (arr: number[]) => arr[arr.length - 1];
  const zTop = Math.min(...[z_theta, z_qt].map(getLastValue));

  // Calculate piecewise profiles for potential temperature and specific humidity
  const z = arange(0 + dz / 2, zTop, dz);
  const thetaProf = piecewiseProfile(z, h, theta, dtheta, z_theta, gamma_theta);
  const qtProfile = piecewiseProfile(z, h, qt, dqt, z_qt, gamma_qt);

  // For pressure calculation, we need profiles on half-levels
  const zh = arange(0, zTop + dz / 2, dz);
  const thetah = piecewiseProfile(zh, h, theta, dtheta, z_theta, gamma_theta);
  const qth = piecewiseProfile(zh, h, qt, dqt, z_qt, gamma_qt);

  // Calculate virtual temperature, asssume base state is dry, so no saturation adjustment
  const thetav = thetaProf.map((t, i) =>
    virtualTemperature(t, qtProfile[i], 0),
  );
  const thetavh = thetah.map((t, i) => virtualTemperature(t, qth[i], 0));

  // Pressure and other thermodynamic variables
  const p = calculatePressureProfile(zh, p0, Rd, cp, g, thetavh, dz);
  const exner = p.map((pressure) => (pressure / p0) ** (Rd / cp));
  const T = exner.map((ex, i) => ex * thetaProf[i]);
  const Td = p.map((p, i) => dewpoint(qtProfile[i], p / 100));
  const rho = p.map((pressure, i) => pressure / (Rd * exner[i] * thetav[i]));

  // Include wind
  let uProfile: number[];
  let vProfile: number[];
  if (config.sw_wind) {
    const { z_u, z_v, gamma_u, gamma_v } = config;
    uProfile = piecewiseProfile(z, h, u, du, z_u, gamma_u);
    vProfile = piecewiseProfile(z, h, v, dv, z_v, gamma_v);
  } else {
    uProfile = new Array(z.length).fill(999);
    vProfile = new Array(z.length).fill(999);
  }

  return {
    z,
    theta: thetaProf,
    qt: qtProfile,
    u: uProfile,
    v: vProfile,
    thetav,
    p,
    exner,
    T,
    Td,
    rho,
  };
}

/**
 * Compute pressure profile using hydrostatic balance
 */
function calculatePressureProfile(
  zh: number[],
  p0: number,
  Rd: number,
  cp: number,
  g: number,
  thetavh: number[],
  dz: number,
) {
  const phRdcp = new Array(zh.length).fill(0);
  phRdcp[0] = p0 ** (Rd / cp);

  for (let i = 1; i < phRdcp.length; i++) {
    phRdcp[i] =
      phRdcp[i - 1] - (((g / cp) * p0 ** (Rd / cp)) / thetavh[i - 1]) * dz;
  }

  const ph = phRdcp.map((x) => x ** (cp / Rd));
  const p = ph
    .slice(0, -1)
    .map((val, i) => Math.exp(0.5 * (Math.log(val) + Math.log(ph[i + 1]))));
  return p;
}

/**
 * Generate array with specified range and step
 */
function arange(start: number, stop: number, step: number): number[] {
  const result: number[] = [];
  for (let i = start; i < stop; i += step) {
    result.push(i);
  }
  return result;
}

/**
 * Create CLASS-style piecewise profile: mixed layer + inversion + free troposphere segments
 */
function piecewiseProfile(
  z: number[],
  h: number,
  mlValue: number,
  jump: number,
  zSegments: number[],
  gammaSegments: number[],
): number[] {
  const profile = new Array(z.length);

  for (let i = 0; i < z.length; i++) {
    const _z = z[i];

    // Case 1: Mixed layer — constant value
    if (_z <= h) {
      profile[i] = mlValue;
      continue;
    }

    // Case 2: Above mixed layer
    let value = mlValue + jump;
    let lowerBound = h;

    // Traverse lapse rate segments
    for (let j = 0; j < zSegments.length; j++) {
      const upperBound = zSegments[j];
      const lapse = gammaSegments[j];

      if (upperBound < h) {
        // Mixed layer has fully consumed segment, skip it
        continue;
      }

      if (_z > upperBound) {
        // Entire segment is below current height
        value += lapse * (upperBound - lowerBound);
        lowerBound = upperBound;
      } else {
        // Partial segment contribution
        value += lapse * (_z - lowerBound);
        lowerBound = _z;
        break; // done accumulating
      }
    }

    // Case 3: Height is above all defined segments
    if (_z > lowerBound) {
      const lapse = gammaSegments[gammaSegments.length - 1];
      value += lapse * (_z - lowerBound);
    }

    profile[i] = value;
  }

  return profile;
}
