import type { Config } from "@classmodel/class/config";
import { Form } from '@classmodel/form';
import { createMemo } from "solid-js";
import type { ExperimentConfig } from "~/lib/experiment_config";
import { findPresetByName } from "~/lib/presets";

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

  return (
    <Form
      id={id}
      onSubmit={onSubmit}
      values={experiment.reference}
      defaults={preset().config}
      schema={preset().schema}
    />
  );
}
