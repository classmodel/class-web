import { For, Match, Switch } from "solid-js";
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from "~/components/ui/text-field";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

export function ObjectField({
  schema,
  name = "",
  value,
  Field,
  // biome-ignore lint/suspicious/noExplicitAny: json schema types are too complex
}: { schema: any; name?: string; value?: any; Field: any }) {
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
            Field={Field}
          />
        )}
      </For>
    );
  }

  return (
    <Switch>
      <Match when={isRoot}>
        <Accordion multiple={false} collapsible>
          <Children />
        </Accordion>
      </Match>
      <Match when={!isRoot}>
        <AccordionItem value={name}>
          <AccordionTrigger>{schema.description ?? name}</AccordionTrigger>
          <AccordionContent>{Children()}</AccordionContent>
        </AccordionItem>
      </Match>
    </Switch>
  );
}

function PropField({
  name,
  schema,
  value,
  Field,
  // biome-ignore lint/suspicious/noExplicitAny: json schema types are too complex
}: { name: string; schema: any; value: any; Field: any }) {
  return (
    <Switch fallback={<p>Unknown type</p>}>
      <Match when={schema.type === "object"}>
        <ObjectField name={name} schema={schema} value={value} Field={Field} />
      </Match>
      <Match when={schema.type === "number"}>
        <MyTextField name={name} schema={schema} Field={Field} />
      </Match>
      <Match when={schema.type === "string"}>
        <MyTextField name={name} schema={schema} Field={Field} />
      </Match>
    </Switch>
  );
}

export function MyTextField({
  name,
  schema,
  Field,
  // biome-ignore lint/suspicious/noExplicitAny: json schema types are too complex
}: { name: string; schema: any; [key: string]: any; Field: any }) {
  // TODO use generics to type more explicitly
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  function myfield(field: any, props: any) {
    return (
      <TextField class="flex items-center gap-2 py-1">
        <TextFieldLabel for={name} class="basis-1/2">
          {schema.description ?? name}
        </TextFieldLabel>
        <TextFieldInput
          type="text"
          id={props.name}
          name={props.name}
          value={field.value}
          placeholder={schema.default}
          {...props}
          class="basis-1/2"
        />
      </TextField>
    );
  }

  return (
    // TODO: display units after input field?
    // TODO: add more modularforms functionality
    <Field name={name}>{myfield}</Field>
  );
}
