import {
  type ClassConfig,
  classConfig,
  classDefaultConfigSchema,
} from "@classmodel/class/config";
import { For, Match, Switch } from "solid-js";
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from "~/components/ui/text-field";

const ClassConfigJsonSchema = classDefaultConfigSchema.definitions?.classConfig;

/**
 * Nest form rawData to shape of classConfig
 * "initialState.h_0" => { initialState: { h_0: ... } }
 */

// biome-ignore lint/suspicious/noExplicitAny: json schema types are too complex
function inflate(rawData: { [key: string]: any }) {
  // biome-ignore lint/suspicious/noExplicitAny: json schema types are too complex
  const config: { [key: string]: any } = {};

  for (const key in rawData) {
    const parts = key.split(".");
    let parent = config;

    parts.forEach((child, index) => {
      if (index === parts.length - 1) {
        // Prevent parsing "" as 0 later on
        if (rawData[key] !== "") {
          parent[child] = rawData[key];
        }
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

// biome-ignore lint/suspicious/noExplicitAny: json schema types are too complex
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

// biome-ignore lint/suspicious/noExplicitAny: json schema types are too complex
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

// biome-ignore lint/suspicious/noExplicitAny: json schema types are too complex
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
