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

/**
 * Nest form rawData to shape of classConfig
 * "initialState.h_0" => { initialState: { h_0: ... } }
 */
function inflate(rawData: { [key: string]: any }) {
  const config: { [key: string]: any } = {};

  for (const key in rawData) {
    const parts = key.split(".");
    let parent = config;

    parts.forEach((child, index) => {
      if (index === parts.length - 1) {
        parent[child] = rawData[key];
      } else {
        if (!parent[child]) {
          parent[child] = {};
        }
        parent = parent[child];
      }
    });
  }

  return config;
}

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
        const nestedData = inflate(rawData);
        const data = classConfig.parse(nestedData);
        onSubmit(data);
      }}
    >
      <ObjectField schema={ClassConfigJsonSchema} />
    </form>
  );
}

function ObjectField({ schema, name = "" }: { schema: any; name?: string }) {
  // name can be empty, but only for root, which should be treated differently
  const isRoot = name === "";

  function Children() {
    return (
      <For each={Object.entries(schema.properties)}>
        {([propName, propSchema]) => (
          <PropField
            // Nested fields should be connected with .
            name={isRoot ? `${propName}` : `${name}.${propName}`}
            schema={propSchema}
          />
        )}
      </For>
    );
  }

  return (
    <Switch>
      <Match when={isRoot}>
        <Children />
      </Match>
      <Match when={!isRoot}>
        <fieldset class="border p-2">
          <legend>{schema.description ?? name}</legend>
          {Children()}
        </fieldset>
      </Match>
    </Switch>
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
