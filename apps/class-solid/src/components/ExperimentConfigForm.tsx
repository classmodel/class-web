import type { Config } from "@classmodel/class/config";
import { pruneConfig } from "@classmodel/class/config_utils";
import { createMemo } from "solid-js";
import { unwrap } from "solid-js/store";
import type { ExperimentConfig } from "~/lib/experiment_config";
import { findPresetByName } from "~/lib/presets";
import { Form } from "./form/Form";

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

  const handleSubmit = (values: Config) => {
    // Use ajv to coerce strings to numbers and fill in defaults
    preset().validate(values);
    onSubmit(values);
  };

  return (
    <Form
      id={id}
      onSubmit={handleSubmit}
      values={experiment.reference}
      defaults={preset().config}
      schema={preset().schema}
    />
  );
}
