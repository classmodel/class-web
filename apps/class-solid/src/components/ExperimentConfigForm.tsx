import {
  type ClassConfig,
  classConfig,
  classDefaultConfigSchema,
} from "@classmodel/class/config";
import type { Experiment } from "~/lib/store";
import { inflate } from "../lib/inflate";
import { MyTextField, ObjectField } from "./ObjectField";

const ClassConfigJsonSchema = classDefaultConfigSchema.definitions?.classConfig;

export function ExperimentConfigForm({
  id,
  experiment,
  onSubmit,
}: {
  id: string;
  experiment: Experiment;
  onSubmit: (
    c: Partial<ClassConfig>,
    name: string,
    description: string,
  ) => void;
}) {
  return (
    <form
      id={id}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const rawData = Object.fromEntries(formData.entries());
        const {
          experiment_name,
          experiment_description,
          ...rawDataWithouMeta
        } = rawData;
        const name = typeof experiment_name === "string" ? experiment_name : "";
        const description =
          typeof experiment_description === "string"
            ? experiment_description
            : "";
        const nestedData = inflate(rawDataWithouMeta);
        // Parse only for validation
        const data = classConfig.parse(nestedData);
        // TODO if parse fails, show error
        onSubmit(nestedData, name, description);
      }}
    >
      <MyTextField
        name="experiment_name"
        schema={{ type: "string", description: "Name" }}
        value={experiment.name}
        required
        minlength="1"
      />
      <MyTextField
        name="experiment_description"
        schema={{ type: "string", description: "Description" }}
        value={experiment.description}
      />
      <div class="grid grid-flow-col gap-1">
        <ObjectField
          schema={ClassConfigJsonSchema}
          value={experiment.reference.config}
        />
      </div>
    </form>
  );
}
