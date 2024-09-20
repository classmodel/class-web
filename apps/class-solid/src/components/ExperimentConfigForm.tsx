import {
  type ClassConfig,
  classConfig,
  classDefaultConfigSchema,
} from "@classmodel/class/config";
import {
  type SubmitHandler,
  createForm,
  setValues,
} from "@modular-forms/solid";
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
  const [configFormStore, { Form, Field }] = createForm<ClassConfig>();
  setValues(configFormStore, config);

  const handleSubmit: SubmitHandler<ClassConfig> = (values, event) => {
    console.log(values);
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
          value={config}
          Field={Field}
        />
      </div>
    </Form>
  );
}
