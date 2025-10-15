// ============================================================================
// fireplume.ts
// ============================================================================

import type { FireConfig } from "./config.js";
import type { ClassProfile } from "./profiles.js";
import {
  dewpoint,
  qsatLiq,
  saturationAdjustment,
  virtualTemperature,
} from "./thermodynamics.js";

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
  fac_area: number; // prescribed surface-layer area growth factor
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
  fac_area: 10,
};

/**
 * Parcel properties at a given height
 */
export interface Parcel {
  z: number; // Height levels [m]
  w: number; // Vertical velocity [m/s]
  thetal: number; // Liquid-water potential temperature (conserved) [K]
  theta: number; // Potential temperature [K]
  qt: number; // Total specific humidity (conserved) [kg/kg]
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
  rh: number; // Relative humidity [%]
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
  let thetal = background.theta[0]; // CLASS assumes RH_near-surf < 100% 
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
  const FvFire = FFire * (1 + 0.61 * thetal * FqFire);

  // Use cube root as the root may be negative and js will yield NaN for a complex number result
  const fac_w =
    (3 * g * plumeConfig.aW * FvFire) /
    (2 * rho * cp * thetavAmbient * (1 + plumeConfig.bW));
  const w = Math.cbrt(fac_w * fire.h0);

  // Add excess temperature/humidity 
  const dtheta = FFire / (rho * cp * w);
  const dqv = FqFire / (rho * w);
  thetal += dtheta;
  qt += dqv;

  // Update thetav/qsat accordingly
  const T = saturationAdjustment(thetal, qt, p, exner);
  const qsat = qsatLiq(p, T);
  const ql = Math.max(qt - qsat, 0);
  const theta = thetal + Lv / cp / exner * ql
  const thetav = virtualTemperature(theta, qt, ql);
  const rh = ((qt - ql) / qsat) * 100;
  const Td = dewpoint(qt, p / 100);

  // Calculate parcel buoyancy
  const b = (g / thetavAmbient) * (thetav - thetavAmbient);

  // Calculate initial entrainment/detrainment
  const m = rho * area * w;
  let e = ((rho * area) / (2 * w)) * b; // Entrainment assuming constant area with height in surface layer
  e = e + (rho * w * area * (1 + plumeConfig.fac_area)) / fire.h0; // Additional, prescribed plume growth over surface layer
  const d = 0;

  // Store parcel props
  return {
    z,
    w,
    thetal,
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
    p: background.p[0] / 100,
    rh,
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

  // Constant fractional entrainment and detrainment with height above surface layer
  const epsi = plumeConfig.fac_ent / Math.sqrt(parcel.area);
  const delt = epsi / plumeConfig.beta;

  for (let i = 1; i < bg.z.length; i++) {
    const z = bg.z[i];

    // Mass flux through plume
    const m = parcel.m + (parcel.e - parcel.d) * dz;
    const emz = (parcel.e / parcel.m) * dz;
    // FIXME: Line below assumes background state is unsaturated
    const thetal = parcel.thetal - emz * (parcel.thetal - bg.theta[i - 1]);
    const qt = parcel.qt - emz * (parcel.qt - bg.qt[i - 1]);

    // Thermodynamics and buoyancy
    const T = saturationAdjustment(thetal, qt, bg.p[i], bg.exner[i]);
    const qsat = qsatLiq(bg.p[i], T);
    const ql = Math.max(qt - qsat, 0);
    const theta = thetal + Lv / cp / bg.exner[i] * ql
    const thetav = virtualTemperature(theta, qt, ql);
    const rh = ((qt - ql) / qsat) * 100;
    const Td = dewpoint(qt, bg.p[i] / 100);
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

    // Update parcel
    parcel = {
      z,
      w,
      thetal,
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
      rh,
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
