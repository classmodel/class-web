#!/usr/bin/env node
/**
 * Command-line interface for the CLASS model.
 */

import { readFile, writeFile } from "node:fs/promises";
import { EOL } from "node:os";
import { Command, Option } from "@commander-js/extra-typings";
import { type ClassOutput, runClass } from "./runner";
import { parse } from "./validate";

/**
 * Reads text input from the standard input (stdin) stream asynchronously.
 *
 */
async function readTextFromStdin(): Promise<string> {
  return await new Promise<string>((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("readable", () => {
      const chunk = process.stdin.read();
      if (chunk !== null) {
        data += chunk;
      }
    });
    process.stdin.on("end", () => {
      resolve(data);
    });
  });
}

/**
 * Read a text file. When the filename is "-", read from standard input.
 */
async function readTextFile(fn: string): Promise<string> {
  if (fn === "-") {
    return await readTextFromStdin();
  }
  return await readFile(fn, "utf-8");
}

/**
 * Write a text file.
 */
async function writeTextFile(body: string, fn: string): Promise<void> {
  return await writeFile(fn, body, "utf-8");
}

/**
 * Create a DSV (delimiter-separated values) string from an object of arrays.
 */
function dsv(output: ClassOutput, delimiter: string): string {
  const keys = Object.keys(output);
  // order of headers is now in which they were added to the object
  // TODO make configurable: which columns and in which order
  const headers = keys.join(delimiter);
  const rows: string[] = [headers];
  for (let i = 0; i < output[keys[0]].length; i++) {
    const row = keys.map((k) => output[k][i]).join(delimiter);
    rows.push(row);
  }
  return rows.join(EOL) + EOL;
}

/**
 * Format the output.
 */
function formatOutput(output: ClassOutput, format: string): string {
  switch (format) {
    case "json":
      return JSON.stringify(output, null, 2);
    case "tsv":
      return dsv(output, "\t");
    case "csv":
      return dsv(output, ",");
    default:
      throw new Error(`Invalid format: ${format}`);
  }
}

/**
 * Build the CLI command.
 *
 */
function buildCommand() {
  const program = new Command();
  program.name("class").description("Run a CLASS model");
  // TODO add version, will need to get it from package.json

  program
    .command("run", { isDefault: true })
    .argument(
      "<config-file>",
      "Configuration file. If '-' is provided, read from stdin",
    )
    .description("Run a CLASS model")
    .option("-d, --debug", "Debug mode")
    .option("-o, --output <output-file>", "Output file. Default is stdout", "-")
    .addOption(
      new Option("-f, --format <format>", "Output format")
        .choices(["json", "tsv", "csv"] as const)
        .default("json"),
    )
    .action(async (configFile, options) => {
      if (options.debug) {
        console.error("Running CLASS model with config file: ", configFile);
      }
      const configAsString = await readTextFile(configFile);
      const rawConfig = JSON.parse(configAsString);
      const config = parse(rawConfig);
      if (options.debug) {
        console.error("Configuration: ", config);
      }
      const startTime = Date.now();

      const output = runClass(config);

      const duration = Date.now() - startTime;
      if (options.debug) {
        console.error(`Took ${duration}ms to run.`);
      }
      const body = formatOutput(output, options.format);
      if (options.output === "-") {
        console.log(body);
      } else {
        await writeTextFile(body, options.output);
      }
    });

  program
    .command("generate")
    .description("Print a default configuration file")
    .option("-o, --output <output-file>", "Output file. Default is stdout", "-")
    .action((options) => {
      const defaultConfig = parse({});
      const output = JSON.stringify(defaultConfig, null, 2);
      if (options.output === "-") {
        console.log(output);
      } else {
        writeTextFile(output, options.output);
      }
    });

  return program;
}

/**
 * Main function for the CLI.
 */
function main() {
  const program = buildCommand();
  program.parse();
}

if (require.main === module) {
  main();
}
