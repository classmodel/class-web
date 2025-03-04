import type { JSONSchemaType } from "ajv/dist/2020";
import {
  type Component,
  type JSX,
  type ParentComponent,
  createUniqueId,
} from "solid-js";
import { Form } from "./Form";
import { Button } from "./components/ui/button";

// TODO use storybookjs instead of App.tsx, but
// https://github.com/storybookjs/sandboxes/blob/main/solid-vite/default-ts/after-storybook
// does not work with node22

function Kitchensink() {
  type Config = {
    s1: string;
    so1?: string;
    i1: number;
    n1: number;
    nn1: number[];
  } & ({ sw_ml: true; h_0: number } | { sw_ml?: false });

  const defaults: Config = {
    s1: "string1",
    i1: 60,
    n1: 4.2,
    nn1: [1, 2, 3],
    sw_ml: true,
    h_0: 1.2,
  };

  const values: Config = {
    s1: "string1",
    i1: 42,
    n1: 3.14,
    nn1: [4, 5, 6],
    sw_ml: false,
  };

  const schema = {
    type: "object",
    properties: {
      s1: { type: "string", default: "string1" },
      so1: { type: "string" },
      i1: { type: "integer", minimum: 10 },
      n1: { type: "number", "ui:group": "g1" },
      nn1: { type: "array", items: { type: "number" } },
      sw_ml: { type: "boolean", "ui:group": "g2" },
    },
    required: ["s1", "i1", "n1", "nn1"],
    allOf: [
      {
        if: {
          properties: {
            sw_ml: {
              const: true,
            },
          },
        },
        // biome-ignore lint/suspicious/noThenProperty: <explanation>
        then: {
          properties: {
            h_0: {
              type: "number",
              "ui:group": "g2",
            },
          },
          required: ["h_0"],
        },
      },
    ],
  } as unknown as JSONSchemaType<Config>;

  return (
    <Form
      schema={schema}
      defaults={defaults}
      onSubmit={(data) => console.log(data)}
      values={values}
    >
      <Button type="submit">Submit</Button>
      <Button variant="secondary" type="reset">
        Reset
      </Button>
    </Form>
  );
}

function Minimal() {
  const values = {
    s1: "string1",
  };
  const schema: JSONSchemaType<{ s1: string }> = {
    type: "object",
    properties: {
      s1: { type: "string" },
    },
    required: ["s1"],
  };
  return (
    <Form
      schema={schema}
      onSubmit={(data) => console.log(data)}
      values={values}
    >
      <Button type="submit">Submit</Button>
    </Form>
  );
}

function ExternalSubmit() {
  const values = {
    s1: "string1",
  };
  const schema: JSONSchemaType<{ s1: string }> = {
    type: "object",
    properties: {
      s1: { type: "string" },
    },
    required: ["s1"],
  };
  const id = createUniqueId();
  return (
    <div>
      <Form
        id={id}
        schema={schema}
        onSubmit={(data) => console.log(data)}
        values={values}
      />
      <Button type="submit" form={id}>
        Submit outside form element
      </Button>
    </div>
  );
}

function Groups() {
  const values = {
    s1: "string1",
    s2: "string2",
    s3: "string3",
    s4: "string4",
    s5: "string5",
  };
  const schema: JSONSchemaType<{
    s1: string;
    s2: string;
    s3: string;
    s4: string;
    s5: string;
  }> = {
    type: "object",
    properties: {
      s1: { type: "string" },
      s2: { type: "string", "ui:group": "g1" },
      s3: { type: "string", "ui:group": "g2" },
      s4: { type: "string", "ui:group": "g2" },
      s5: { type: "string", "ui:group": "g3" },
    },
    required: ["s1", "s2", "s3", "s4", "s5"],
  };
  return (
    <Form
      schema={schema}
      onSubmit={(data) => console.log(data)}
      values={values}
    >
      <p>
        s1 is ungrouped, s2 is in g1 group, s3 and s4 are in g2 group, s5 is in
        group g3.
      </p>
      <Button type="submit">Submit</Button>
    </Form>
  );
}

