import type { Observation } from "./experiment_config";

/**
 * https://en.wikipedia.org/wiki/Dew_point#Calculating_the_dew_point
 * p should be in hPa
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
      const qt = calculateSpecificHumidity(T, p, rh);
      const { u, v } = windSpeedDirectionToUV(
        obs.windSpeed[i],
        obs.windDirection[i],
      );

      switch (variable) {
        case "theta":
          return { y: h, x: theta };
        case "qt":
          return { y: h, x: qt };
        case "u":
          return { y: h, x: u };
        case "v":
          return { y: h, x: v };
        case "rh":
          return { y: h, x: rh };
        case "T":
          return { y: h, x: T };
        case "p":
          return { y: h, x: p };
        default:
          console.warn(
            `Unknown variable '${variable}' for observation profile.`,
          );
          return { y: Number.NaN, x: Number.NaN };
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
