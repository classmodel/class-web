import type { Config, JsonSchemaOfConfig } from "@classmodel/class/config";
import { overwriteDefaultsInJsonSchema } from "@classmodel/class/config_utils";
import {
  type Component,
  For,
  Match,
  type ParentComponent,
  Show,
  Switch,
  createMemo,
  createUniqueId,
} from "solid-js";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel,
} from "../ui/text-field";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { type SchemaOfProperty, type Toggle, schema2groups } from "./utils";

// TODO move Config to generic so Form can be used for any JSONSchemaType<T>
interface Props {
  id: string;
  onSubmit: (values: Config) => void;
  values: Config;
  defaults: Config;
  schema: JsonSchemaOfConfig;
}

export const Form: Component<Props> = (props) => {
  const schemaWithDefaults = createMemo(() =>
    overwriteDefaultsInJsonSchema(props.schema, props.defaults),
  );
  const groups = createMemo(() => schema2groups(props.schema));

  return (
    <form
      id={props.id}
      onSubmit={(e) => {
        e.preventDefault();

        // TODO validate with AJV
        // TODO set errors or clear errors
        props.onSubmit(props.values);
      }}
    >
      <For each={groups().groupless}>
        {(item) => (
          <PropField
            name={item}
            value={props.values[item as keyof Config]}
            schema={schemaWithDefaults().properties[item]}
          />
        )}
      </For>
      <Accordion multiple={false} collapsible>
        <For each={Array.from(groups().untoggelable.entries())}>
          {(item) => (
            <GroupField
              name={item[0]}
              members={item[1]}
              values={props.values}
              schema={schemaWithDefaults()}
            />
          )}
        </For>
        <For each={Array.from(groups().toggleable.entries())}>
          {(item) => (
            <ToggleableGroupField
              name={item[0]}
              toggle={item[1]}
              values={props.values}
              schema={schemaWithDefaults()}
            />
          )}
        </For>
      </Accordion>
    </form>
  );
};

interface GroupFieldProps {
  name: string;
  members: string[];
  values: Config;
  schema: JsonSchemaOfConfig;
}

const GroupField: Component<GroupFieldProps> = (props) => {
  return (
    <AccordionWrapper name={props.name}>
      <For each={props.members}>
        {(item) => (
          <PropField
            name={item}
            value={props.values[item as keyof Config]}
            schema={props.schema.properties[item]}
          />
        )}
      </For>
    </AccordionWrapper>
  );
};

interface ToggleableGroupFieldProps {
  name: string;
  toggle: Toggle;
  values: Config;
  schema: JsonSchemaOfConfig;
}

const ToggleableGroupField: Component<ToggleableGroupFieldProps> = (props) => {
  return (
    <AccordionWrapper name={props.name}>
      <BooleanToggleGroupField
        name={props.toggle.key}
        toggle={props.toggle}
        values={props.values}
        schema={props.schema}
      />
      {/* TODO add EnumToggleGroupField */}
    </AccordionWrapper>
  );
};

const BooleanToggleGroupField: Component<ToggleableGroupFieldProps> = (
  props,
) => {
  const id = createUniqueId();
  const toggleSchema = createMemo(
    () => props.schema.properties[props.toggle.key] as SchemaOfProperty,
  );
  const label = createLabel(props.name, toggleSchema());
  return (
    <>
      <div class="flex items-center space-x-2">
        <Checkbox id={id} />
        <Label for={id}>{label()}</Label>
        <DescriptionTooltip schema={toggleSchema()} />
      </div>
      {/* TODO when toggle is off then disable or hide members */}
      <For each={Object.entries(props.toggle.members)}>
        {(item) => (
          <PropField
            name={item[0]}
            value={props.values[item[0] as keyof Config]}
            schema={item[1]}
          />
        )}
      </For>
    </>
  );
};

const AccordionWrapper: ParentComponent<{ name: string }> = (props) => {
  return (
    // TODO on expand then toggle on
    <AccordionItem value={props.name}>
      <AccordionTrigger>
        {props.name}
        {/* TODO if collapsed show number of errors if there are any */}
      </AccordionTrigger>
      <AccordionContent>{props.children}</AccordionContent>
    </AccordionItem>
  );
};

