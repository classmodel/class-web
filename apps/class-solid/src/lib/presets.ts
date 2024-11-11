import {
  type ExperimentConfigSchema,
  parseExperimentConfig,
} from "@classmodel/class/validate";

export async function presetCatalog(url = "/presets/index.json") {
  // TODO use /presets.json route which is materialized during build
  const response = await fetch(url);
  const presetUrls = (await response.json()) as string[];
  return await Promise.all(presetUrls.map(loadPreset));
}

export async function loadPreset(url: string): Promise<ExperimentConfigSchema> {
  const response = await fetch(url);
  const json = await response.json();
  const config = parseExperimentConfig(json);
  config.preset = url;
  return config;
}
