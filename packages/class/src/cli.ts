#!/usr/bin/env node

import fs from "node:fs";
import { runClass } from "./runner";
import { parse } from "./validate";

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: class <config-file.json>");
    process.exit(1);
  }

  try {
    const configFile = args[0];
    const configAsString = fs.readFileSync(configFile, "utf-8");
    const rawConfig = JSON.parse(configAsString);
    const config = parse(rawConfig);
    const output = runClass(config);
    console.log(JSON.stringify(output, null, 2));
  } catch (error) {
    console.error("Error running class:", error);
    process.exit(1);
  }
}

main();
