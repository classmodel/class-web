# @classmodel/class package

[![github repo badge](https://img.shields.io/badge/github-repo-000.svg?logo=github&labelColor=gray&color=blue)]([https://github.com//classmodel/class-web](https://github.com//classmodel/class-web))
[![Code quality](https://github.com/classmodel/class-web/actions/workflows/quality.yml/badge.svg)](https://github.com/classmodel/class-web/actions/workflows/quality.yml)
[![npmjs.com](https://img.shields.io/npm/v/@classmodel/class.svg?style=flat)](https://www.npmjs.com/package/@classmodel/class)
[![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)
[![Research Software Directory Badge](https://img.shields.io/badge/rsd-00a3e3.svg)](https://research-software-directory.org/software/class-web)
[![Documentation](https://img.shields.io/badge/docs-blue)](https://classmodel.github.io/class-web/docs/)

This is an implementation of  the **C**hemistry **L**and-surface **A**tmosphere **S**oil **S**lab (CLASS) model that runs entirely in the browser or any Javascript runtime like NodeJS.

For more information on CLASS, see https://classmodel.github.io/.

## Web application

The CLASS web application that uses this package is available at https://classmodel.github.io/class-web.

## Command line usage

The class model can be run from the command line.

```shell
# Generate config file with default values
pnpx @classmodel/class generate -o config.json
# Or download one of the presets from
# https://github.com/classmodel/class-web/tree/main/apps/class-solid/src/lib/presets

# Edit the config file

# Run the model
pnpx @classmodel/class run config.json
# Outputs h variable for each timestep in JSON format

# To output csv use
pnpx @classmodel/class run --output output.csv --format csv config.json

# To read from stdin use
cat config.json | pnpx @classmodel/class -
```
If you do not have `pnpx` installed you can use `npx` instead.

In development use `pnpx tsx src/cli.ts ./config.json`.

To use the reference configuration of a experiment downloaded from the web application extract it with [jq](https://stedolan.github.io/jq/) using

```shell
jq .reference < ~/Downloads/class-MyExperiment.json  > config.json
```

## Package usage

Install with

```shell
pnpm install @classmodel/class
```

Run model with default config use

```js
import { runClass } from "@classmodel/class/runner";
const config = {}
const output = runClass(config)
console.log(output)
```

## Developers

This package is part of a [monorepo](https://github.com/classmodel/class-web) with other packages and applications.

### JSON schema

The Class model uses a JSON schema to validate the input configuration. The schema is defined in the `@classmodel/class` package and can be found at [src/config.json](https://github.com/classmodel/class-web/blob/main/packages/class/src/config.json) (in [repo](./src/config.json)). The schema is used to validate the input configuration and to generate a form to input the configuration.

The `src/config.ts` file contains the embedded JSON schema and its Typescript type definition.

<!-- When runnning `pnpm dev` or `pnpm build` the `src/config.ts` file is generated from the `src/config.json` file.

To manually generate the `src/config.ts` file run the following command:

```shell
pnpm json2ts
``` -->

At the moment you manually have to keep the `src/config.ts` file in sync with the `src/config.json` file. By copying the content over and updating the TypeScript Config type.

#### symbol

The form label uses the value of the `title` key or property key.
If you want an even shorter label you can add the `symbol` key with a string value.
An example value could be `β` for beta.
When symbol is set the title will be displayed as a tooltip.

#### unit

A property can have a `unit` key with a string value. The value can for example
`kg kg-1`. The unit will be displayed in the form.

#### ui:group

The JSON schema must be flat, due to its use for form generation. There can not be a nested object in the schema.
In the form generation use the `ui:group` key and any string value to group properties together. 
The group name will be displayed as a header in the form. The `ui:group` value should not be used across different `then` blocks.

#### Conditional properties

To allow for some properties to be only defined and required when another property is true. 
We use the `if/then/else` syntax. The `if` block should refer to a property in the main properties object.
The `then` block can define additional properties that are required when the `if` property is true.

See existing Config type in `src/config.ts` file on how to define the TypeScript type of a new `if/then/else` block. 

#### ui:widget

Some property you would like to have a different input widget for. This widget can be chosen by setting the `ui:widget` key to a string value. Valid values are

- `textarea` for a text area input

#### Supported types

The form generation can handle the following types:

- string
- number
- boolean
- array of numbers: The form will display a text input that can be filled with a comma separated list of numbers.

## Linter

To check types, you can run the `pnpm typecheck` command as other commands ignore types.

## Tests

The unit tests are written with [node:test](https://nodejs.org/api/test.html) and [node:assert](https://nodejs.org/api/assert.html).

The unit tests can be run with the following command:

```shell
pnpm test
```

To get test coverage

```shell
# Does not work via pnpm script so need to call node directly
node --import tsx --test --experimental-test-coverage --test-reporter=lcov --test-reporter-destination=lcov.info src/*.test.ts
# To generate a html report use genhtml which is part of lcov OS package
genhtml lcov.info --output-directory coverage
```

## API Documentation

The API documention of the package can be generated with

```shell
pnpm run docs
```
Which will write HTML files to `docs/` directory.

The documentation of the latest release is published at [https://classmodel.github.io/class-web/docs/](https://classmodel.github.io/class-web/docs/).

## Disclaimer

This project includes code that was generated with the assistance of a language model (LLM). All code generated by the LLM has been  reviewed by the development team.
