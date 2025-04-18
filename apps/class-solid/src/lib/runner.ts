import type { Config } from "@classmodel/class/config";
import type { ClassOutput, runClass } from "@classmodel/class/runner";
import { wrap } from "comlink";

const worker = new Worker(new URL("./worker.ts", import.meta.url), {
  type: "module",
});

export async function runClassAsync(config: Config): Promise<ClassOutput> {
  const asyncRunner = wrap<typeof runClass>(worker);
  try {
    const output = asyncRunner(config)
    return output;
  } catch (error) {
    console.error({ config, error });
    // TODO use toast to give feedback to the user
  }
  throw new Error("Model run failed");
}
