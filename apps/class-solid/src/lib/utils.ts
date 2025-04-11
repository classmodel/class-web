import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Creates a deep copy of the given object by serializing it to JSON and then
 * deserializing it back.
 *
 * @typeParam T - The type of the object to be copied.
 * @param obj - The object to create a deep copy of.
 * @returns A new object that is a deep copy of the input object.
 *
 * @remarks
 * This function uses `JSON.stringify` and `JSON.parse` to perform the deep
 * copy. It works well for plain objects and arrays but may not handle objects
 * with methods, circular references, or special types like `Date`, `Map`,
 * `Set`, etc.
 *
 * Unlike structuredClone, this method does not preserve references. This is to
 * avoid uncaught reference errors.
 */
export function deepCopy<T>(obj: T){
  return JSON.parse(JSON.stringify(obj)) as T
}