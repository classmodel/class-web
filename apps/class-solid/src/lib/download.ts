import type { ClassOutput } from "@classmodel/class/runner";
import { BlobReader, BlobWriter, ZipWriter } from "@zip.js/zip.js";
import type { ExperimentConfigSchema } from "~/components/NamedConfig";
import type { Experiment } from "./store";

function toConfig(experiment: Experiment): ExperimentConfigSchema {
  const { output: _, ...reference } = experiment.reference;
  return {
    reference,
    permutations: experiment.permutations.map((perm) => {
      const { output: _, ...config } = perm;
      return config;
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
    await zipWriter.add(
      `${experiment.reference.title}.csv`,
      new BlobReader(csvBlob),
    );
  }

  for (const permutation of experiment.permutations) {
    const output = permutation.output;
    if (output) {
      const csvBlob = new Blob([outputToCsv(output)], {
        type: "text/csv",
      });
      await zipWriter.add(`${permutation.title}.csv`, new BlobReader(csvBlob));
    }
  }
  await zipWriter.close();
  return await zipFileWriter.getData();
}
