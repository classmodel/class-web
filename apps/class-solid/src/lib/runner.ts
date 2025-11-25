import type { Config } from "@classmodel/class/config";
import type { ClassOutput } from "@classmodel/class/output";
import type { runClass } from "@classmodel/class/runner";
import { wrap } from "comlink";

const worker = new Worker(new URL("./worker.ts", import.meta.url), {
  type: "module",
});

const asyncRunner = wrap<typeof runClass>(worker);

export async function runClassAsync(config: Config): Promise<ClassOutput> {
  try {
    return await asyncRunner(config);
  } catch (error) {
    console.error({ config, error });
    throw error;
  }
}
