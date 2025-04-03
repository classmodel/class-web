# @classmodel/form package

[![github repo badge](https://img.shields.io/badge/github-repo-000.svg?logo=github&labelColor=gray&color=blue)]([https://github.com//classmodel/class-web](https://github.com//classmodel/class-web))
[![Code quality](https://github.com/classmodel/class-web/actions/workflows/quality.yml/badge.svg)](https://github.com/classmodel/class-web/actions/workflows/quality.yml)
[![npmjs.com](https://img.shields.io/npm/v/@classmodel/form.svg?style=flat)](https://www.npmjs.com/package/@classmodel/form)
[![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)
[![Example app](https://img.shields.io/badge/docs-blue)](https://classmodel.github.io/class-web/form/)

Form component that renders a JSON schema using Solid UI components.

Examples of the form can be see at [https://classmodel.github.io/class-web/form/](https://classmodel.github.io/class-web/form/).

## Usage

```bash
npm install @classmodel/form
```

```tsx
import { Form } from '@classmodel/form';

export function App() {
    const schema = {
        type: 'object',
        properties: {
        name: {
            type: 'string',
            title: 'Name',
            default: 'John Doe',
        },
        }
    };
    const values = {
        name: 'World',
    }

    return (
        <Form
            schema={schema}
            values={values}
            onChange={(values) => console.log(values)}
        />;
    )
}
```

The components are styled with [tailwindcss](https://tailwindcss.com/).
For your own webapp to pick up the classes in the components, you need to add the following to your
 `tailwind.config.ts`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // Existing content goes here
    './node_modules/@classmodel/form/dist/**/*.js',
  ],
  // Rest of the config goes here
}
```

## JSON schema

The form expects a JSON schema of 2020-12 version. The schema is used to generate and validate the form.

Some additional keywords can be used to specialize the form generation.

### symbol keyword

The form label uses the value of the `title` key or property key.
If you want an shorter label you can add the `symbol` key with a string value.
An example value could be `β` for beta.
When symbol is set the title will be displayed as a tooltip.
The symbol value can include HTML like sub and sup. For example `<sub>2</sub>` for subscript<sub>2</sub> or
`<sup>3</sup>` for superscript<sup>3<sup>.

### unit keyword

A property can have a `unit` key with a string value.
An example value could be `kg kg-1`.
The unit will be displayed in the form.

### ui:group keyword

The JSON schema must be flat, due to its use for form generation. There can not be a nested object in the schema.
During the form generation, the `ui:group` key and its string value are used to group properties together. 
The group name will be displayed as a header in the form. 
The `ui:group` value should be the same for the properties in a `if` and `then` block.

### ui:widget keyword

Some property you would like to have a different input widget for.
This widget can be chosen by setting the `ui:widget` key to a string value.
Valid values are

- `textarea` for a text area input. Given property type is `string`.

### Supported types

The form generation can handle the following property types:

- string
  - rendered as text input or 
  - if has enum values then rendered as radio group
- number
- integer
- boolean: rendered as checkbox
- array of numbers: rendered as text input that can be filled with a comma separated list of numbers

## API

### Form

Properties of Form component:

- `schema` - The JSON schema for the form. Must be version 2020-12.
- `values` - Initial values for the form fields.
- `onSubmit` - Callback function to handle form submission. Called with the form values.
- `defaults` - Default values to overwrite in the schema. Optional.
- `id` - The id of the form element. Can be used to submit form from a non-child element. Optional.
- `children` - Child elements to render inside the form. Mostly used for submit button. Optional.
- `uiComponents` - Custom UI components to use in the form. Optional.

The values, defaults and onSubmit argument are the same type.

## Development

To use this package in this monorepo, the package needs to be built first with

```bash
pnpm build
# or during development of the form package
pnpm dev
```

The [src/App.tsx](src/App.tsx) file can be used to test the form component.
It can be run with

```bash
pnpm example:dev
```

The unit tests can be run with

```bash
pnpm test
```

The types can be checked with

```bash
pnpm typecheck
```

## Release

For release check the stuff is compliant with

```bash
pnpm dlx publint
pnpm --package @arethetypeswrong/cli dlx attw --profile esm-only --pack .
```