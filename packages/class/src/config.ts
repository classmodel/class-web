/**
 * This file was automatically generated by "../scripts/json2ts.mjs" script.
 * DO NOT MODIFY IT BY HAND. Instead, modify the JSON schema file "src/config.json",
 * and run "pnpm json2ts" to regenerate this file.
 */
import type { JSONSchemaType } from "ajv/dist/2019.js";
export type Name = string;
export type Description = string;
export type ABLHeight = number;
/**
 * The potential temperature of the mixed layer at the initial time.
 */
export type MixedLayerPotentialTemperature = number;
export type TemperatureJumpAtH = number;
export type MixedLayerSpecificHumidity = number;
export type SpecificHumidityJumpAtH = number;
export type TimeStep = number;
export type TotalRunTime = number;
export type SurfaceKinematicHeatFlux = number;
export type AdvectionOfHeat = number;
export type FreeAtmospherePotentialTemperatureLapseRate = number;
export type SurfaceKinematicMoistureFlux = number;
export type AdvectionOfMoisture = number;
export type FreeAtmosphereSpecificHumidityLapseRate = number;
export type HorizontalLargeScaleDivergenceOfWind = number;
export type EntrainmentRatioForVirtualHeat = number;

export interface Config {
  name: Name;
  description: Description;
  initialState: InitialState;
  timeControl: TimeControl;
  mixedLayer: MixedLayer;
}
export interface InitialState {
  h_0: ABLHeight;
  theta_0: MixedLayerPotentialTemperature;
  dtheta_0: TemperatureJumpAtH;
  q_0: MixedLayerSpecificHumidity;
  dq_0: SpecificHumidityJumpAtH;
}
export interface TimeControl {
  dt: TimeStep;
  runtime: TotalRunTime;
}
export interface MixedLayer {
  wtheta: SurfaceKinematicHeatFlux;
  advtheta: AdvectionOfHeat;
  gammatheta: FreeAtmospherePotentialTemperatureLapseRate;
  wq: SurfaceKinematicMoistureFlux;
  advq: AdvectionOfMoisture;
  gammaq: FreeAtmosphereSpecificHumidityLapseRate;
  divU: HorizontalLargeScaleDivergenceOfWind;
  beta: EntrainmentRatioForVirtualHeat;
}

export type JsonSchemaOfConfig = JSONSchemaType<Config>;
/**
 * JSON schema of src/config.json embedded in a TypeScript file.
 */
export const jsonSchemaOfConfig = {
  type: "object",
  properties: {
    name: { type: "string", title: "Name", default: "" },
    description: { type: "string", title: "Description", default: "" },
    initialState: {
      type: "object",
      properties: {
        h_0: {
          type: "number",
          default: 200,
          title: "ABL height",
          unit: "m",
        },
        theta_0: {
          type: "number",
          default: 288,
          title: "Mixed-layer potential temperature",
          minimum: 0,
          description:
            "The potential temperature of the mixed layer at the initial time.",
          unit: "K",
        },
        dtheta_0: {
          type: "number",
          default: 1,
          title: "Temperature jump at h",
          unit: "K",
        },
        q_0: {
          type: "number",
          default: 0.008,
          unit: "kg kg-1",
          title: "Mixed-layer specific humidity",
        },
        dq_0: {
          type: "number",
          default: -0.001,
          unit: "kg kg-1",
          title: "Specific humidity jump at h",
        },
      },
      additionalProperties: false,
      required: ["h_0", "theta_0", "dtheta_0", "q_0", "dq_0"],
      title: "Initial State",
      default: {},
    },
    timeControl: {
      type: "object",
      properties: {
        dt: {
          type: "number",
          default: 60,
          unit: "s",
          title: "Time step",
        },
        runtime: {
          type: "number",
          default: 43200,
          unit: "s",
          title: "Total run time",
        },
      },
      additionalProperties: false,
      required: ["dt", "runtime"],
      title: "Time control",
      default: {},
    },
    mixedLayer: {
      type: "object",
      properties: {
        wtheta: {
          type: "number",
          default: 0.1,
          unit: "K m s-1",
          title: "Surface kinematic heat flux",
        },
        advtheta: {
          type: "number",
          default: 0,
          unit: "K s-1",
          title: "Advection of heat",
        },
        gammatheta: {
          type: "number",
          default: 0.006,
          unit: "K m-1",
          title: "Free atmosphere potential temperature lapse rate",
        },
        wq: {
          type: "number",
          default: 0.0001,
          unit: "kg kg-1 m s-1",
          title: "Surface kinematic moisture flux",
        },
        advq: {
          type: "number",
          default: 0,
          unit: "kg kg-1 s-1",
          title: "Advection of moisture",
        },
        gammaq: {
          type: "number",
          default: 0,
          unit: "kg kg-1 m-1",
          title: "Free atmosphere specific humidity lapse rate",
        },
        divU: {
          type: "number",
          default: 0,
          unit: "s-1",
          title: "Horizontal large-scale divergence of wind",
        },
        beta: {
          type: "number",
          default: 0.2,
          title: "Entrainment ratio for virtual heat",
        },
      },
      additionalProperties: false,
      required: [
        "wtheta",
        "advtheta",
        "gammatheta",
        "wq",
        "advq",
        "gammaq",
        "divU",
        "beta",
      ],
      title: "Mixed layer",
      default: {},
    },
  },
  additionalProperties: false,
  required: [
    "name",
    "description",
    "initialState",
    "timeControl",
    "mixedLayer",
  ],
  $schema: "https://json-schema.org/draft/2019-09/schema",
} as unknown as JsonSchemaOfConfig;