function GroupError() {
  const values = {
    s1: "string1",
  };
  const schema: JSONSchemaType<{
    s1: string;
  }> = {
    type: "object",
    properties: {
      s1: { type: "string", "ui:group": "g1", minLength: 10 },
    },
    required: ["s1"],
  };
  return (
    <Form
      schema={schema}
      onSubmit={(data) => console.log(data)}
      values={values}
    >
      <p>Press submit to see error on group field and group header</p>
      <Button type="submit">Submit</Button>
    </Form>
  );
}

function GroupBooleanToggle() {
  const values = {
    t1: true,
    s1: "string1",
  };
  type Config = {
    t1: boolean;
  } & ({ t1: true; s1: string } | { t1?: false });
  const schema = {
    type: "object",
    properties: {
      t1: { type: "boolean", "ui:group": "g1" },
    },
    allOf: [
      {
        if: {
          properties: {
            t1: {
              const: true,
            },
          },
        },
        // biome-ignore lint/suspicious/noThenProperty: <explanation>
        then: {
          properties: {
            s1: { type: "string", "ui:group": "g1" },
          },
          required: ["s1"],
        },
      },
    ],
  } as unknown as JSONSchemaType<Config>;
  return (
    <Form
      schema={schema}
      onSubmit={(data) => console.log(data)}
      values={values}
    >
      <p>If t1 is checked then s1 is required.</p>
      <Button type="submit">Submit</Button>
    </Form>
  );
}

function GroupEnumToggle() {
  type Config = {
    t1: "a" | "b";
  } & (
    | { t1: "a"; s1: string; s2: string }
    | { t1: "b"; s1: string; s3: string }
  );
  const values: Config = {
    t1: "a",
    s1: "string1",
    s2: "string2",
  };
  const schema = {
    type: "object",
    properties: {
      t1: { type: "string", enum: ["a", "b"], "ui:group": "g1", default: "a" },
    },
    allOf: [
      {
        if: {
          properties: {
            t1: {
              const: "a",
            },
          },
        },
        // biome-ignore lint/suspicious/noThenProperty: <explanation>
        then: {
          properties: {
            s1: { type: "string", "ui:group": "g1" }, // prop which is in both branches
            s2: { type: "string", "ui:group": "g1" },
          },
          required: ["s1", "s2"],
        },
      },
      {
        if: {
          properties: {
            t1: {
              const: "b",
            },
          },
        },
        // biome-ignore lint/suspicious/noThenProperty: <explanation>
        then: {
          properties: {
            s1: { type: "string", "ui:group": "g1" },
            s3: { type: "string", "ui:group": "g1" },
          },
          required: ["s1", "s3"],
        },
      },
    ],
  } as unknown as JSONSchemaType<Config>;
  return (
    <Form
      schema={schema}
      onSubmit={(data) => console.log(data)}
      values={values}
    >
      <p>If t1='a' is selected then s1 and s2 are required.</p>
      <p>If t1='b' is selected then s1 and s3 are required.</p>
      <Button type="submit">Submit</Button>
    </Form>
  );
}

function StringEnumExample() {
  const values = {
    s1: "a",
  };
  const schema: JSONSchemaType<typeof values> = {
    type: "object",
    properties: {
      s1: { type: "string", enum: ["a", "b", "c"] },
    },
    required: ["s1"],
  };
  return (
    <Form
      schema={schema}
      onSubmit={(data) => console.log(data)}
      values={values}
    >
      <Button type="submit">Submit</Button>
    </Form>
  );
}

function NumberExample() {
  const values = {
    n1: 3.14,
  };
  const schema: JSONSchemaType<typeof values> = {
    type: "object",
    properties: {
      n1: { type: "number" },
    },
    required: ["n1"],
  };
  return (
    <Form
      schema={schema}
      onSubmit={(data) => console.log(data)}
      values={values}
    >
      <Button type="submit">Submit</Button>
      <p>on submit returns number `3.14` if unchanged.</p>
    </Form>
  );
}

function IntegerExample() {
  const values = {
    n1: 42,
  };
  const schema: JSONSchemaType<typeof values> = {
    type: "object",
    properties: {
      n1: { type: "integer" },
    },
    required: ["n1"],
  };
  return (
    <Form
      schema={schema}
      onSubmit={(data) => console.log(data)}
      values={values}
    >
      <Button type="submit">Submit</Button>
      <p>on submit returns integer `42` if unchanged.</p>
    </Form>
  );
}

