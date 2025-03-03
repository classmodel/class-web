import type { JSONSchemaType } from "ajv/dist/2020";
import { type Component, type ParentComponent, createUniqueId } from "solid-js";
import { Form } from "./Form";
import { Button } from "./components/ui/button";

// TODO use App to show examples of Form component usage
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
  const defaults = {
    s1: "string0",
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
      defaults={defaults}
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
      ></Form>
      <Button type="submit" form={id}>
        Submit outside form element
      </Button>
    </div>
  );
}

function Group() {
  const values = {
    ungrouped: "string1",
    grouped: "string2",
  };
  const schema: JSONSchemaType<{
    ungrouped: string;
    grouped: string;
  }> = {
    type: "object",
    properties: {
      ungrouped: { type: "string" },
      grouped: { type: "string", "ui:group": "g1" },
    },
    required: ["ungrouped", "grouped"],
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

function GroupToggle() {
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

// TODO add examples for
// - number
// - integer
// - array of number

const ExampleWrapper: ParentComponent<{ legend: string }> = (props) => {
  return (
    <fieldset class="rounded-md border border-gray-300 p-4">
      <legend class="font-semibold text-2xl">{props.legend}</legend>
      {props.children}
    </fieldset>
  );
};

const App: Component = () => {
  return (
    <div class="flex-row gap-4 p-12">
      <ExampleWrapper legend="Minimal">
        <Minimal />
      </ExampleWrapper>
      <ExampleWrapper legend="External submit">
        <ExternalSubmit />
      </ExampleWrapper>
      <ExampleWrapper legend="Group">
        <Group />
      </ExampleWrapper>
      <ExampleWrapper legend="Group error">
        <GroupError />
      </ExampleWrapper>
      <ExampleWrapper legend="Group toggle">
        <GroupToggle />
      </ExampleWrapper>
      <ExampleWrapper legend="Kitchen sink">
        <Kitchensink />
      </ExampleWrapper>
    </div>
  );
};

export default App;
