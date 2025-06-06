// ============================================================================
// fireplume.ts
// ============================================================================

import type { FireConfig } from "./config.js";
import type { ClassProfile } from "./profiles.js";
import { calcThetav } from "./thermodynamics.js";

// Constants
const g = 9.81; // Gravitational acceleration [m/s²]
const cp = 1004; // Specific heat at constant pressure [J/kg/K]
const Lv = 2.5e6; // Latent heat of vaporization [J/kg]

/**
 * Configuration parameters for plume model
 */
interface PlumeConfig {
  zSl: number; // Surface layer height [m]
  lambdaMix: number; // Mixing length in surface layer [m]
  beta: number; // Fractional detrainment above surface layer
  dz: number; // Grid spacing [m]
}

/**
 * Default plume configuration
 */
const defaultPlumeConfig: PlumeConfig = {
  zSl: 100.0,
  lambdaMix: 30.0,
  beta: 1.0,
  dz: 1.0,
};

/**
 * Parcel properties at a given height
 */
export interface Parcel {
  z: number; // Height levels [m]
  w: number; // Vertical velocity [m/s]
  theta: number; // Potential temperature [K]
  qt: number; // Total specific humidity [kg/kg]
  thetav: number; // Virtual potential temperature [K]
  qsat: number; // Saturation specific humidity [kg/kg]
  b: number; // Buoyancy [m/s²]
  m: number; // Mass flux [kg/m²/s]
  area: number; // Cross-sectional area [m²]
  e: number; // Entrainment rate [kg/m²/s]
  d: number; // Detrainment rate [kg/m²/s]
}

/**
 * Initialize fire parcel with ambient conditions and fire properties
 */
function initializeFireParcel(
  background: ClassProfile,
  fire: FireConfig,
): Parcel {
  // Start with parcel props from ambient air
  const z = background.z[0];
  let theta = background.theta[0];
  const thetavAmbient = background.thetav[0];
  let qt = background.qt[0];
  const rho = background.rho[0];
  const p = background.p[0];
  const exner = background.exner[0];

  // Calculate fire properties
  const area = fire.L * fire.d;
  const FFire =
    ((fire.omega * fire.C * fire.spread) / fire.d) * (1 - fire.radiativeLoss);
  const FqFire = 0.0 * FFire; // Dry plume for now

  // Use cube root as the root may be negative and js will yield NaN for a complex number result
  const w = Math.cbrt(
    (3 * g * FFire * fire.h0) / (2 * rho * cp * thetavAmbient),
  );

  // Add excess temperature/humidity and update thetav/qsat accordingly
  const dtheta = FFire / (rho * cp * w);
  const dqv = FqFire / (rho * Lv * w);
  theta += dtheta;
  qt += dqv;

  const [thetav, qsat] = calcThetav(theta, qt, p, exner);

  // Calculate parcel buoyancy
  const b = (g / background.thetav[0]) * (thetav - thetavAmbient);

  // Store parcel props
  return {
    z,
    w,
    theta,
    qt,
    thetav,
    qsat,
    b,
    area: fire.L * fire.d,
    m: rho * area * w,
    e: ((rho * area) / (2 * w)) * b,
    d: 0,
  };
}

/**
 * Calculate plume evolution through the atmosphere
 */
export function calculatePlume(
  fire: FireConfig,
  bg: ClassProfile,
  plumeConfig: PlumeConfig = defaultPlumeConfig,
): Parcel[] {
  const { dz } = plumeConfig;
  let parcel = initializeFireParcel(bg, fire);
  const plume: Parcel[] = [parcel];

  const detrainmentRate0 = plumeConfig.lambdaMix ** 0.5 / parcel.area ** 0.5;
  let crossedSl = false;
  let epsi = 0;
  let delt = 0;

  for (let i = 1; i < bg.z.length; i++) {
    const z = bg.z[i];

    // Mass flux through plume
    const m = parcel.m + (parcel.e - parcel.d) * dz;
    const emz = (parcel.e / parcel.m) * dz;
    const theta = parcel.theta - emz * (parcel.theta - bg.theta[i - 1]);
    const qt = parcel.qt - emz * (parcel.qt - bg.qt[i - 1]);

    // Calculate virtual potential temperature and buoyancy
    const [thetav, qsat] = calcThetav(theta, qt, bg.p[i], bg.exner[i]);
    const b = (g / bg.thetav[i]) * (thetav - bg.thetav[i]);

    // Solve vertical velocity equation
    const aW = 1;
    const bW = 0;
    const w =
      parcel.w +
      ((-bW * parcel.e * parcel.w +
        aW * parcel.area * bg.rho[i - 1] * parcel.b) /
        parcel.m) *
        dz;

    // Calculate entrainment and detrainment
    let e: number;
    let d: number;

    if (z < plumeConfig.zSl) {
      // Surface layer formulation
      e = ((parcel.area * bg.rho[i - 1]) / (2 * parcel.w)) * parcel.b;
      d =
        parcel.area *
        bg.rho[i - 1] *
        detrainmentRate0 *
        ((z ** 0.5 * (w - parcel.w)) / dz + parcel.w / (2 * z ** 0.5));
    } else {
      // Above surface layer
      if (!crossedSl) {
        epsi = parcel.e / parcel.m;
        delt = epsi / plumeConfig.beta;
        crossedSl = true;
      }

      e = epsi * m;
      d = delt * m;
    }

    const area = m / (bg.rho[i] * w);

    // Update parcel
    parcel = {
      z,
      w,
      theta,
      qt,
      thetav,
      qsat,
      b,
      area,
      m,
      e,
      d,
    };

    if (w < 0 || area <= 0) {
      break;
    }

    plume.push(parcel);
  }
  return plume;
}

/**
 * Convert array of objects into object of arrays
 */
export function transposePlumeData(
  plume: Parcel[],
): Record<keyof Parcel, number[]> {
  if (plume.length === 0) {
    return {} as Record<keyof Parcel, number[]>;
  }

  // Get field names from the first parcel object
  const fieldNames = Object.keys(plume[0]) as (keyof Parcel)[];

  // Extract arrays for each field
  const transposed = {} as Record<keyof Parcel, number[]>;

  for (const fieldName of fieldNames) {
    transposed[fieldName] = plume.map((parcel) => parcel[fieldName]);
  }

  return transposed;
}
