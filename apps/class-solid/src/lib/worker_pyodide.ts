import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.mjs";
import type { BmiClass } from "@classmodel/class/bmi";
import { expose } from "comlink";

// let pythonModel: BmiClass;


function wrapPythonClass<T>(pyClass: any): { new (...args: any[]): T } {
  return new Proxy(pyClass, {
    construct(target, args) {
      // Instantiate the Python class
      const instance = target(...args);

      // Wrap the instance to ensure methods are callable
      return new Proxy(instance, {
        get(obj, prop) {
          const value = obj[prop];
          // If the property is a function, return a callable function
          if (typeof value === "function") {
            // If it's a class (has __name__), wrap it as a class
            if (value.__name__) {
              return wrapPythonClass(value);
            }
            // Otherwise, it's a method
            return (...methodArgs: any[]) => {
                // Call the method and handle the return value
                const result = value(...methodArgs);
                return wrapPythonReturnValue(result);
              };
          }
          // If the property is an object, recursively wrap it
          if (value && typeof value === "object") {
            return wrapPythonObject(value);
          }
          return value;
        },
      });
    },
  });
}

function wrapPythonObject(pyObject: any): any {
  return new Proxy(pyObject, {
    get(obj, prop) {
      const value = obj[prop];
      if (typeof value === "function") {
        return (...methodArgs: any[]) => {
            // Call the method and handle the return value
            const result = value(...methodArgs);
            return wrapPythonReturnValue(result);
          };
      }
      if (value && typeof value === "function" && value.__name__) {
        return wrapPythonClass(value);
      }
      if (value && typeof value === "object") {
        return wrapPythonObject(value);
      }
      return value;
    },
  });
}

// Function to recursively convert Python objects to serializable JS objects
function wrapPythonReturnValue(value: any): any {
    if (value === null || value === undefined) {
      return value; // Return null or undefined as is
    }
  
    // If it's a simple type, return it directly
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return value;
    }
  
    // If it's a list, recursively wrap each element
    if (Array.isArray(value)) {
      return value.map(wrapPythonReturnValue);
    }
  
    // If it's a dictionary-like object (e.g., Python dict), convert to plain JS object
    if (typeof value === "object") {
      const result: { [key: string]: any } = {};
      for (const key in value) {
        result[key] = wrapPythonReturnValue(value[key]);
      }
      return result;
    }
  
    // If it's a function or other complex type, return as is (it will be handled by the wrapper)
    return value;
  }


async function initializeWorker() {
    try {
        const pyodide = await loadPyodide();
        console.log("Pyodide initialized!");

        const classModelCode = await fetch("/python/class_model.py").then((res) => res.text());
        const bmiClassCode = await fetch("/python/bmi_class.py").then((res) => res.text());

        // await pyodide.runPython(classModelCode);
        await pyodide.runPython(bmiClassCode);

        const rawBmiClass = pyodide.globals.get("BmiClass");
        const pythonModel = wrapPythonClass<BmiClass>(rawBmiClass);

        // Check it works without wrapping with comlink
        const model = new pythonModel();
        console.log(model.get_component_name())
        model.initialize({a: 10});
        console.log(model.get_value('random_var'));
        const output = model.run({var_names: ['t']});
        console.log(output)
        console.log(typeof output)
    
        expose(pythonModel);
    } catch (error) {
        console.error("Worker initialization failed:", error);
        throw error;
    }
}

await initializeWorker();
