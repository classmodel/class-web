import type { Config } from "@classmodel/class/config";
import { pruneConfig } from "@classmodel/class/config_utils";
import { type SubmitHandler, createForm } from "@modular-forms/solid";
import { createMemo } from "solid-js";
import { unwrap } from "solid-js/store";
import type { ExperimentConfig } from "~/lib/experiment_config";
import { findPresetByName } from "~/lib/presets";
import { ObjectField } from "./ObjectField";
import { ajvForm } from "./ajvForm";

export function ExperimentConfigForm({
  id,
  experiment,
  onSubmit,
}: {
  id: string;
  experiment: ExperimentConfig;
  onSubmit: (c: Config) => void;
}) {
  const preset = createMemo(() => findPresetByName(experiment.preset));

  const initialValues = createMemo(() =>
    pruneConfig(unwrap(experiment.reference), unwrap(preset().config)),
  );
  const [_, { Form, Field }] = createForm<Config>({
    initialValues: initialValues(),
    validate: ajvForm(preset().validate),
  });

  const handleSubmit: SubmitHandler<Config> = (values, event) => {
    // Use ajv to coerce strings to numbers and fill in defaults
    preset().validate(values);
    onSubmit(values);
  };

  return (
    <Form
      id={id}
      onSubmit={handleSubmit}
      shouldActive={false} // Also return from collapsed fields
      shouldDirty={false} // ~Don't return empty strings for unset fields~
    >
      <div>
        <ObjectField
          schema={preset().schema}
          value={initialValues()}
          Field={Field}
        />
      </div>
    </Form>
  );
}
