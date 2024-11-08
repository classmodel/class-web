import type { ClassOutput } from "@classmodel/class/runner";
import type { ExperimentConfigSchema } from "@classmodel/class/validate";
import { BlobReader, BlobWriter, ZipWriter } from "@zip.js/zip.js";
import { type Experiment, outputForExperiment } from "./store";

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
  const output = outputForExperiment(experiment);
  if (!output) {
    return;
  }

  if (output.reference) {
    const csvBlob = new Blob([outputToCsv(output.reference)], {
      type: "text/csv",
    });
    await zipWriter.add(`${experiment.name}.csv`, new BlobReader(csvBlob));
  }

  let permIndex = 0;
  for (const perm of experiment.permutations) {
    const name = perm.name;
    const permutationOutput = output.permutations[permIndex];
    if (output && name) {
      const csvBlob = new Blob([outputToCsv(permutationOutput)], {
        type: "text/csv",
      });
      await zipWriter.add(`${name}.csv`, new BlobReader(csvBlob));
    }
    permIndex++;
  }
  await zipWriter.close();
  return await zipFileWriter.getData();
}
