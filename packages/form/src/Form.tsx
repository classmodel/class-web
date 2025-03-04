import type { DefinedError, JSONSchemaType } from "ajv/dist/2020";
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

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/ui/accordion";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Checkbox } from "./components/ui/checkbox";
import { Label } from "./components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupItemLabel,
} from "./components/ui/radio-group";
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel,
  TextFieldTextArea,
} from "./components/ui/text-field";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./components/ui/tooltip";
import {
  type Base,
  type Choices,
  type Group,
  type Item,
  type SchemaOfProperty,
  buildValidate,
  isBase,
  isBooleanChoices,
  isGroup,
  isStringChoices,
  keysOfGroupMembers,
  overwriteDefaultsInJsonSchema,
  schema2tree,
} from "./utils";

const MyCheckbox: Component<{
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = Checkbox;

const DEFAULT_UI_COMPONENTS = {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Checkbox: MyCheckbox,
  Label,
  TextField,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel,
  TextFieldTextArea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  RadioGroup,
  RadioGroupItem,
  RadioGroupItemLabel,
} as const;

// Inside Form component we use a generic object
type GenericConfigValue = string | number | boolean | number[];
type GenericConfig = Record<string, GenericConfigValue>;

interface FormStore {
  readonly values: GenericConfig;
  setProperty: (key: string, value: GenericConfigValue) => void;
  setErrors: (errors: DefinedError[]) => void;
  reset: () => void;
  readonly errors: DefinedError[];
  readonly schema: JSONSchemaType<GenericConfig>;
  readonly uiComponents: typeof DEFAULT_UI_COMPONENTS;
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
  uiComponents: typeof DEFAULT_UI_COMPONENTS,
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
    reset: () => {
      setStore("values", structuredClone(initialValues));
      setStore("errors", []);
    },
    get errors() {
      return store.errors;
    },
    // Full schema
    get schema() {
      return store.schema;
    },
    uiComponents,
  };
  return formStore;
}

export interface Props<C extends GenericConfig> {
  id?: string;
  onSubmit: (values: C) => void;
  values: C;
  defaults?: C;
  schema: JSONSchemaType<C>;
  children?: JSX.Element;
  uiComponents?: Partial<typeof DEFAULT_UI_COMPONENTS>;
}

/*
 * TODO add validation mode, now always onSubmit
 * When to validate the form.
 * - onSubmit: validate when form is submitted
 * - onChange: validate when input changes and on submit
 * - onBlur: validate when input loses focus and on submit
 */

export function Form<C extends GenericConfig>(props: Props<C>) {
  const uiComponents = props.uiComponents
    ? { ...DEFAULT_UI_COMPONENTS, ...props.uiComponents }
    : DEFAULT_UI_COMPONENTS;
  const schemaWithDefaults = createMemo(() => {
    // TODO do not cast, but without it ajv and solidjs complain
    const uschema = unwrap(props.schema as JSONSchemaType<GenericConfig>);
    if (!props.defaults) {
      return uschema;
    }
    return overwriteDefaultsInJsonSchema(uschema, unwrap(props.defaults));
  });
  const validate = createMemo(() => buildValidate(schemaWithDefaults()));
  const store = createFormStore(schemaWithDefaults, props.values, uiComponents);

  const tree = createMemo(() => schema2tree(props.schema));

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
      onReset={(e) => {
        e.preventDefault();
        store.reset();
      }}
    >
      <FormContext.Provider value={store}>
        <store.uiComponents.Accordion multiple={false} collapsible>
          {/* not all children of accordion are AccordionItem, but works and allows for mixing types */}
          <For each={tree()}>{(item) => <ItemField item={item} />}</For>
        </store.uiComponents.Accordion>
        {props.children}
      </FormContext.Provider>
    </form>
  );
}

interface GroupFieldProps {
  item: Group;
}

const GroupField: Component<GroupFieldProps> = (props) => {
  return (
    <AccordionWrapper item={props.item}>
      <For each={props.item.members}>{(item) => <ItemField item={item} />}</For>
    </AccordionWrapper>
  );
};

