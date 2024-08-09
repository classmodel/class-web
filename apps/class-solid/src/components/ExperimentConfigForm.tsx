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

        onSubmit(nestedData);
      }}
    >
      <div class="grid grid-flow-col gap-1">
        <ObjectField schema={ClassConfigJsonSchema} value={config} />
      </div>
    </form>
  );
}

function ObjectField({
  schema,
  name = "",
  value,
  // biome-ignore lint/suspicious/noExplicitAny: json schema types are too complex
}: { schema: any; name?: string; value?: any }) {
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
            value={value?.[propName]}
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

function PropField({
  name,
  schema,
  value,
  // biome-ignore lint/suspicious/noExplicitAny: json schema types are too complex
}: { name: string; schema: any; value: any }) {
  return (
    <Switch fallback={<p>Unknown type</p>}>
      <Match when={schema.type === "object"}>
        <ObjectField name={name} schema={schema} value={value} />
      </Match>
      <Match when={schema.type === "number"}>
        <MyTextField name={name} schema={schema} value={value} />
      </Match>
      <Match when={schema.type === "string"}>
        <MyTextField name={name} schema={schema} value={value} />
      </Match>
    </Switch>
  );
}

function MyTextField({
  name,
  schema,
  value,
  // biome-ignore lint/suspicious/noExplicitAny: json schema types are too complex
}: { name: string; schema: any; value: any }) {
  return (
    <TextField class="grid w-full max-w-sm items-center gap-1.5">
      <TextFieldLabel for={name}>{schema.description ?? name}</TextFieldLabel>
      <TextFieldInput
        type="text"
        id={name}
        name={name}
        value={value}
        placeholder={schema.default}
      />
    </TextField>
  );
}
