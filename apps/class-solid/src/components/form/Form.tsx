import type { DefinedError } from "ajv/dist/2020";
import type { JSONSchemaType } from "ajv/dist/2020.js";
import {
  type Accessor,
  type Component,
  For,
  type JSX,
  Match,
  type ParentComponent,
  Show,
  Switch,
  createContext,
  createMemo,
  createSignal,
  createUniqueId,
  useContext,
} from "solid-js";
import { createStore, unwrap } from "solid-js/store";

// TODO move this file and imports below to new @classmodel/form package

// Modules that are part of @classmodel/form package
import {
  type SchemaOfProperty,
  type Toggle,
  buildValidate,
  overwriteDefaultsInJsonSchema,
  schema2groups,
} from "./utils";

// UI components, that should be part of @classmodel/form package, but overwritable
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel,
  TextFieldTextArea,
} from "../ui/text-field";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type GenericConfigValue = string | number | boolean | number[];
type GenericConfig = Record<string, GenericConfigValue>;

interface FormStore {
  readonly values: GenericConfig;
  setProperty: (key: string, value: GenericConfigValue) => void;
  setErrors: (errors: DefinedError[]) => void;
  readonly errors: DefinedError[];
  readonly schema: JSONSchemaType<GenericConfig>;
}

const FormContext = createContext<FormStore>();

function useFormContext() {
  const value = useContext(FormContext);
  if (!value) {
    throw new Error("Form context provider is missing");
  }
  return value;
}

function createFormStore(
  schema: Accessor<JSONSchemaType<GenericConfig>>,
  initialValues: GenericConfig,
) {
  const [store, setStore] = createStore<{
    values: GenericConfig;
    errors: DefinedError[];
    schema: JSONSchemaType<GenericConfig>;
  }>({
    // Copy props.values as initial form values
    values: structuredClone(unwrap(initialValues)),
    errors: [],
    schema: schema(),
  });
  const formStore: FormStore = {
    get values() {
      return store.values;
    },
    setProperty: (key: string, value: GenericConfigValue) => {
      setStore("values", key, value);
    },
    setErrors: (errors: DefinedError[]) => {
      setStore("errors", errors);
    },
    get errors() {
      return store.errors;
    },
    // Full schema
    get schema() {
      return store.schema;
    },
  };
  return formStore;
}

interface Props<C extends GenericConfig> {
  id?: string;
  onSubmit: (values: C) => void;
  values: C;
  defaults: C;
  schema: JSONSchemaType<C>;
  children?: JSX.Element;
}

/*
 * TODO add validation mode, now always onSubmit
 * When to validate the form.
 * - onSubmit: validate when form is submitted
 * - onChange: validate when input changes and on submit
 * - onBlur: validate when input loses focus and on submit
 */

export function Form<C extends GenericConfig>(props: Props<C>) {
  const schemaWithDefaults = createMemo(() =>
    // TODO do not cast, but without it ajv and solidjs complain
    overwriteDefaultsInJsonSchema(
      unwrap(props.schema as JSONSchemaType<GenericConfig>),
      unwrap(props.defaults),
    ),
  );
  const validate = createMemo(() => buildValidate(schemaWithDefaults()));
  const store = createFormStore(schemaWithDefaults, props.values);

  const groups = createMemo(() => schema2groups(props.schema));

  return (
    <form
      id={props.id}
      // Disable native form validation, we use ajv for validation
      noValidate={true}
      onSubmit={(e) => {
        e.preventDefault();

        const data = unwrap(store.values);
        // Use ajv to coerce strings to numbers and fill in defaults
        const valid = validate()(data);
        if (!valid) {
          const errors = validate().errors as DefinedError[];
          store.setErrors(errors);
          return;
        }
        if (store.errors.length > 0) {
          // Clear errors if there where any before
          store.setErrors([]);
        }

        props.onSubmit(data as unknown as C);
      }}
    >
      <FormContext.Provider value={store}>
        <For each={groups().groupless}>
          {(item) => (
            <PropField name={item} schema={store.schema.properties[item]} />
          )}
        </For>
        <Accordion multiple={false} collapsible>
          <For each={Array.from(groups().untoggelable.entries())}>
            {(item) => <GroupField name={item[0]} members={item[1]} />}
          </For>
          <For each={Array.from(groups().toggleable.entries())}>
            {(item) => <ToggleableGroupField name={item[0]} toggle={item[1]} />}
          </For>
        </Accordion>
        {props.children}
      </FormContext.Provider>
    </form>
  );
}

interface GroupFieldProps {
  name: string;
  members: string[];
}

