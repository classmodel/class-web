import type { BmiClass } from "@classmodel/class/bmi";
import { type ClassConfig, classConfig } from "@classmodel/class/config";
import { wrap } from "comlink";

const worker = new Worker(new URL("./worker.ts", import.meta.url), {
  type: "module",
});
export const AsyncBmiClass = wrap<typeof BmiClass>(worker);

export async function runClass(config: Partial<ClassConfig>) {
  const parsedConfig: ClassConfig = classConfig.parse(config);
  const model = await new AsyncBmiClass();
  await model.initialize(parsedConfig);
  const output = await model.run({
    var_names: ["h"],
  });
  console.log(parsedConfig);
  console.log(output);
  return output;
}
