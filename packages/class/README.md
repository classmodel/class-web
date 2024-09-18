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
# Generate default config file
pnpx @classmodel/class generate --output config.json

# Run the model
pnpx @classmodel/class run config.json
# Outputs h variable for each timestep in JSON format

# To output csv use
pnpx @classmodel/class run --output output.csv --formtat csv config.json

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

If any changes are made to the `src/config.json` file then the Typescript type need to be regenerated with the following command:

```shell
pnpm json2ts
```

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