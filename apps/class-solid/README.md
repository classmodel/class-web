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

A saved state (`class-<experiment-name>.json` file) can be loaded from a URL with the `s` search query parameter.

For example `https://classmodel.github.io/class-web?s=https://wildfiredataportal.eu/fire/batea/class.json` will load the experiment from `https://wildfiredataportal.eu/fire/batea/class.json`.

The server hosting the JSON file must have CORS enabled so the CLASS web application is allowed to download it, see [https://enable-cors.org](https://enable-cors.org) for details.

<details>
<summary>Local development</summary>

Besides the `pnpm dev` start a static web server hosting the `./mock-wildfiredataportal/` directory.

```shell
mkdir -p ./mock-wildfiredataportal
# Create a mocked state with experiment similar to https://wildfiredataportal.eu/fire/batea/
cat <<EOF > ./mock-wildfiredataportal/batea.json
{
  "experiments": [{
    "reference": {
      "name": "batea",
      "description": "Copied from https://wildfiredataportal.eu/fire/batea/ with mocked observations.",
      "h": 912,
      "theta": 299.1,
      "dtheta": 0.816,
      "gamma_theta": [0.00509, 0.00216],
      "z_theta": [2138, 4000],
      "qt": 0.0055,
      "dqt": -0.000826,
      "gamma_qt": [-8.08e-7, -5.62e-7],
      "z_qt": [2253, 4000],
      "divU": -6.7e-7,
      "u": -3.22,
      "ug": -1.9,
      "du": 1.33,
      "gamma_u": [0.00186, 0.00404],
      "z_u": [2125, 4000],
      "v": 4.81,
      "vg": 5.81,
      "dv": 1,
      "gamma_v": [-0.00243, -0.001],
      "z_v": [1200, 4000],
      "ustar": 0.1,
      "runtime": 10800,
      "wtheta": [0.404, 0.41, 0.375, 0.308, 0.205, 0.12, 0.036, 0, 0, 0, 0, 0],
      "wq": [
        0, 0, 0, 0, 7.6e-7, 0.00000128, 0.00000146, 0.00000125, 0.00000115,
        0.00000115, 0.00000252, 0.00000183
      ],
      "fc": 0.000096,
      "p0": 97431,
      "z0m": 0.45,
      "z0h": 0.00281,
      "is_tuned": true,
      "t0": "2024-05-11T12:00:00Z"
    },
    "preset": "Varnavas",
    "permutations": [],
    "observations": [
      {
        "name": "Mocked soundings",
        "height": [0, 1000, 2000, 3000, 4000],
        "pressure": [900, 800, 700, 600, 500],
        "temperature": [16.4, 10.2, 4.0, -2.2, -8.4],
        "relativeHumidity": [30, 25, 20, 15, 10],
        "windSpeed": [2, 5, 10, 15, 20],
        "windDirection": [180, 200, 220, 240, 260]
      }
    ]
  }]
}
EOF

pnpm exec serve --cors --listen 3001 ./mock-wildfiredataportal
```

Visit [http://localhost:3000/?s=http://localhost:3001/batea.json](http://localhost:3000/?s=http://localhost:3001/batea.json).

</details>