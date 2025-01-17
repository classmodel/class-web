import type { ClassOutput } from "@classmodel/class/runner";
import { BlobReader, BlobWriter, ZipWriter } from "@zip.js/zip.js";
import { toPartial } from "./encode";
import type { ExperimentConfig } from "./experiment_config";
import type { Experiment } from "./store";

export function toConfigBlob(experiment: ExperimentConfig) {
  const data = toPartial(experiment);
  return new Blob([JSON.stringify(data, undefined, 2)], {
    type: "application/json",
  });
}

function outputToCsv(output: ClassOutput) {
  const headers = Object.keys(output);
  const lines = [headers.join(",")];
  for (let i = 0; i < output[headers[0]].length; i++) {
    lines.push(headers.map((h) => output[h][i]).join(","));
  }
  return lines.join("\n");
}

export async function createArchive(experiment: Experiment) {
  const zipFileWriter = new BlobWriter();
  const zipWriter = new ZipWriter(zipFileWriter);
  const configBlob = new Blob(
    [JSON.stringify(toPartial(experiment.config), undefined, 2)],
    {
      type: "application/json",
    },
  );
  await zipWriter.add("config.json", new BlobReader(configBlob));

  if (experiment.output.reference) {
    const csvBlob = new Blob([outputToCsv(experiment.output.reference)], {
      type: "text/csv",
    });
    await zipWriter.add(
      `${experiment.config.reference.name}.csv`,
      new BlobReader(csvBlob),
    );
  }

  for (let index = 0; index < experiment.config.permutations.length; index++) {
    const permConfig = experiment.config.permutations[index];
    const permutationOutput = experiment.output.permutations[index];
    if (permutationOutput) {
      const csvBlob = new Blob([outputToCsv(permutationOutput)], {
        type: "text/csv",
      });
      await zipWriter.add(`${permConfig.name}.csv`, new BlobReader(csvBlob));
    }
  }
  await zipWriter.close();
  return await zipFileWriter.getData();
}
