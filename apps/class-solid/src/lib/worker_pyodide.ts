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
            // If the property is a function, bind it to the instance and convert to JS
            if (typeof value === "function") {
                return (...methodArgs: any[]) => value(...methodArgs);
            }
            return value;
            },
        });
        },
    });
    }

async function initializeWorker() {
    try {
        const pyodide = await loadPyodide();
        console.log("Pyodide initialized!");

        const classModelCode = await fetch("/python/class_model.py").then((res) => res.text());
        const bmiClassCode = await fetch("/python/bmi_class.py").then((res) => res.text());

        await pyodide.runPython(classModelCode);
        await pyodide.runPython(bmiClassCode);

        // const pythonModel = pyodide.pyimport("BmiClass");
        // const pythonModel = pyodide.globals.get("BmiClass") as unknown as PythonClass<BmiClass>;

        const rawBmiClass = pyodide.globals.get("BmiClass");
        const pythonModel = wrapPythonClass<BmiClass>(rawBmiClass);
        const model = new pythonModel();

    
        console.log(model.get_component_name())
        expose(pythonModel);
    } catch (error) {
        console.error("Worker initialization failed:", error);
        throw error;
    }
}

await initializeWorker();
