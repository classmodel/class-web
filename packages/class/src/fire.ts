// ============================================================================
// fireplume.ts
// ============================================================================

import type { FireConfig } from "./config.js";
import type { ClassProfile } from "./profiles.js";
import { calcThetav, dewpoint } from "./thermodynamics.js";

// Constants
const g = 9.81; // Gravitational acceleration [m/s²]
const cp = 1004; // Specific heat at constant pressure [J/kg/K]
const Lv = 2.5e6; // Latent heat of vaporization [J/kg]

/**
 * Configuration parameters for plume model
 */
interface PlumeConfig {
  fac_ent: number; // factor for fractional entrainment (0.2 in Morton model)
  beta: number; // Fractional detrainment above surface layer
  aW: number; // Factor scaling acceleration due to buoyancy
  bW: number; // Factor scaling deceleration due to entrainment
  dz: number; // Grid spacing [m]
}

/**
 * Default plume configuration
 */
const defaultPlumeConfig: PlumeConfig = {
  fac_ent: 0.8,
  beta: 1.0,
  aW: 1.0,
  bW: 0.2,
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
  T: number; // Temperature [K]
  Td: number; // Dewpoint temperature [K]
  p: number; // Pressure [hPa]
}

/**
 * Initialize fire parcel with ambient conditions and fire properties
 */
function initializeFireParcel(
  background: ClassProfile,
  fire: FireConfig,
  plumeConfig: PlumeConfig = defaultPlumeConfig,
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
  const FqFire = (fire.omega * fire.Cq * fire.spread) / fire.d;
  const FvFire = FFire * (1 + 0.61 * theta * FqFire);

  // Use cube root as the root may be negative and js will yield NaN for a complex number result
  const w = Math.cbrt(
    (3 * g * FvFire * fire.h0) / (2 * rho * cp * thetavAmbient),
  );

  // Add excess temperature/humidity and update thetav/qsat accordingly
  const dtheta = FFire / (rho * cp * w);
  const dqv = FqFire / (rho * w);
  theta += dtheta;
  qt += dqv;

  const [thetav, qsat] = calcThetav(theta, qt, p, exner);

  // Calculate parcel buoyancy
  const b = (g / thetavAmbient) * (thetav - thetavAmbient);

  const T = background.exner[0] * theta;
  const Td = dewpoint(qt, p / 100);

  // Calculate initial entrainment/detrainment
  const epsi0 = plumeConfig.fac_ent / Math.sqrt(area);
  const m = rho * area * w;
  const e = epsi0 * m;

  // Store parcel props
  return {
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
    d: 0,
    T,
    Td,
    p: background.p[0] / 100,
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

  // Constant fractional entrainment and detrainment with height
  const epsi = plumeConfig.fac_ent / Math.sqrt(parcel.area);
  const delt = epsi / plumeConfig.beta;

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
    const w2 =
      parcel.w * parcel.w +
      2 *
        (plumeConfig.aW * b - plumeConfig.bW * epsi * parcel.w * parcel.w) *
        dz;
    let w: number;
    if (w2 < 0) {
      w = 0;
    } else {
      w = Math.sqrt(w2);
    }

    // Calculate entrainment and detrainment
    const e = epsi * m;
    const d = delt * m;

    const area = m / (bg.rho[i] * w);

    const T = bg.exner[i] * theta;
    const Td = dewpoint(qt, bg.p[i] / 100);

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
      T,
      Td,
      p: bg.p[i] / 100,
    };

    if (w <= 0 || area <= 0) {
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
