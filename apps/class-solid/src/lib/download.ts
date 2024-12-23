import type { ClassOutput } from "@classmodel/class/runner";
import type { ExperimentConfigSchema } from "@classmodel/class/validate";
import { BlobReader, BlobWriter, ZipWriter } from "@zip.js/zip.js";
import type { Experiment } from "./store";

export function toConfig(experiment: Experiment): ExperimentConfigSchema {
  return {
    name: experiment.name,
    description: experiment.description,
    reference: experiment.reference.config,
    permutations: experiment.permutations.map(({ name, config }) => {
      return {
        name,
        config,
      };
    }),
  };
}

export function toConfigBlob(experiment: Experiment) {
  const data = toConfig(experiment);
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
  const configBlob = new Blob([JSON.stringify(toConfig(experiment))], {
    type: "application/json",
  });
  await zipWriter.add("config.json", new BlobReader(configBlob));

  if (experiment.reference.output) {
    const csvBlob = new Blob([outputToCsv(experiment.reference.output)], {
      type: "text/csv",
    });
    await zipWriter.add(`${experiment.name}.csv`, new BlobReader(csvBlob));
  }

  for (const permutation of experiment.permutations) {
    const permutationOutput = permutation.output;
    if (permutationOutput) {
      const csvBlob = new Blob([outputToCsv(permutationOutput)], {
        type: "text/csv",
      });
      await zipWriter.add(`${permutation.name}.csv`, new BlobReader(csvBlob));
    }
  }
  await zipWriter.close();
  return await zipFileWriter.getData();
}
