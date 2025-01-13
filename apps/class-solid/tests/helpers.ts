import type { Download } from "@playwright/test";
import type { ExperimentConfig } from "~/lib/experiment_config";

export async function parseDownload(
  downloadPromise: Promise<Download>,
): Promise<ExperimentConfig> {
  const download = await downloadPromise;
  const readStream = await download.createReadStream();
  const body = await new Promise<string>((resolve, reject) => {
    const chunks: string[] = [];
    readStream.on("data", (chunk) => chunks.push(chunk));
    readStream.on("end", () => resolve(chunks.join("")));
    readStream.on("error", reject);
  });
  return JSON.parse(body) as ExperimentConfig;
}
