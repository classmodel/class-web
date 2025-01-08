import {
  ajv,
  overwriteDefaultsInJsonSchema,
  pruneConfig,
} from "@classmodel/class/validate";
import { type SubmitHandler, createForm } from "@modular-forms/solid";
import { createMemo } from "solid-js";
import { unwrap } from "solid-js/store";
import { findPresetConfigByName } from "~/lib/presets";
import type { Experiment } from "~/lib/store";
import { type NamedConfig, jsonSchemaOfNamedConfig } from "./NamedConfig";
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
  const presetConfig = createMemo(() =>
    findPresetConfigByName(experiment.preset),
  );

  const jsonSchemaOfPreset = createMemo(() => {
    const schema = overwriteDefaultsInJsonSchema(
      jsonSchemaOfNamedConfig,
      unwrap(presetConfig()),
    );
    return schema;
  });

  const initialValues = createMemo(() => {
    const config = pruneConfig(
      unwrap(experiment.reference.config),
      unwrap(presetConfig()),
    );
    return {
      title: experiment.name,
      description: experiment.description,
      ...config,
    };
  });
  const [_, { Form, Field }] = createForm<NamedConfig>({
    initialValues: initialValues(),
    validate: ajvForm(ajv.compile(jsonSchemaOfPreset())),
  });

  const handleSubmit: SubmitHandler<NamedConfig> = (values, event) => {
    // Use ajv to coerce strings to numbers and fill in defaults
    ajv.compile(jsonSchemaOfPreset())(values);
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
          schema={jsonSchemaOfPreset()}
          value={initialValues()}
          Field={Field}
        />
      </div>
    </Form>
  );
}
