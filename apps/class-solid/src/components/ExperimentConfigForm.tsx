import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from "~/components/ui/text-field";
import { For, Switch, Match } from "solid-js";
import {
  classConfig,
  ClassConfig,
  classDefaultConfigSchema,
} from "@repo/class/config";

const ClassConfigJsonSchema = classDefaultConfigSchema.definitions!.classConfig;

export function ExperimentConfigForm({
  id,
  config,
  onSubmit,
}: {
  id: string;
  config: ClassConfig;
  onSubmit: (c: ClassConfig) => void;
}) {
  return (
    <form
      id={id}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const rawData = Object.fromEntries(formData.entries());
        // TODO nest form rawData to shape of classConfig
        // ".initialState.h_0" => { initialState: { h_0: ... } }
        const data = classConfig.parse(rawData);
        onSubmit(data);
      }}
    >
      <ObjectField schema={ClassConfigJsonSchema} />
    </form>
  );
}

function ObjectField({ schema, name = "" }: { schema: any; name?: string }) {
  return (
    <fieldset class="border p-2">
      <legend>{schema.description ?? name}</legend>
      <div>
        <For each={Object.entries(schema.properties)}>
          {([propName, propSchema]) => (
            <PropField name={`${name}.${propName}`} schema={propSchema} />
          )}
        </For>
      </div>
    </fieldset>
  );
}

function PropField({ name, schema }: { name: string; schema: any }) {
  return (
    <Switch fallback={<p>Unknown type</p>}>
      <Match when={schema.type === "object"}>
        <ObjectField name={name} schema={schema} />
      </Match>
      <Match when={schema.type === "number"}>
        <MyTextField name={name} schema={schema} />
      </Match>
      <Match when={schema.type === "string"}>
        <MyTextField name={name} schema={schema} />
      </Match>
    </Switch>
  );
}

function MyTextField({ name, schema }: { name: string; schema: any }) {
  return (
    <TextField class="grid w-full max-w-sm items-center gap-1.5">
      <TextFieldLabel for={name}>{schema.description ?? name}</TextFieldLabel>
      <TextFieldInput
        type="text"
        id={name}
        name={name}
        placeholder={schema.default}
      />
    </TextField>
  );
}
