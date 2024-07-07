export interface ISettings {
  name: string;
  description: string;
  value: number;
  min: number;
  max: number;
}

export const defaultSettings: ISettings[] = [
  {
    name: "h",
    description: "Initial ABL height [m]",
    value: 5,
    min: 0,
    max: 10,
  },
  {
    name: "theta",
    description: "Initial mixed-layer potential temperature [K]",
    value: 5,
    min: 0,
    max: 10,
  },
  {
    name: "dtheta",
    description: "Initial temperature jump at h [K]",
    value: 5,
    min: 0,
    max: 10,
  },
  {
    name: "q",
    description: "Initial mixed-layer specific humidity [kg kg-1]",
    value: 5,
    min: 0,
    max: 10,
  },
  {
    name: "dq",
    description: "Initial specific humidity jump at h [kg kg-1]",
    value: 5,
    min: 0,
    max: 10,
  },
];

export interface ClassConfig {
  h: number;
  theta: number;
  dtheta: number;
  dz_h: number;
  q: number;
  dq: number;
}
export type ClassOutput = Record<string, number[]>;
export function runClass(config: ClassConfig): ClassOutput {
  console.log("CLASS called with the following config", config);
  let output = { h: [1, 2, 3, 4, 5, 6] };
  return output;
}
