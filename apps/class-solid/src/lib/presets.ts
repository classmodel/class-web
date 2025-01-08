import {
  type ExperimentConfigSchema,
  type PartialConfig,
  parse,
  parseExperimentConfig,
} from "@classmodel/class/validate";
import { createResource } from "solid-js";

function absoluteUrl(rawUrl: string) {
  let url = rawUrl;
  if (window) {
    // TODO add host:port to url
  }
  if (rawUrl.startsWith("/") && import.meta.env.BASE_URL !== "/_build") {
    url = import.meta.env.BASE_URL + rawUrl;
    // TODO test in production with BASE_URL=/somepath
  }
  return url;
}

export async function presetCatalog(rawUrl = "/presets/index.json") {
  // TODO use /presets.json route which is materialized during build
  // TODO or generate complete catalog with pnpm generate:presets to src/presets.json
  const url = absoluteUrl(rawUrl);
  const response = await fetch(url);
  const presetUrls = (await response.json()) as string[];
  return await Promise.all(presetUrls.map(loadPreset));
}

export async function loadPreset(
  rawUrl: string,
): Promise<ExperimentConfigSchema> {
  const url = absoluteUrl(rawUrl);
  const response = await fetch(url);
  const json = await response.json();
  const config = parseExperimentConfig(json);
  config.preset = url;
  return config;
}

// Only load presets once and keep them in memory
export const [presets] = createResource(() => presetCatalog());

export function findPresetConfigByName(
  name: string | undefined,
): PartialConfig {
  // presets could undefined due to unrsolved fetches
  // TODO handle when this function is called before presets are loaded.
  const mypresets = presets();
  if (name && mypresets) {
    const preset = mypresets.find((p) => p.preset === name);
    if (!preset) {
      // presets() only contains presets from ../../public/presets directory
      // preset could be url to a remote server
      // TODO fetch preset from remote server, make sure to cache it
      throw new Error(`Preset ${name} not found`);
    }
    return preset.reference;
  }
  // Fallback to defaults from json schema
  return parse({});
}
