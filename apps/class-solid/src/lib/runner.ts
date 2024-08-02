import type { BmiClass } from "@classmodel/class/bmi";
import type { ClassConfig } from "@classmodel/class/config";
import { wrap } from "comlink";

const worker = new Worker(new URL("./worker.ts", import.meta.url), {
  type: "module",
});
export const AsyncBmiClass = wrap<typeof BmiClass>(worker);

export async function runClass(config: ClassConfig) {
  const model = await new AsyncBmiClass();
  await model.initialize(config);
  const output = await model.run({
    var_names: ["h"],
  });
  return output;
}
