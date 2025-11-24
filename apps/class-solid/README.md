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
The format is JSON with content adhering to the [JSON schema](https://github.com/classmodel/class-web/blob/main/packages/class/src/config.ts).

The `src/lib/presets.ts` is used as an index of presets.
If you add a preset the `src/lib/presets.ts` file needs to be updated.

An experiment from a preset can be opened from a URL like `?preset=<preset-name>`.
For example to load <src/lib/presets/death-valley.json> use `http://localhost:3000/?preset=Death%20Valley`.

## Loading experiment from URL

A saved experiment (`<experiment-name>.json` file) can be loaded from a URL with the `e` search query parameter.

For example `https://classmodel.github.io/class-web?e=https://wildfiredataportal.eu/fire/batea/class.json` will load the experiment from `https://wildfiredataportal.eu/fire/batea/class.json`.

The server hosting the JSON file must have CORS enabled so the CLASS web application is allowed to download it, see [https://enable-cors.org](https://enable-cors.org) for details.

<details>
<summary>Local development</summary>

The `./mock-wildfiredataportal/` directory contains mocked experiment similar to a wildfire at https://wildfiredataportal.eu/data/wildfire-data-portal/.

Besides the `pnpm dev` start a static web server hosting the `./mock-wildfiredataportal/` directory.

```shell
pnpm exec serve --cors --listen 3001 ./mock-wildfiredataportal
```

Visit [http://localhost:3000/?e=http://localhost:3001/batea.json](http://localhost:3000/?e=http://localhost:3001/batea.json).

</details>