import { pruneDefaults } from "@classmodel/class/validate";
import { type SubmitHandler, createForm } from "@modular-forms/solid";
import type { Experiment } from "~/lib/store";
import {
  type NamedConfig,
  NamedConfigAsJsonSchema,
  validate,
} from "./NamedConfig";
import { ObjectField } from "./ObjectField";
import { ajvForm } from "./ajvForm";

export function ExperimentConfigForm({
  id,
  experiment,
  onSubmit,
}: {
  id: string;
  experiment: Experiment;
  onSubmit: (c: NamedConfig) => void;
}) {
  const [_, { Form, Field }] = createForm<NamedConfig>({
    initialValues: {
      title: experiment.name,
      description: experiment.description,
      ...pruneDefaults(experiment.reference.config),
    },
    validate: ajvForm(validate),
  });

  const handleSubmit: SubmitHandler<NamedConfig> = (values, event) => {
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
          schema={NamedConfigAsJsonSchema}
          value={pruneDefaults(experiment.reference.config)}
          Field={Field}
        />
      </div>
    </Form>
  );
}
