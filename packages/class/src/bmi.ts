import { CLASS } from "./class";
import { classConfig, ClassConfig } from "./config";

/**
 * A lightweight [BMI](https://bmi.readthedocs.io) like interface for the CLASS model.
 *
 * Inspiration https://github.com/uihilab/BMI-JS/blob/main/bmijs/bmi.js
 *
 * Deviations from the BMI standard
 * - accessors do not use dest argument
 * - initialize() accepts object instead of string
 * - parameters() returns default config
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

export class BmiClass implements BmiLight<ClassConfig> {
  config: ClassConfig = classConfig.parse({});
  model: CLASS = new CLASS(this.config);

  constructor() {
    // no-op
  }

  // Model control functions

  initialize(config: ClassConfig) {
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
    return 1;
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

  run<T extends string[]>({
    freq = 60,
    var_names = ouput_var_names as T,
  }: {
    freq?: number;
    var_names?: T;
  }): { t: number[] } & { [K in T[number]]: number[] } {
    const output: { t: number[] } & { [K in T[number]]: number[] } =
      Object.fromEntries([["t", []], ...var_names.map((name) => [name, []])]);
    while (this.model.t < this.config.timeControl.runtime) {
      this.update();
      if (this.model.t % freq == 0) {
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
