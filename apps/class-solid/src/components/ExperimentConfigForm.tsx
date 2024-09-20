import {
  type ClassConfig,
  classConfig,
  classDefaultConfigSchema,
} from "@classmodel/class/config";
import { SubmitHandler, createForm, getValues } from "@modular-forms/solid";
import { inflate } from "../lib/inflate";
import { ObjectField } from "./ObjectField";

const ClassConfigJsonSchema = classDefaultConfigSchema.definitions?.classConfig;

export function ExperimentConfigForm({
  id,
  config,
  onSubmit,
}: {
  id: string;
  config: Partial<ClassConfig>;
  onSubmit: (c: Partial<ClassConfig>) => void;
}) {
  const [configForm, { Form, Field }] = createForm<ClassConfig>();

  const handleSubmit: SubmitHandler<ClassConfig> = (values, event) => {
    const gotValues = getValues(configForm, { shouldActive: false });
    console.log(gotValues);
    // Parse only for validation
    const data = classConfig.parse(values);
    // TODO if parse fails, show error
    onSubmit(values);
  };

  return (
    <Form id={id} onSubmit={handleSubmit}>
      <div>
        <ObjectField
          schema={ClassConfigJsonSchema}
          value={config}
          Field={Field}
        />
      </div>
    </Form>
  );
}