const GroupField: Component<GroupFieldProps> = (props) => {
  const schema = useFormContext().schema;

  return (
    <AccordionWrapper name={props.name} members={props.members}>
      <For each={props.members}>
        {(item) => <PropField name={item} schema={schema.properties[item]} />}
      </For>
    </AccordionWrapper>
  );
};

interface ToggleableGroupFieldProps {
  name: string;
  toggle: Toggle;
}

const ToggleableGroupField: Component<ToggleableGroupFieldProps> = (props) => {
  const members = createMemo(() => Object.keys(props.toggle.members));
  return (
    <AccordionWrapper name={props.name} members={members()}>
      <BooleanToggleGroupField name={props.toggle.key} toggle={props.toggle} />
      {/* TODO add EnumToggleGroupField */}
    </AccordionWrapper>
  );
};

const BooleanToggleGroupField: Component<ToggleableGroupFieldProps> = (
  props,
) => {
  const id = createUniqueId();
  const schema = useFormContext().schema;
  const toggleSchema = createMemo(
    () => schema.properties[props.toggle.key] as SchemaOfProperty,
  );
  const label = createLabel(props.name, toggleSchema());
  const checked = createMemo(
    () => useFormContext().values[props.toggle.key] as boolean,
  );
  const onChange = useFormContext().setProperty;
  return (
    <>
      <div class="flex items-center space-x-2">
        <Checkbox
          id={id}
          checked={checked()}
          onChange={(checked) => {
            onChange(props.toggle.key, checked);
          }}
        />
        <Label for={id}>{label()}</Label>
        <DescriptionTooltip schema={toggleSchema()} />
      </div>
      <For each={Object.entries(props.toggle.members)}>
        {(item) => (
          <PropField
            name={item[0]}
            schema={item[1]}
            // TODO when disabled then besides the input, the label and unit should also be greyed out
            disabled={!checked()}
          />
        )}
      </For>
    </>
  );
};

const AccordionWrapper: ParentComponent<{ name: string; members: string[] }> = (
  props,
) => {
  const memberErrors = createErrors(...props.members);
  return (
    <AccordionItem value={props.name}>
      <AccordionTrigger>
        <div class="flex w-full justify-between pe-1">
          {props.name}
          <Show when={memberErrors().length > 0}>
            <Badge variant="error">{memberErrors().length} error(s)</Badge>
          </Show>
        </div>
      </AccordionTrigger>
      <AccordionContent>{props.children}</AccordionContent>
    </AccordionItem>
  );
};

interface FieldProps {
  name: string;
  schema: SchemaOfProperty;
  disabled?: boolean;
}

