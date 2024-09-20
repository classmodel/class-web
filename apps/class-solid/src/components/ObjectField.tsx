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
    <Field>
      {(field, props) => (
        <Switch fallback={<p>Unknown type</p>}>
          <Match when={schema.type === "object"}>
            <ObjectField {...props} name={name} schema={schema} value={value} />
          </Match>
          <Match when={schema.type === "number"}>
            <MyTextField {...props} name={name} schema={schema} value={value} />
          </Match>
          <Match when={schema.type === "string"}>
            <MyTextField {...props} name={name} schema={schema} value={value} />
          </Match>
        </Switch>
      )}
    </Field>
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
    // TODO: units after input field?
    <TextField class="flex items-center">
      <TextFieldLabel for={name} class="basis-3/4">
        {schema.description ?? name}
      </TextFieldLabel>
      <TextFieldInput
        type="text"
        id={name}
        name={name}
        value={value}
        placeholder={schema.default}
        {...props}
        class="basis-1/4"
      />
    </TextField>
  );
}
