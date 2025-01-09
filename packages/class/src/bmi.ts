/**
 * This module contains the Basic Modelling Interface class.
 * @module
 */
import { CLASS } from "./class.js";
import type { Config } from "./config.js";
import { parse } from "./validate.js";

/**
 * A lightweight [Basic Modelling Interface (BMI)](https://bmi.readthedocs.io) like interface for the CLASS model.
 *
 * Inspiration https://github.com/uihilab/BMI-JS/blob/main/bmijs/bmi.js
 *
 * Deviations from the BMI standard
 * - accessors do not use dest argument
 * - initialize() accepts object instead of string
 * - parameters() returns default config
 * - run() as extra method
 */
interface BmiLight<Config> {
  initialize(config: Config): void;
  update(): void;
  get_component_name(): string;
  get_output_item_count(): number;
  get_output_var_names(): string[];
  get_var_grid(name: string): number;
  get_var_type(name: string): string;
  get_var_location(name: string): string;
  get_current_time(): number;
  get_end_time(): number;
  get_time_units(): string;
  get_time_step(): number;
  get_value(name: string): number[];
  get_grid_type(): string;
}

const ouput_var_names: string[] = ["h", "theta", "dtheta", "q", "dq"] as const;

/**
 * Class representing a BMI (Basic Model Interface) implementation for the CLASS model.
 * This class provides methods to initialize, update, and retrieve information from the model.
 */
export class BmiClass implements BmiLight<Config> {
  config: Config = parse({});
  model: CLASS = new CLASS(this.config);

  // Model control functions

  initialize(config: Config) {
    this.config = config;
    this.model = new CLASS(config);
  }

  update() {
    this.model.update();
  }

  // Model information functions

  get_component_name() {
    return "Chemistry Land-surface Atmosphere Soil Slab model";
  }

  get_output_item_count() {
    return ouput_var_names.length;
  }

  get_output_var_names() {
    return ouput_var_names;
  }

  // Variable information functions

  get_var_grid(name: string) {
    return 1;
  }

  get_var_type(name: string) {
    return "float";
  }

  get_var_location(name: string) {
    return "node";
  }

  // Time functions
  get_current_time() {
    return this.model.t;
  }

  get_end_time() {
    return this.config.timeControl.runtime;
  }

  get_time_units() {
    return "s";
  }

  get_time_step() {
    return this.config.timeControl.dt;
  }

  // Variable getter and setter functions

  get_value(name: string) {
    if (ouput_var_names.includes(name)) {
      return [this.model[name as keyof CLASS]] as [number];
    }
    throw new Error(`Variable ${name} not found`);
  }

  // Model grid functions

  get_grid_type() {
    return "scalar";
  }

  // Extra methods

  /**
   * Runs the model till the end and returns the output data.
   *
   * @param options - The options for running the model.
   * @param options.freq - The frequency at which to record the output data. Default is 60 seconds.
   * @param options.var_names - For which output variables to record the data. Default is all output variables.
   * @returns The output data, including the time values in t key and the values of the output variables.
   */
  run<T extends string[]>({
    freq = 600,
    var_names = ouput_var_names as T,
  }: {
    freq?: number;
    var_names?: T;
  }): { t: number[] } & { [K in T[number]]: number[] } {
    const output: { t: number[] } & { [K in T[number]]: number[] } =
      Object.fromEntries([["t", []], ...var_names.map((name) => [name, []])]);
    while (this.model.t < this.config.timeControl.runtime) {
      this.update();
      if (this.model.t % freq === 0) {
        output.t.push(this.model.t);
        for (const name of var_names) {
          const value = this.model[name as keyof CLASS] as number;
          output[name as T[number]].push(value);
        }
        // TODO progress callback?
        // Initial attempt failed with "could not be cloned" error
      }
    }
    return output;
  }
}