const AccordionWrapper: ParentComponent<GroupFieldProps> = (props) => {
  const memberErrors = createErrors(props.item);
  const UiComponents = useFormContext().uiComponents;
  return (
    <UiComponents.AccordionItem value={props.item.group}>
      <UiComponents.AccordionTrigger aria-label={props.item.group}>
        <div class="flex w-full justify-between pe-1">
          {props.item.group}
          <Show when={memberErrors().length > 0}>
            <Badge variant="error">{memberErrors().length} error(s)</Badge>
          </Show>
        </div>
      </UiComponents.AccordionTrigger>
      <UiComponents.AccordionContent>
        {props.children}
      </UiComponents.AccordionContent>
    </UiComponents.AccordionItem>
  );
};

const ItemField: Component<{ item: Item; disabled?: boolean }> = (props) => {
  return (
    <Switch fallback={<p>Unknown type</p>}>
      <Match when={isBooleanChoices(props.item)}>
        {/* type narrowing does propagate to children use cast */}
        <BooleanChoicesField item={props.item as Choices} />
      </Match>
      <Match when={isStringChoices(props.item)}>
        <StringChoicesField item={props.item as Choices} />
      </Match>
      <Match when={isGroup(props.item)}>
        <GroupField item={props.item as Group} />
      </Match>
      <Match when={isBase(props.item)}>
        <PropField item={props.item as Base} disabled={props.disabled} />
      </Match>
    </Switch>
  );
};

interface PropFieldProps {
  item: Base;
  disabled?: boolean;
}

const PropField: Component<PropFieldProps> = (props) => {
  return (
    <Switch fallback={<p>Unknown type</p>}>
      <Match when={props.item.schema.type === "number"}>
        <InputNumber item={props.item} disabled={props.disabled} />
      </Match>
      <Match when={props.item.schema.type === "integer"}>
        <InputInteger item={props.item} disabled={props.disabled} />
      </Match>
      <Match when={props.item.schema.type === "string"}>
        <Switch>
          {/* TODO when enum.length > 10 then use select/combobox */}
          <Match when={props.item.schema.enum}>
            {/* TODO allow user to overwrite used input with ui:widget */}
            <InputTextEnum item={props.item} disabled={props.disabled} />
          </Match>
          <Match when={props.item.schema["ui:widget"] === "textarea"}>
            <TextAreaWidget item={props.item} disabled={props.disabled} />
          </Match>
          <Match when={props.item.schema.type === "string"}>
            <InputText item={props.item} disabled={props.disabled} />
          </Match>
        </Switch>
      </Match>
      <Match when={props.item.schema.type === "boolean"}>
        <InputBoolean item={props.item} disabled={props.disabled} />
      </Match>
      <Match
        when={
          props.item.schema.type === "array" &&
          props.item.schema.items?.type === "number"
        }
      >
        <InputNumbers item={props.item} disabled={props.disabled} />
      </Match>
    </Switch>
  );
};

function createLabel(item: Base) {
  return createMemo(() => {
    if (item.schema.symbol) {
      return item.schema.symbol;
    }
    if (item.schema.title) {
      return item.schema.title;
    }
    return item.key;
  });
}

const DescriptionTooltip: Component<{ schema: SchemaOfProperty }> = (props) => {
  const UiComponents = useFormContext().uiComponents;
  return (
    <Show
      when={
        (props.schema.symbol && !props.schema.title) || props.schema.description
      }
    >
      <UiComponents.Tooltip>
        <UiComponents.TooltipTrigger
          as={Button<"button">}
          variant="ghost"
          class="ml-2 size-8 rounded-full"
        >
          ?
        </UiComponents.TooltipTrigger>
        <UiComponents.TooltipContent>
          <p>{!props.schema.symbol || props.schema.title}</p>
          <p>{props.schema.description}</p>
        </UiComponents.TooltipContent>
      </UiComponents.Tooltip>
    </Show>
  );
};

