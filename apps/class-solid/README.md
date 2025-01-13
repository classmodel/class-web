# SolidStart

Everything you need to build a Solid project, powered by [`solid-start`](https://start.solidjs.com);

## Creating a project

```bash
# create a new project in the current directory
npm init solid@latest

# create a new project in my-app
npm init solid@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

Solid apps are built with _presets_, which optimise your project for deployment to different environments.

By default, `npm run build` will generate a Node app that you can run with `npm start`. To use a different preset, add it to the `devDependencies` in `package.json` and specify in your `app.config.js`.

## Testing

The end-to-end tests are written with [playwright](https://playwright.dev/).
The tests are in `tests/*.spec.ts` and can be run with the following command:

```shell
pnpm exec playwright install  # first time only
pnpm test
```

To develop and debug end-to-end tests use

```shell
pnpm test -- --ui --headed
```

This allows you to trigger tests from the [playwright ui](https://playwright.dev/docs/test-ui-mode) and enable [watch mode](https://playwright.dev/docs/test-ui-mode#watch-mode).

## This project was created with the [Solid CLI](https://solid-cli.netlify.app)

## Presets

An experiment can get started from a preset.

The presets are stored in the `src/lib/presets/` directory.
The format is JSON with title, desscription, reference, permutations keys.
It is the same format as downloading a configuration file from an existing experiment.

The `src/lib/presets.ts` is used as an index of presets.
If you add or rename a preset the `src/lib/presets.ts` file needs to be updated.
