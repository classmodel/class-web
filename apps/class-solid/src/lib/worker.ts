import { runClass } from "@repo/class/runner";
import { expose } from "comlink";

const obj = {
  runClass,
};
export type ClassWorker = typeof obj;

expose(obj);
