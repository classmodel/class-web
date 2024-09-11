import {
  type ClassConfig,
  classConfig,
  classDefaultConfigSchema,
} from "@classmodel/class/config";
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
  return (
    <form
      id={id}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const rawData = Object.fromEntries(formData.entries());
        const nestedData = inflate(rawData);
        // Parse only for validation
        const data = classConfig.parse(nestedData);
        // TODO if parse fails, show error
        onSubmit(nestedData);
      }}
    >
      <div class="grid grid-flow-col gap-1">
        <ObjectField schema={ClassConfigJsonSchema} value={config} />
      </div>
    </form>
  );
}