function BooleanExample() {
  const values = {
    b1: true,
  };
  const schema: JSONSchemaType<typeof values> = {
    type: "object",
    properties: {
      b1: { type: "boolean" },
    },
    required: ["b1"],
  };
  return (
    <Form
      schema={schema}
      onSubmit={(data) => console.log(data)}
      values={values}
    >
      <Button type="submit">Submit</Button>
      <p>on submit returns boolean `true` if unchanged.</p>
    </Form>
  );
}

function ArrayOfNumberExample() {
  const values = {
    nn1: [1, 2, 3],
  };
  const schema: JSONSchemaType<typeof values> = {
    type: "object",
    properties: {
      nn1: { type: "array", items: { type: "number" } },
    },
    required: ["nn1"],
  };
  return (
    <Form
      schema={schema}
      onSubmit={(data) => console.log(data)}
      values={values}
    >
      <Button type="submit">Submit</Button>
      <p>
        on submit returns array with `1`, `2` and `3` if unchanged. When
        unparseable should then shows error.
      </p>
    </Form>
  );
}

const CustomLabel: Component<JSX.LabelHTMLAttributes<HTMLLabelElement>> = (
  props,
) => {
  return (
    <label class="m-2 bg-blue-500 p-2" for={props.for}>
      {props.children}
    </label>
  );
};

function CustomUiComponent() {
  const values = {
    s1: "string1",
  };
  const schema: JSONSchemaType<{ s1: string }> = {
    type: "object",
    properties: {
      s1: { type: "string" },
    },
    required: ["s1"],
  };
  return (
    <Form
      schema={schema}
      onSubmit={(data) => console.log(data)}
      values={values}
      uiComponents={{ TextFieldLabel: CustomLabel }}
    >
      <Button type="submit">Submit</Button>
      <p>TextFieldLabel is a custom component with blue background.</p>
    </Form>
  );
}

const ExampleWrapper: ParentComponent<{ legend: string }> = (props) => {
  return (
    <fieldset class="rounded-md border border-gray-300 p-4">
      <legend class="font-semibold text-2xl">{props.legend}</legend>
      {props.children}
    </fieldset>
  );
};

const App: Component = () => {
  // TODO render this on GitHub pages, will need to
  return (
    <div class="flex-row gap-4 p-12">
      <p>
        Example usage of `@classmodel/form` package. Code at{" "}
        <a
          class="underline"
          href="https://github.com/classmodel/class-web/blob/main/packages/form/src/App.tsx"
        >
          src/App.tsx
        </a>
        . Use devtools console to see submitted result.
      </p>
      <ExampleWrapper legend="Minimal">
        <Minimal />
      </ExampleWrapper>
      <ExampleWrapper legend="External submit">
        <ExternalSubmit />
      </ExampleWrapper>
      <ExampleWrapper legend="Groups">
        <Groups />
      </ExampleWrapper>
      <ExampleWrapper legend="Group error">
        <GroupError />
      </ExampleWrapper>
      <ExampleWrapper legend="Group boolean toggle">
        <GroupBooleanToggle />
      </ExampleWrapper>
      <ExampleWrapper legend="Group enum toggle">
        <GroupEnumToggle />
      </ExampleWrapper>
      <ExampleWrapper legend="String as radio group">
        <StringEnumExample />
      </ExampleWrapper>
      <ExampleWrapper legend="Number">
        <NumberExample />
      </ExampleWrapper>
      <ExampleWrapper legend="Integer">
        <IntegerExample />
      </ExampleWrapper>
      <ExampleWrapper legend="Boolean as checkbox">
        <BooleanExample />
      </ExampleWrapper>
      <ExampleWrapper legend="Array of number">
        <ArrayOfNumberExample />
      </ExampleWrapper>
      <ExampleWrapper legend="Custom UI component">
        <CustomUiComponent />
      </ExampleWrapper>
      <ExampleWrapper legend="Kitchen sink">
        <Kitchensink />
      </ExampleWrapper>
    </div>
  );
};

export default App;
