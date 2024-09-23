import {
  type ClassConfig,
  classConfig,
  classDefaultConfigSchema,
} from "@classmodel/class/config";
import { type SubmitHandler, createForm } from "@modular-forms/solid";
import type { Experiment } from "~/lib/store";
import { ObjectField } from "./ObjectField";

const ClassConfigJsonSchema = classDefaultConfigSchema.definitions?.classConfig;

export function ExperimentConfigForm({
  id,
  experiment,
  onSubmit,
}: {
  id: string;
  experiment: Experiment;
  onSubmit: (c: Partial<ClassConfig>) => void;
}) {
  const [_, { Form, Field }] = createForm<ClassConfig>({
    initialValues: {
      title: experiment.name,
      description: experiment.description,
      ...experiment.reference.config,
    },
  });

  const handleSubmit: SubmitHandler<ClassConfig> = (values, event) => {
    // Parse only for validation
    const data = classConfig.parse(values);
    // TODO if parse fails, show error
    onSubmit(values);
  };

  return (
    <Form
      id={id}
      onSubmit={handleSubmit}
      shouldActive={false} // Also return from collapsed fields
      shouldDirty={true} // Don't return empty strings for unset fields
    >
      <div>
        <ObjectField
          schema={ClassConfigJsonSchema}
          value={experiment.reference.config}
          Field={Field}
        />
      </div>
    </Form>
  );
}