function createErrors(group: Group): () => DefinedError[] {
  return createMemo(() =>
    useFormContext().errors.filter((e) => {
      const keysOfGroup = keysOfGroupMembers(group);
      return keysOfGroup.has(e.instancePath.replace("/", ""));
    }),
  );
}

function createError(key: string): () => DefinedError[] {
  return createMemo(() =>
    useFormContext().errors.filter((e) => e.instancePath === `/${key}`),
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

const TextFieldWrapper: ParentComponent<PropFieldProps> = (props) => {
  const value = createMemo(() => {
    const v = useFormContext().values[props.item.key];
    return v as string;
  });
  const onChange = useFormContext().setProperty;
  return (
    <TextFieldWrapperControlled
      value={value()}
      onChange={(newValue) => onChange(props.item.key, newValue)}
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

const TextFieldWrapperControlled: ParentComponent<
  PropFieldProps & ValueGetSet
> = (props) => {
  const label = createLabel(props.item);
  const errors = createError(props.item.key);
  const UiComponents = useFormContext().uiComponents;
  return (
    <UiComponents.TextField
      name={props.item.key}
      value={props.value}
      onChange={props.onChange}
      validationState={errors().length > 0 || props.error ? "invalid" : "valid"}
      disabled={props.disabled}
      class="me-2 py-1"
    >
      <div class="flex items-center gap-2">
        <div class="basis-1/2">
          <UiComponents.TextFieldLabel>{label()}</UiComponents.TextFieldLabel>
          <DescriptionTooltip schema={props.item.schema} />
        </div>
        <Show
          when={props.item.schema.unit}
          fallback={<div class="basis-1/2">{props.children}</div>}
        >
          {/* TODO when field is invalid then red border is behind unit */}
          <div class="relative block basis-1/2">
            {props.children}
            <span class="absolute inset-y-0 right-0 flex items-center bg-muted px-2">
              {props.item.schema.unit}
            </span>
          </div>
        </Show>
      </div>
      <UiComponents.TextFieldErrorMessage class="pt-2">
        <For each={errors()}>{(error) => <p>{error.message}</p>}</For>
        <Show when={props.error}>
          <p>{props.error}</p>
        </Show>
      </UiComponents.TextFieldErrorMessage>
    </UiComponents.TextField>
  );
};

const InputText: Component<PropFieldProps> = (props) => {
  const className = createInputClass(props.item.key, props.item.schema.default);
  const UiComponents = useFormContext().uiComponents;
  return (
    <TextFieldWrapper item={props.item} disabled={props.disabled}>
      <UiComponents.TextFieldInput
        placeholder={props.item.schema.default}
        type="text"
        class={className()}
      />
    </TextFieldWrapper>
  );
};

const TextAreaWidget: Component<PropFieldProps> = (props) => {
  const className = createInputClass(props.item.key, props.item.schema.default);
  const UiComponents = useFormContext().uiComponents;
  return (
    <TextFieldWrapper item={props.item} disabled={props.disabled}>
      <UiComponents.TextFieldTextArea
        placeholder={props.item.schema.default}
        class={className()}
      />
    </TextFieldWrapper>
  );
};

const InputInteger: Component<PropFieldProps> = (props) => {
  const className = createInputClass(props.item.key, props.item.schema.default);
  const UiComponents = useFormContext().uiComponents;
  return (
    <TextFieldWrapper item={props.item} disabled={props.disabled}>
      <UiComponents.TextFieldInput
        placeholder={props.item.schema.default}
        type="text"
        inputMode="numeric"
        class={className()}
      />
    </TextFieldWrapper>
  );
};

const InputNumber: Component<PropFieldProps> = (props) => {
  const className = createInputClass(props.item.key, props.item.schema.default);
  const UiComponents = useFormContext().uiComponents;
  return (
    <TextFieldWrapper item={props.item} disabled={props.disabled}>
      <UiComponents.TextFieldInput
        placeholder={props.item.schema.default}
        type="text"
        inputMode="decimal"
        class={className()}
      />
    </TextFieldWrapper>
  );
};

const InputBoolean: Component<PropFieldProps> = (props) => {
  const UiComponents = useFormContext().uiComponents;
  const id = createUniqueId();
  const checked = createMemo(
    () => useFormContext().values[props.item.key] as boolean,
  );
  const label = createLabel(props.item);
  const setProperty = useFormContext().setProperty;
  function onChange(checked: boolean) {
    setProperty(props.item.key, checked);
    // TODO when unchecked the checkedMembers should be removed/reset
  }
  return (
    <div class="flex items-center space-x-2">
      <div class="basis-1/2">
        <UiComponents.Label for={id}>{label()}</UiComponents.Label>
        <DescriptionTooltip schema={props.item.schema} />
      </div>
      <UiComponents.Checkbox
        id={id}
        checked={checked()}
        onChange={onChange}
        disabled={props.disabled}
      />
    </div>
  );
};

const InputTextEnum: Component<PropFieldProps> = (props) => {
  const UiComponents = useFormContext().uiComponents;
  const label = createLabel(props.item);
  const id = createUniqueId();
  const value = createMemo(
    () => useFormContext().values[props.item.key] as string,
  );
  const setProperty = useFormContext().setProperty;
  function onChange(value: string) {
    setProperty(props.item.key, value);
    // TODO choice members that are not in the new choice should be removed/reset
  }

  return (
    <div class="flex items-center gap-2">
      <div class="basis-1/2">
        <UiComponents.Label for={id}>{label()}</UiComponents.Label>
        <DescriptionTooltip schema={props.item.schema} />
      </div>
      <UiComponents.RadioGroup
        id={id}
        value={value()}
        onChange={onChange}
        class="basis-1/2"
        disabled={props.disabled}
      >
        <For each={props.item.schema.enum}>
          {(choice) => (
            <UiComponents.RadioGroupItem value={choice}>
              <UiComponents.RadioGroupItemLabel>
                {choice}
              </UiComponents.RadioGroupItemLabel>
            </UiComponents.RadioGroupItem>
          )}
        </For>
      </UiComponents.RadioGroup>
    </div>
  );
};

function string2numbers(value: string): number[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .map(Number);
}

function numbers2string(value: number[] | undefined): string {
  if (!value) {
    return "";
  }
  return value.join(", ");
}

const InputNumbers: Component<PropFieldProps> = (props) => {
  const className = createInputClass(props.item.key, props.item.schema.default);
  const raw = useFormContext().values[props.item.key] as unknown as number[];
  // initial value for stringVal is computed on mount
  // TODO should it be re-computed on value change?
  const [stringVal, setStringVal] = createSignal(numbers2string(raw));
  const [error, setError] = createSignal("");
  const setProperty = useFormContext().setProperty;
  const UiComponents = useFormContext().uiComponents;

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
      setProperty(props.item.key, numbers);
    }
  }
  return (
    <TextFieldWrapperControlled
      item={props.item}
      disabled={props.disabled}
      value={stringVal()}
      onChange={onChange}
      error={error()}
    >
      <UiComponents.TextFieldInput
        placeholder={numbers2string(props.item.schema.default)}
        type="text"
        class={className()}
      />
    </TextFieldWrapperControlled>
  );
};

function BooleanChoicesField(props: { item: Choices }) {
  const checked = createMemo(
    () => useFormContext().values[props.item.key] as boolean,
  );
  const checkedMembers = createMemo(() => props.item.choices[0].members);
  return (
    <>
      <InputBoolean item={props.item} />
      <For each={checkedMembers()}>
        {(item) => <ItemField item={item} disabled={!checked()} />}
      </For>
    </>
  );
}

function StringChoicesField(props: { item: Choices }) {
  const value = createMemo(
    () => useFormContext().values[props.item.key] as string,
  );

  return (
    <>
      <InputTextEnum item={props.item} />
      <div>
        <For each={props.item.choices}>
          {(choice) => (
            // Only show fields of active choice
            <Show when={choice.value === value()}>
              <For each={choice.members}>
                {(item) => <ItemField item={item} />}
              </For>
            </Show>
          )}
        </For>
      </div>
    </>
  );
}
