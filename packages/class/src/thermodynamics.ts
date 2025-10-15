// thermodynamics.ts

// Constants
const Rd = 287; // Gas constant for dry air [J/kg/K]
const Rv = 461; // Gas constant for water vapor [J/kg/K]
const cp = 1004; // Specific heat of dry air at constant pressure [J/kg/K]
const Lv = 2.5e6; // Latent heat of vaporization [J/kg]
const ep = Rd / Rv;

export function virtualTemperature(t: number, qt: number, ql: number): number {
  // Note t is theta, not thl as conserved by the plume
  return t * (1.0 - (1.0 - Rv / Rd) * qt - (Rv / Rd) * ql);
}

export function esatLiq(t: number): number {
  const Tc = Math.min(t - 273.15, 50); // limit to avoid excessive values
  return 611.21 * Math.exp((17.502 * Tc) / (240.97 + Tc));
}

export function qsatLiq(p: number, t: number): number {
  const e = esatLiq(t);
  return (ep * e) / (p - (1.0 - ep) * e);
}

export function dqsatdTLiq(p: number, t: number): number {
  const e = esatLiq(t);
  const den = p - e * (1.0 - ep);
  return (
    ((ep / den + ((1.0 - ep) * ep * e) / (den * den)) * Lv * e) / (Rv * t * t)
  );
}

export function saturationAdjustment(
  thl: number,
  qt: number,
  p: number,
  exner: number,
): number {
  const tl = exner * thl;
  let qsat = qsatLiq(p, tl);

  if (qt <= qsat) {
    return tl;
  }

  // Newton-Raphson iteration
  let tnr = tl;
  let tnr_old = 1e9;
  let iter = 0;
  const maxIter = 100;

  while (Math.abs(tnr - tnr_old) / tnr_old > 1e-5 && iter < maxIter) {
    tnr_old = tnr;
    qsat = qsatLiq(p, tnr);
    const f = tnr - tl - (Lv / cp) * (qt - qsat);
    const f_prime = 1 + (Lv / cp) * dqsatdTLiq(p, tnr);
    tnr -= f / f_prime;
    iter++;
  }
  return tnr;
}

/**
 * https://en.wikipedia.org/wiki/Dew_point#Calculating_the_dew_point
 */
export function dewpoint(q: number, p: number) {
  // Empirical fit parameters (Sonntag1990, see wikipedia entry for more options)
  const A = 6.112;
  const B = 17.62;
  const C = 243.12;

  const w = q / (1 - q); // mixing ratio
  const e = (w * p) / (w + 0.622); // Actual vapour pressure; Wallace and Hobbs 3.59

  const Td = (C * Math.log(e / A)) / (B - Math.log(e / A));

  return Td + 273.15;
}
