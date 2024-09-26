import type { BmiClass } from "@classmodel/class/bmi";
import type { Config } from "@classmodel/class/config";
import { type PartialConfig, parse } from "@classmodel/class/validate";
import { wrap } from "comlink";

const worker = new Worker(new URL("./worker.ts", import.meta.url), {
  type: "module",
});
export const AsyncBmiClass = wrap<typeof BmiClass>(worker);

export async function runClass(config: PartialConfig) {
  const parsedConfig: Config = parse(config);
  const model = await new AsyncBmiClass();
  await model.initialize(parsedConfig);
  const output = await model.run({
    var_names: ["h"],
  });
  return output;
}
