# @classmodel/form package

Form component that renders a JSON schema using Solid UI components.

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

TODO move docs for json schema custom keywords to here.