const PropField: Component<FieldProps> = (props) => {
  return (
    <Switch fallback={<p>Unknown type</p>}>
      <Match when={props.schema.type === "number"}>
        <InputNumber
          name={props.name}
          schema={props.schema}
          disabled={props.disabled}
        />
      </Match>
      <Match when={props.schema.type === "integer"}>
        <InputInteger
          name={props.name}
          schema={props.schema}
          disabled={props.disabled}
        />
      </Match>
      <Match when={props.schema.type === "string"}>
        <Show
          when={props.schema["ui:widget"] === "textarea"}
          fallback={
            <InputText
              name={props.name}
              schema={props.schema}
              disabled={props.disabled}
            />
          }
        >
          <TextAreaWidget
            name={props.name}
            schema={props.schema}
            disabled={props.disabled}
          />
        </Show>
      </Match>
      <Match
        when={
          props.schema.type === "array" && props.schema.items?.type === "number"
        }
      >
        <InputNumbers
          name={props.name}
          schema={props.schema}
          disabled={props.disabled}
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
        <TooltipTrigger
          as={Button<"button">}
          variant="ghost"
          class="ml-2 size-8 rounded-full"
        >
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

function createErrors(...names: string[]) {
  return createMemo(() =>
    useFormContext().errors.filter((e) =>
      names.some((name) => e.instancePath === `/${name}`),
    ),
  );
}

function sameArray<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function createInputClass(name: string, placeholder: unknown) {
  return createMemo(() => {
    const value = useFormContext().values[name];
    if (
      value === placeholder ||
      (Array.isArray(value) &&
        Array.isArray(placeholder) &&
        sameArray(value, placeholder))
    ) {
      // make value look like placeholder
      // aka value is rendered but greyed out
      // TODO make behave like actual placeholder
      return "text-muted-foreground";
    }
    return "";
  });
}

const TextFieldWrapper: ParentComponent<FieldProps> = (props) => {
  const value = createMemo(() => {
    const v = useFormContext().values[props.name];
    return v as string;
  });
  const onChange = useFormContext().setProperty;
  return (
    <TextFieldWrapperControlled
      value={value()}
      onChange={(newValue) => onChange(props.name, newValue)}
      {...props}
    >
      {props.children}
    </TextFieldWrapperControlled>
  );
};

interface ValueGetSet {
  value: string;
  onChange: (value: string) => void;
  /**
   * Error message if value is invalid according to non-schema validation
   */
  // TODO if error is truthy also update AccordionTrigger to havea an error badge
  error?: string;
}

const TextFieldWrapperControlled: ParentComponent<FieldProps & ValueGetSet> = (
  props,
) => {
  const label = createLabel(props.name, props.schema);
  const errors = createErrors(props.name);
  return (
    <TextField
      name={props.name}
      value={props.value}
      onChange={props.onChange}
      validationState={errors().length > 0 || props.error ? "invalid" : "valid"}
      disabled={props.disabled}
      class="me-2 py-1"
    >
      <div class="flex items-center gap-2">
        <div class="basis-1/2">
          <TextFieldLabel>{label()}</TextFieldLabel>
          <DescriptionTooltip schema={props.schema} />
        </div>
        <Show
          when={props.schema.unit}
          fallback={<div class="basis-1/2">{props.children}</div>}
        >
          {/* TODO when field is invalid then red border is behind unit */}
          <div class="relative block basis-1/2">
            {props.children}
            <span class="absolute inset-y-0 right-0 flex items-center bg-muted px-2">
              {props.schema.unit}
            </span>
          </div>
        </Show>
      </div>
      <TextFieldErrorMessage class="pt-2">
        <For each={errors()}>{(error) => <p>{error.message}</p>}</For>
        <Show when={props.error}>
          <p>{props.error}</p>
        </Show>
      </TextFieldErrorMessage>
    </TextField>
  );
};

const InputText: Component<FieldProps> = (props) => {
  const className = createInputClass(props.name, props.schema.default);
  return (
    <TextFieldWrapper
      name={props.name}
      schema={props.schema}
      disabled={props.disabled}
    >
      <TextFieldInput
        placeholder={props.schema.default}
        type="text"
        class={className()}
      />
    </TextFieldWrapper>
  );
};

const TextAreaWidget: Component<FieldProps> = (props) => {
  const className = createInputClass(props.name, props.schema.default);
  return (
    <TextFieldWrapper
      name={props.name}
      schema={props.schema}
      disabled={props.disabled}
    >
      <TextFieldTextArea
        placeholder={props.schema.default}
        class={className()}
      />
    </TextFieldWrapper>
  );
};

const InputInteger: Component<FieldProps> = (props) => {
  const className = createInputClass(props.name, props.schema.default);
  return (
    <TextFieldWrapper
      name={props.name}
      schema={props.schema}
      disabled={props.disabled}
    >
      <TextFieldInput
        placeholder={props.schema.default}
        type="text"
        inputMode="numeric"
        class={className()}
      />
    </TextFieldWrapper>
  );
};

const InputNumber: Component<FieldProps> = (props) => {
  const className = createInputClass(props.name, props.schema.default);
  return (
    <TextFieldWrapper
      name={props.name}
      schema={props.schema}
      disabled={props.disabled}
    >
      <TextFieldInput
        placeholder={props.schema.default}
        type="text"
        inputMode="decimal"
        class={className()}
      />
    </TextFieldWrapper>
  );
};

function string2numbers(value: string): number[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .map(Number);
}

function numbers2string(value: number[]): string {
  return value.join(", ");
}

const InputNumbers: Component<FieldProps> = (props) => {
  const className = createInputClass(props.name, props.schema.default);
  const raw = useFormContext().values[props.name] as unknown as number[];
  // initial value for stringVal is computed on mount
  // TODO should it be re-computed on value change?
  const [stringVal, setStringVal] = createSignal(numbers2string(raw));
  const [error, setError] = createSignal("");
  const setProperty = useFormContext().setProperty;

  function onChange(value: string) {
    setStringVal(value);
    const numbers = string2numbers(value);
    if (numbers.some(Number.isNaN)) {
      setError(
        "Invalid format. Use comma separated numbers. For example: 1.1,2.2",
      );
    } else {
      // TODO dont cast
      // add number[] type to second arg of setProperty
      setError("");
      // only update store when string is valid
      setProperty(props.name, numbers);
    }
  }

  return (
    <TextFieldWrapperControlled
      name={props.name}
      schema={props.schema}
      disabled={props.disabled}
      value={stringVal()}
      onChange={onChange}
      error={error()}
    >
      <TextFieldInput
        placeholder={numbers2string(props.schema.default)}
        type="text"
        class={className()}
      />
    </TextFieldWrapperControlled>
  );
};