interface FieldProps {
  name: string;
  // biome-ignore lint/suspicious/noExplicitAny: TODO get via context
  value: any;
  schema: SchemaOfProperty;
}

const PropField: Component<FieldProps> = (props) => {
  return (
    <Switch fallback={<p>Unknown type</p>}>
      <Match when={props.schema.type === "number"}>
        <InputNumber
          name={props.name}
          schema={props.schema}
          value={props.value}
        />
      </Match>
      <Match when={props.schema.type === "integer"}>
        <InputInteger
          name={props.name}
          schema={props.schema}
          value={props.value}
        />
      </Match>
      <Match when={props.schema.type === "string"}>
        <InputText
          name={props.name}
          schema={props.schema}
          value={props.value}
        />
      </Match>
      <Match
        when={
          props.schema.type === "array" && props.schema.items?.type === "number"
        }
      >
        <InputNumbers
          name={props.name}
          schema={props.schema}
          value={props.value}
        />
      </Match>
    </Switch>
  );
};

function createLabel(name: string, schema: SchemaOfProperty) {
  return createMemo(() => {
    if (schema.symbol) {
      return schema.symbol;
    }
    if (schema.title) {
      return schema.title;
    }
    return name;
  });
}

const DescriptionTooltip: Component<{ schema: SchemaOfProperty }> = (props) => {
  return (
    <Show
      when={
        (props.schema.symbol && !props.schema.title) || props.schema.description
      }
    >
      <Tooltip>
        <TooltipTrigger as={Button<"button">} variant="ghost" class="pb-1">
          ?
        </TooltipTrigger>
        <TooltipContent>
          <p>{!props.schema.symbol || props.schema.title}</p>
          <p>{props.schema.description}</p>
        </TooltipContent>
      </Tooltip>
    </Show>
  );
};

const TextFieldWrapper: ParentComponent<FieldProps> = (props) => {
  const label = createLabel(props.name, props.schema);
  return (
    // TODO do not set value when equal to default aka placeholder
    <TextField
      name={props.name}
      value={props.value}
      class="me-2 flex items-center gap-2 py-1"
    >
      <div class="basis-1/2">
        <TextFieldLabel>{label()}</TextFieldLabel>
        <DescriptionTooltip schema={props.schema} />
      </div>
      <Show
        when={props.schema.unit}
        fallback={<div class="basis-1/2">{props.children}</div>}
      >
        <div class="relative block basis-1/2">
          {props.children}
          <span class="absolute inset-y-0 right-0 flex items-center bg-muted px-2">
            {props.schema.unit}
          </span>
        </div>
      </Show>
      <TextFieldErrorMessage class="pt-2">
        {/* TODO get error from ajv via context */}
      </TextFieldErrorMessage>
    </TextField>
  );
};

const InputText: Component<FieldProps> = (props) => {
  return (
    <TextFieldWrapper
      name={props.name}
      value={props.value}
      schema={props.schema}
    >
      <TextFieldInput
        placeholder={props.schema.default}
        type="text"
        // TODO hookup value and onChange
      />
    </TextFieldWrapper>
  );
};

const InputInteger: Component<FieldProps> = (props) => {
  return (
    <TextFieldWrapper
      name={props.name}
      value={props.value}
      schema={props.schema}
    >
      <TextFieldInput
        placeholder={props.schema.default}
        type="text"
        // TODO hookup value and onChange with transform from number to string
      />
    </TextFieldWrapper>
  );
};

const InputNumber: Component<FieldProps> = (props) => {
  return (
    <TextFieldWrapper
      name={props.name}
      value={props.value}
      schema={props.schema}
    >
      <TextFieldInput
        placeholder={props.schema.default}
        type="text"
        // TODO hookup value and onChange with transform from number to string
      />
    </TextFieldWrapper>
  );
};

const InputNumbers: Component<FieldProps> = (props) => {
  return (
    <TextFieldWrapper
      name={props.name}
      value={props.value}
      schema={props.schema}
    >
      <TextFieldInput
        placeholder={props.schema.default}
        type="text"
        // TODO hookup value and onChange
        // with transform from number[] to comma seperated string
      />
    </TextFieldWrapper>
  );
};
