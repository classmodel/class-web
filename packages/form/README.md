# @classmodel/form package

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
    const defaults = {
        name: 'Jane Doe',
    }
    const values = {
        name: 'World',
    }

    return (
        <Form
            schema={schema}
            defaults={defaults}
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

TODO move docs for json schema custom keywords to here.

## Development

To use in a monorepo as a dependency this package needs to be built first with

```bash
pnpm build
# or during development
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