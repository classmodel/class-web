import { type Config, jsonSchemaOfConfig } from "@classmodel/class/config";
import { ValidationError, ajv } from "@classmodel/class/validate";
import type { DefinedError, JSONSchemaType, ValidateFunction } from "ajv";
import { overwriteDefaultsInJsonSchema } from "./experiment_config";
// TODO replace with preset of a forest fire
import deathValley from "./presets/death-valley.json";

const presetConfigs = [
  {
    name: "Default",
    description: "The classic default configuration",
  },
  deathValley,
] as const;

export interface Preset {
  config: Config;
  schema: JSONSchemaType<Config>;
  validate: ValidateFunction<Config>;
  parse: (input: unknown) => Config;
}

function loadPreset(preset: unknown): Preset {
  const config = parse(preset);
  const schema = overwriteDefaultsInJsonSchema(jsonSchemaOfConfig, config);
  const validate = ajv.compile(schema);

  function parse(input: unknown): Config {
    if (!validate(input)) {
      throw new ValidationError(validate.errors as DefinedError[]);
    }
    return input;
  }

  return { config, schema, validate, parse };
}

export const presets = presetConfigs.map(loadPreset);

/**
 * Finds a preset by its name.
 *
 * @param name - The name of the preset configuration to find. If undefined, the default preset is returned.
 * @returns The preset that matches the given name, or the default preset if no match is found.
 */
export function findPresetByName(name?: string): Preset {
  if (!name) return presets[0];
  return presets.find((preset) => preset.config.name === name) ?? presets[0];
}
