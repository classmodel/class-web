/**
 * Convert JSON schema file to TypeScript file with embedded JSON schema and type definition.
 *
 * Some Javascript runtimes cannot import JSON files as ES module, so embedding the JSON schema is a workaround.
 */
import { exec as cbExec } from "node:child_process";
import { watch } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { promisify } from "node:util";

import { Command } from "@commander-js/extra-typings";
import { compileFromFile } from "json-schema-to-typescript";

async function format(schemaTsPath) {
  // Format the generated TypeScript file
  // Expect this script to be run from packages/class
  const exec = promisify(cbExec);
  const biomeHome = join(process.cwd(), "../..");
  const { stdout, stderr } = await exec(
    `pnpm biome format --write packages/class/${schemaTsPath}`,
    {
      cwd: biomeHome,
    },
  );
  console.log(stdout);
  console.error(stderr);
}

async function readJsonSchema(jsonSchemaPath) {
  const jsonSchema = await readFile(jsonSchemaPath, "utf-8");
  const trimmedJsonSchema = jsonSchema.trim();
  return trimmedJsonSchema;
}

function prefixOfJsonSchema(jsonSchemaPath) {
  const fn = basename(jsonSchemaPath, extname(jsonSchemaPath));
  // json-schema-to-typescript generates type names with base of filename with the first letter capitalized
  const prefix = fn.charAt(0).toUpperCase() + fn.slice(1);
  return prefix;
}

/**
 *
 * @param {string} jsonSchemaPath
 * @param {string} schemaTsPath
 */
async function json2ts(jsonSchemaPath, schemaTsPath) {
  // Geneerate TypeScript type definition from JSON schema
  const tsOfJsonSchema = await compileFromFile(jsonSchemaPath, {
    format: false,
    bannerComment: "",
  });

  // Modular forms does not like interface definitions
  // See https://github.com/fabian-hiller/modular-forms/issues/2
  // and https://github.com/bcherny/json-schema-to-typescript/issues/307
  // So, replace interface with type
  // for example "interface Foo {" becomes "type Foo = {"
  const tsOfJsonSchemaTypesOnly = tsOfJsonSchema.replaceAll(
    /interface\s+(\w+) {/g,
    "type $1 = {",
  );

  const prefix = prefixOfJsonSchema(jsonSchemaPath);

  // Read JSON schema file
  const trimmedJsonSchema = await readJsonSchema(jsonSchemaPath);

  // Combine types and JSON schema into a single TypeScript file
  const body = `\
/**
 * This file was automatically generated by "../scripts/json2ts.mjs" script.
 * DO NOT MODIFY IT BY HAND. Instead, modify the JSON schema file "${jsonSchemaPath}",
 * and run "pnpm json2ts" to regenerate this file.
 */  
import type { JSONSchemaType } from "ajv/dist/2019.js";
${tsOfJsonSchemaTypesOnly}
export type JsonSchemaOf${prefix} = JSONSchemaType<${prefix}>;
/**
 * JSON schema of ${jsonSchemaPath} embedded in a TypeScript file.
 */
export const jsonSchemaOf${prefix} = ${trimmedJsonSchema} as unknown as JsonSchemaOf${prefix};
`;
  await writeFile(schemaTsPath, body, { flag: "w" });

  await format(schemaTsPath);
}

function watchJsonSchema(jsonSchemaPath, schemaTsPath) {
  console.log(`Watching ${jsonSchemaPath} for changes`);
  watch(jsonSchemaPath, (event) => {
    if (event !== "change") {
      return;
    }
    console.log(
      `File ${jsonSchemaPath} has been changed, regenerating ${schemaTsPath}`,
    );
    json2ts(jsonSchemaPath, schemaTsPath).catch((err) => {
      console.error(err);
    });
  });
}

function main() {
  const program = new Command()
    .name("json2ts")
    .description(
      "Convert JSON schema file to TypeScript file with embedded JSON schema and type definition",
    )
    .option(
      "-i, --input <jsonSchemaPath>",
      "JSON schema file",
      "src/config.json",
    )
    .option("-o, --output <schemaTsPath>", "Output file path", "src/config.ts")
    .option("--watch", "Watch mode")
    .parse();
  const options = program.opts();
  const jsonSchemaPath = options.input;
  const schemaTsPath = options.output;

  if (options.watch) {
    watchJsonSchema(jsonSchemaPath, schemaTsPath);
  } else {
    console.log(`Generating ${schemaTsPath} from ${jsonSchemaPath}`);
    json2ts(jsonSchemaPath, schemaTsPath).catch((err) => {
      console.error(err);
      process.exit(1);
    });
  }
}

// TODO disabled as json-schema-to-typescript can not handle if/then/else
// main();
