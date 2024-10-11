import { classConfig } from "@classmodel/class/config";
import { runClass } from "@classmodel/class/runner";

function main(args: string[], logger = console) {
  if (args.length !== 1) {
    console.error("Usage: class <config-file.json>");
    Deno.exit(1);
  }
  try {
    const configFile = args[0];
    const configAsString = Deno.readTextFileSync(configFile);
    const rawConfig = JSON.parse(configAsString);
    const config = classConfig.parse(rawConfig);
    const output = runClass(config);
    logger.log(JSON.stringify(output, null, 2));
  } catch (error) {
    logger.error("Error running class:", error);
    Deno.exit(1);
  }
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  main(Deno.args);
}
