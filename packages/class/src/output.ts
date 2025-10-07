export interface VariableInfo {
  title: string;
  unit: string;
  symbol: string;
}

export const outputVariables = {
  t: {
    title: "Time",
    unit: "s",
    symbol: "time",
  },
  utcTime: {
    title: "Time (UTC)",
    unit: "-",
    symbol: "time h UTC",
  },
  h: {
    title: "ABL height",
    unit: "m",
    symbol: "h",
  },
  theta: {
    title: "Potential temperature",
    unit: "K",
    symbol: "θ",
  },
  dtheta: {
    title: "Potential temperature jump",
    unit: "K",
    symbol: "Δθ",
  },
  qt: {
    title: "Specific humidity",
    unit: "kg kg⁻¹",
    symbol: "q",
  },
  dqt: {
    title: "Specific humidity jump",
    unit: "kg kg⁻¹",
    symbol: "Δq",
  },
  dthetav: {
    title: "Virtual temperature jump at h",
    unit: "K",
    symbol: "Δθᵥ",
  },
  we: {
    title: "Entrainment velocity",
    unit: "m s⁻¹",
    symbol: "wₑ",
  },
  ws: {
    title: "Large-scale vertical velocity",
    unit: "m s⁻¹",
    symbol: "wₛ",
  },
  wthetave: {
    title: "Entrainment virtual heat flux",
    unit: "K m s⁻¹",
    symbol: "(w'θ')ᵥₑ",
  },
  wthetav: {
    title: "Surface virtual heat flux",
    unit: "K m s⁻¹",
    symbol: "(w'θ')ᵥ",
  },
  wtheta: {
    title: "Surface kinematic heat flux",
    unit: "K m s⁻¹",
    symbol: "(w'θ')ₛ",
  },
  wq: {
    title: "Surface kinematic heat flux",
    unit: "kg kg⁻¹ m s⁻¹",
    symbol: "(w'q')ₛ",
  },
  u: {
    title: "Mixed-layer u-wind component",
    unit: "m s⁻¹",
    symbol: "u",
  },
  v: {
    title: "Mixed-layer v-wind component",
    unit: "m s⁻¹",
    symbol: "v",
  },
  du: {
    title: "U-wind jump at h",
    unit: "m s⁻¹",
    symbol: "Δu",
  },
  dv: {
    title: "V-wind jump at h",
    unit: "m s⁻¹",
    symbol: "Δv",
  },
RH_h: {
    title: "Relative humidity at h",
    unit: "%",
    symbol: "RH_h",
  },
} as const satisfies Record<string, VariableInfo>;

export type OutputVariableKey = keyof typeof outputVariables;
export type ClassOutput = Record<OutputVariableKey, number[]>;
export type ClassOutputAtSingleTime = Record<OutputVariableKey, number>;

export function getOutputAtTime(
  output: ClassOutput,
  timeIndex: number,
): ClassOutputAtSingleTime {
  return Object.fromEntries(
    Object.entries(output).map(([key, values]) => [key, values[timeIndex]]),
  ) as ClassOutputAtSingleTime;
}
