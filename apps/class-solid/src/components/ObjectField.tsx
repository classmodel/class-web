import { For, Match, Switch } from "solid-js";
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from "~/components/ui/text-field";

export function ObjectField({
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

export function MyTextField({
  name,
  schema,
  value,
  ...props
  // biome-ignore lint/suspicious/noExplicitAny: json schema types are too complex
}: { name: string; schema: any; value: any; [key: string]: any }) {
  return (
    <TextField class="grid w-full max-w-sm items-center gap-1.5">
      <TextFieldLabel for={name}>{schema.description ?? name}</TextFieldLabel>
      <TextFieldInput
        type="text"
        id={name}
        name={name}
        value={value}
        placeholder={schema.default}
        {...props}
      />
    </TextField>
  );
}
