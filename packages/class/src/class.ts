export interface ClassConfig {
  h: number;
  theta: number;
  dtheta: number;
  dz_h: number;
  q: number;
  dq: number;
}

export function runClass(config: ClassConfig): Record<string, number[]> {
  console.log("Called class with the following config", config);
  let output = { h: [1, 2, 3, 4, 5, 6] };
  return output;
}
