import type { JSONSchemaType } from "ajv/dist/2020";
import type { Component } from "solid-js";
import { Form } from "./Form";
import { Button } from "./components/ui/button";

// TODO use App to show examples of Form component usage
// TODO use storybookjs instead of App.tsx, but
// https://github.com/storybookjs/sandboxes/blob/main/solid-vite/default-ts/after-storybook
// does not work with node22

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

const App: Component = () => {
  return (
    <div class="p-12">
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
    </div>
  );
};

export default App;
