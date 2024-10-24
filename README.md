# CLASS-web

[![github repo badge](https://img.shields.io/badge/github-repo-000.svg?logo=github&labelColor=gray&color=blue)]([https://github.com//classmodel/class-web](https://github.com//classmodel/class-web))
[![Code quality](https://github.com/classmodel/class-web/actions/workflows/quality.yml/badge.svg)](https://github.com/classmodel/class-web/actions/workflows/quality.yml)
[![npmjs.com](https://img.shields.io/npm/v/@classmodel/class.svg?style=flat)](https://www.npmjs.com/package/@classmodel/class)
[![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)
[![Research Software Directory Badge](https://img.shields.io/badge/rsd-00a3e3.svg)](https://research-software-directory.org/software/class-web)
[![Documentation](https://img.shields.io/badge/docs-blue)](https://classmodel.github.io/class-web/docs/)

This is an implementation of  the **C**hemistry **L**and-surface **A**tmosphere **S**oil **S**lab (CLASS) model that runs entirely in the browser.

For more information on CLASS, see https://classmodel.github.io/.

## Web application

The CLASS web application (from [apps/class-solid](apps/class-solid) directory) is available at https://classmodel.github.io/class-web.

## Command line usage

The class model can be run from the command line.
The argument is the config file that should adhere to the [JSON schema](./packages/class/src/config.json).

```shell
# Generate default config file
pnpx @classmodel/cli generate --output config.json

# Run the model
pnpx @classmodel/cli run config.json
# Outputs h variable for each timestep in JSON format

# To output csv use
pnpx @classmodel/cli run --output output.csv --formtat csv config.json

# To read from stdin use
cat config.json | pnpx @classmodel/cli -
```

In development use `pnpx tsx src/cli.ts ./config.json`.

To use the reference configuration of a experiment downloaded from the web application use.

```shell
jq .reference < ~/Downloads/class-MyExperiment.json  > config.json
```

## Developers

This repository is a so-called monorepo, where multiple packages and application
can easily be developed in tandem.

We used [TurboRepo](https://turbo.build/repo) for the initial setup, which uses
[pnpm workspaces](https://pnpm.io/workspaces) under the hood. As such, it is
possible to do advanced tricks with Turbo, such as "lint/test/build all
apps/packages at once with `turbo build`", and share tooling configurations
across packages/apps, but since this repo is small, we will not rely too much on
these features.

Currently the repo is home to the following:

- packages/
  - class: reimplementation of CLASS in typescript
- apps/
  - class-solid: web application with a graphical user interface for CLASS

### JSON schema

The Class model uses a JSON schema to validate the input configuration. The schema is defined in the `@classmodel/class` package and can be found in [packages/class/src/config.json](packages/class/src/config.json). The schema is used to validate the input configuration and to generate a form to input the configuration.

If any changes are made to the `packages/class/src/config.json` file then the Typescript type need to be regenerated with the following command:

```shell
cd packages/class
pnpm json2ts
```

### Publish package

To publish a new version of the class package:

1. Bump version in `**/package.json` and `packages/class/jsr.json` files. They should all have same version.
2. Commit & push changes to main branch.
3. Create a new [GitHub release](https://github.com/classmodel/class-web/releases)
   - Tag version and title should be the same as the version in the package.json file with `v` prefix.
   - Use `Implementation of the Chemistry Land-surface Atmosphere Soil Slab (CLASS) model that runs entirely in the browser.` as the description with generated release notes.
4. A GitHub CI workflow will publish the package to [jsr](https://jsr.io/@classmodel/class)

After the workflow has completed the new version will be available on [jsr](https://jsr.io/@classmodel/class).

## Local build

To run a local development version:

```sh
git clone git@github.com:classmodel/class-web.git
cd class-web
pnpm install
pnpm dev
```

## Linter & formatter

We use [biome](https://biomejs.dev/) to lint and format the code. 
The following commands are available

```shell
# To run linter and formatter use
pnpm format-and-lint
# To fix formatting and some lint errors run
pnpm format-and-lint:fix
# To run other biome comands use
pnpm exec biome --help
```

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

## Tech stack

The CLASS package is written in typescript.
It uses a [JSON schema](https://json-schema.org/) to define the shape and constraints of a configuration.
JSON schema is cross-langanuage and is ideal for sharing the
configuration between web-app, library code, and perhaps other implementations
of CLASS as well.
To validate a configuration it uses the JSON schema together with [ajv](https://ajv.js.org/).
Ajv is the reference JSON schema validator in then JS ecosystem.

The CLI uses [Commander](https://www.npmjs.com/package/commander) to parse the command line arguments.
Commander is the most popular package for building command line interfaces with sub-command support in Mode.js.

The web application is build with [solid.js](https://docs.solidjs.com/). Solid
is a relatively simple framework for building reactive web applications. With its
metaframework [SolidStart](https://docs.solidjs.com/solid-start) it is quite
easy to pre-render the web application as static pages that can be hosted on
github pages. To keep track of form state and errors it uses [modular forms](https://modularforms.dev/) package.

We've chosen [SolidUI](https://www.solid-ui.com/) as the basis for the UI. Build
after [ShadCN](), SolidUI provides good-looking, accessible components (powered
by [Kobalte](https://kobalte.dev/docs/core/overview/introduction) and
[tailwind](https://tailwindcss.com/)) that can be copy-pasted into the web
application and tweaked further as seen fit. It can also do charts, using
[chart.js](https://www.chartjs.org/), though we might deviate from that later.

To expose the model in a standard way we use the [Basic Model Interface (BMI)](https://bmi.readthedocs.io/).

To prevent the user interface from getting blocked by running the model we use a [Web worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker) to run the computation in a background task/thread.
A Web worker uses messages passing to communicate, this does not fit with the Basic Model Interface so we use [comlink](https://github.com/GoogleChromeLabs/comlink) to wrap the Web Worker in a BMI class.

To format and lint the code, we use [biome](https://biomejs.dev/) as it combines eslint, prettier in one package.

**Further plans/ideas**

- Use [auto](https://intuit.github.io/auto/index) for managing versions/releases
- Use [d3.js](https://d3js.org/) for more low-level charting
- Use [AssemblyScript](https://www.assemblyscript.org/) or
  [rust](https://www.rust-lang.org/what/wasm) for a faster implementation of
  CLASS running on web assembly.
- Use [storybook](https://storybook.js.org/) for UI component package
