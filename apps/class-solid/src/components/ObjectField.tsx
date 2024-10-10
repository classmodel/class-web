import type { JSONSchemaType } from "ajv";
import { For, Match, Show, Switch, splitProps } from "solid-js";
import {
  TextField,
  TextFieldDescription,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel,
} from "~/components/ui/text-field";
import { MdiExclamationThick } from "./icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

export function ObjectField<S>({
  schema,
  name = "",
  value,
  Field,
  // biome-ignore lint/suspicious/noExplicitAny: json schema types are too complex
}: { schema: JSONSchemaType<S>; name?: string; value?: any; Field: any }) {
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
          <Field name={name}>
            {/* biome-ignore lint/suspicious/noExplicitAny: json schema types are too complex */}
            {(field: any) => (
              <AccordionTrigger>
                <span>{schema.title ?? name}</span>
                {/* TODO after child error has been fixed, this keeps showing, find way to clear it before submit */}
                <Show when={field.error}>
                  <span
                    class="ml-auto text-destructive"
                    title="Sub form has errors"
                  >
                    <MdiExclamationThick />
                  </span>
                </Show>
              </AccordionTrigger>
            )}
          </Field>
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
    const [rootProps, inputProps] = splitProps(
      props,
      ["name", "onChange", "required", "disabled"],
      ["placeholder", "ref", "onInput", "onBlur"],
    );
    return (
      <>
        <TextField
          class="p-1"
          {...rootProps}
          value={field.value}
          validationState={field.error ? "invalid" : "valid"}
        >
          <div class="flex items-center gap-2">
            <TextFieldLabel class="basis-1/2">
              {schema.title ?? name}
            </TextFieldLabel>
            <TextFieldInput
              {...inputProps}
              placeholder={schema.default}
              type="text"
              class="basis-1/2"
            />
          </div>
          <TextFieldErrorMessage class="pt-2">
            {field.error}
          </TextFieldErrorMessage>
          {schema.description && (
            <TextFieldDescription class="pt-2">
              {schema.description}
            </TextFieldDescription>
          )}
        </TextField>
      </>
    );
  }

  return <Field name={name}>{myfield}</Field>;
}
