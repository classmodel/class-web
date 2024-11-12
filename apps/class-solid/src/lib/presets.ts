import {
  type ExperimentConfigSchema,
  parseExperimentConfig,
} from "@classmodel/class/validate";

function absoluteUrl(rawUrl: string) {
  let url = rawUrl;
  if (window) {
    // TODO add host:port to url
  }
  if (rawUrl.startsWith("/") && import.meta.env.BASE_URL !== "/_build") {
    url = import.meta.env.BASE_URL + rawUrl;
  }
  return url;
}

export async function presetCatalog(rawUrl = "/presets/index.json") {
  // TODO use /presets.json route which is materialized during build
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
