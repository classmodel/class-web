# CLASS-web

[![github repo badge](https://img.shields.io/badge/github-repo-000.svg?logo=github&labelColor=gray&color=blue)]([https://github.com//classmodel/class-web](https://github.com//classmodel/class-web))
[![Code quality](https://github.com/classmodel/class-web/actions/workflows/quality.yml/badge.svg)](https://github.com/classmodel/class-web/actions/workflows/quality.yml)

This is an implementation of  the **C**hemistry **L**and-surface **A**tmosphere **S**oil **S**lab (CLASS) model that runs entirely in the browser.

The CLASS web application is available at https://classmodel.github.io/class-web.

For more information on CLASS, see https://classmodel.github.io/.

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

The end-to-end tests are written with [playwright](https://playwright.dev/).
The tests are in `apps/class-solid/tests/*.spec.ts` and can be run with the following command:

```shell
cd ./apps/class-solid
pnpm exec playwright test
```

## Tech stack

The CLASS package is written in typescript. It uses [zod](https://zod.dev/) for
the configuration and runtime validation. Zod can be converted to/from
[JSONSchema](https://json-schema.org/), which is ideal for sharing the
configuration between web-app, library code, and perhaps other implementations
of CLASS as well.

The web application is build with [solid.js](https://docs.solidjs.com/). Solid
is a relatively simple framework for building reactive web applications. With its
metaframework [SolidStart](https://docs.solidjs.com/solid-start) it is quite
easy to pre-render the web application as static pages that can be hosted on
github pages.

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

- Use [modular forms](https://modularforms.dev/) for form state management/validation
- Use [auto](https://intuit.github.io/auto/index) for managing versions/releases
- Use [d3.js](https://d3js.org/) for more low-level charting
- Use [web workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) to run CLASS off the main thread
- Use [AssemblyScript](https://www.assemblyscript.org/) or
  [rust](https://www.rust-lang.org/what/wasm) for a faster implementation of
  CLASS running on web assembly.
- Use [storybook](https://storybook.js.org/) for UI component package
