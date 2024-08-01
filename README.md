# CLASS-web

This is an implementation of CLASS that runs entirely in the browser.

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
  - config-eslint: shared configuration for eslint
  - config-typescript: shared configuration for typescript
- apps/
  - class-solid: web application with a graphical user interface for CLASS

## Local build

To run a local development version:

```sh
git clone git@github.com:classmodel/class-web.git
cd class-web/apps/class-solid
pnpm install
pnpm run dev
```

## Tech stack

The CLASS package is written in typescript. It uses [zod](https://zod.dev/) for
the configuration and runtime validation. Zod can be converted to/from
[JSONSchema](https://json-schema.org/), which is ideal for sharing the
configuration between web-app, library code, and perhaps other implementations
of CLASS as well.

The web application is build with [solid.js](https://docs.solidjs.com/). Solid
has a relatively simple model for building reactive web applications. With its
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

**Further plans/ideas**

- Use [biome](https://biomejs.dev/) for linting/formatting
- Use [modular forms](https://modularforms.dev/) for form state management/validation
- Use [auto](https://intuit.github.io/auto/index) for managing versions/releases
- Use [d3.js](https://d3js.org/) for more low-level charting
- Use [web workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) to run CLASS off the main thread
- Use [AssemblyScript](https://www.assemblyscript.org/) or
  [rust](https://www.rust-lang.org/what/wasm) for a faster implementation of
  CLASS running on web assembly.
- Test with node test runner rather than jest (for the package) and/or use
  [playwright](https://playwright.dev/) and/or
  [storybook](https://storybook.js.org/) (for the web app)
