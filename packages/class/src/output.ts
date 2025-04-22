export interface OutputVariable {
  key: string;
  title: string;
  unit: string;
  symbol: string;
}

export const outputVariables: OutputVariable[] = [
  {
    key: "t",
    title: "Time",
    unit: "s",
    symbol: "t",
  },
  {
    key: "h",
    title: "ABL height",
    unit: "m",
    symbol: "h",
  },
  {
    key: "theta",
    title: "Potential temperature",
    unit: "K",
    symbol: "θ",
  },
  {
    key: "dtheta",
    title: "Potential temperature jump",
    unit: "K",
    symbol: "Δθ",
  },
  {
    key: "q",
    title: "Specific humidity",
    unit: "kg kg⁻¹",
    symbol: "q",
  },
  {
    key: "dq",
    title: "Specific humidity jump",
    unit: "kg kg⁻¹",
    symbol: "Δq",
  },
  {
    key: "dthetav",
    title: "Virtual temperature jump at h",
    unit: "K",
    symbol: "Δθᵥ",
  },
  {
    key: "we",
    title: "Entrainment velocity",
    unit: "m s⁻¹",
    symbol: "wₑ",
  },
  {
    key: "ws",
    title: "Large-scale vertical velocity",
    unit: "m s⁻¹",
    symbol: "wₛ",
  },
  {
    key: "wthetave",
    title: "Entrainment virtual heat flux",
    unit: "K m s⁻¹",
    symbol: "(w'θ')ᵥₑ",
  },
  {
    key: "wthetav",
    title: "Surface virtual heat flux",
    unit: "K m s⁻¹",
    symbol: "(w'θ')ᵥ",
  },
  {
    key: "wtheta",
    title: "Surface kinematic heat flux",
    unit: "K m s⁻¹",
    symbol: "(w'θ')ₛ",
  },
  {
    key: "wq",
    title: "Surface kinematic heat flux",
    unit: "kg kg⁻¹ m s⁻¹",
    symbol: "(w'q')ₛ",
  },
];

export type ClassOutput = {
  [K in (typeof outputVariables)[number]["key"]]: number[];
};