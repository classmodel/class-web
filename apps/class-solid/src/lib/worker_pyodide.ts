import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.mjs";
import type { BmiClass } from "@classmodel/class/bmi";
import { expose } from "comlink";


const bmiClassCode = `
class SubClass:
    def __init__(self):
        self.value = 42

class BmiClass:
    def __init__(self):
        print("BmiClass in python instantiated")
        self.model = None

    def get_component_name(self):
        return "Chemistry Land-surface Atmosphere Soil Slab model"

    def initialize(self, cfg: dict):
        # Instantiate another class (SubClass) here
        self.model = SubClass()

    def get_value(self, var: str):
        return self.model.value

    def get_output_var_names(self):
        return ["h", "theta", "dtheta", "q", "dq"]

    def run(self, var_names=["t"]):
        output = {"t": [10, 11, 12]}
        return output

import json
model = BmiClass()
`

class BmiWrapper implements BmiClass {
  private pyodide: any;
  private bmiInstance: any;

  constructor() {
    // Use the globally initialized pyodide
    if (typeof pyodide === 'undefined') {
      throw new Error("Pyodide is not loaded yet.");
    }

    this.pyodide = pyodide; // Access the global pyodide instance

    // Load the Python BMI class code (this should only be done once)
    this.pyodide.runPython(bmiClassCode);
    console.log("Python BMI loaded");

    // Get the Python instance of the model
    this.bmiInstance = this.pyodide.globals.get('model');

    // Ensure that the model is initialized and has the expected methods
    if (!this.bmiInstance) {
      throw new Error("Failed to initialize Python BMI model.");
    }
  }

  get_component_name(): string {
    return this.pyodide.runPython('model.get_component_name()');
  }

  initialize(cfg: object): void {
    this.pyodide.runPython(`model.initialize(${JSON.stringify(cfg)})`);
  }

  get_value(varName: string): [number] {
    return this.pyodide.runPython(`model.get_value(${JSON.stringify(varName)})`);
  }

  get_output_var_names(): string[] {
    return this.pyodide.runPython('model.get_output_var_names()');
  }

  run<T extends string[]>({ freq, var_names }: { freq?: number; var_names?: T }): { t: number[] } & { [K in T[number]]: number[] } {
    const varNames = JSON.stringify(var_names || ['t']);
    const result = this.pyodide.runPython(`json.dumps(model.run(var_names=${varNames}))`)
    const jsResult = JSON.parse((result))
    console.log(result, jsResult)
    return jsResult
  }
}

// Global pyodide instance
let pyodide: any;

async function initializeWorker() {
  try {
    // Load Pyodide globally (this is done only once)
    pyodide = await loadPyodide();
    console.log("Pyodide initialized!");

    // Create the BMI wrapper (no need to pass pyodide here)
    const model = new BmiWrapper();
    console.log(model.get_component_name());
    model.initialize({ a: 10 });
    console.log(model.get_value('random_var'));
    const output = model.run({ var_names: ['t'] });
    console.log(output);
    console.log(typeof output);

    expose(BmiWrapper); // Expose the BmiWrapper class to the main thread if needed

  } catch (error) {
    console.error("Error initializing worker:", error);
  }
}

initializeWorker();
