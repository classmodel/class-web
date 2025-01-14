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
        output = {"t": []}
        return output

model = BmiClass()
`

function createBmiWrapper(pyodide): BmiClass {

  pyodide.runPython(bmiClassCode);
  const bmiInstance = pyodide.globals.get('model');


  // Return a Proxy that intercepts method calls and forwards them to the Python instance
  return new Proxy({}, {
      get: (target, prop, receiver) => {
          // If the property is a function in the Python instance, forward the call
          if (typeof prop === 'string' && prop in bmiInstance) {
              const args = [...arguments].slice(2); // Collect arguments passed to the method
              const methodCall = `${prop}(${args.map(arg => JSON.stringify(arg)).join(", ")})`;
              // Forward the method call to the Python instance
              console.log(methodCall)
              return pyodide.runPython(`model.${methodCall}`);
          }
          // Return undefined for unknown properties
          return undefined;
      }
  }) as BmiClass; // Cast the Proxy to BmiClass type
}

async function initializeWorker() {
  try {
      const pyodide = await loadPyodide();
      console.log("Pyodide initialized!");

      // Create the BMI wrapper
      const model = createBmiWrapper(pyodide);

      console.log(model.get_component_name());
      model.initialize({ a: 10 });
      console.log(model.get_value('random_var'));
      const output = model.run({ var_names: ['t'] });
      console.log(output);
      console.log(typeof output);
  } catch (error) {
      console.error("Error initializing worker:", error);
  }
}

initializeWorker()