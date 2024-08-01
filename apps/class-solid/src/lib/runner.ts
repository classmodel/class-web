import type { ClassWorker } from "./worker";
import { wrap } from "comlink";

const worker = new Worker(new URL("./worker.ts", import.meta.url), {
  type: "module",
});
export const runner = wrap<ClassWorker>(worker);
