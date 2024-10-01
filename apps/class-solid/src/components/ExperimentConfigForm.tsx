import { pruneDefaults } from "@classmodel/class/validate";
import { type SubmitHandler, createForm } from "@modular-forms/solid";
import { createMemo } from "solid-js";
import { type Experiment, stripOutput } from "~/lib/store";
import {
  type NamedConfig,
  jsonSchemaOfNamedConfig,
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
  const initialValues = createMemo(() => {
    return pruneDefaults(stripOutput(experiment.reference));
  });
  const [_, { Form, Field }] = createForm<NamedConfig>({
    initialValues: initialValues(),
    validate: ajvForm(validate),
  });

  const handleSubmit: SubmitHandler<NamedConfig> = (values, event) => {
    // Use validate to coerce strings to numbers
    validate(values);

    onSubmit(values);
  };

  return (
    <Form
      id={id}
      onSubmit={handleSubmit}
      shouldActive={false} // Also return from collapsed fields
    >
      <div>
        <ObjectField
          schema={jsonSchemaOfNamedConfig}
          value={initialValues}
          Field={Field}
        />
      </div>
    </Form>
  );
}
