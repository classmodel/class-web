import {
  Ajv2020,
  type JSONSchemaType,
  type ValidateFunction,
} from "ajv/dist/2020";

/**
 * Overwrites the default values in a JSON schema with the provided defaults.
 *
 * @param schema - The original JSON schema to be modified.
 * @param defaults - An object containing the default values to overwrite in the schema.
 * @returns A new JSON schema with the default values overwritten.
 *
 * @remarks
 * This function currently only handles objects of objects and needs to be made more generic.
 *
 * @example
 * ```typescript
 * const schema = {
 *   properties: {
 *     setting1: {
 *       properties: {
 *         subsetting1: { type: 'string', default: 'oldValue' }
 *       }
 *     }
 *   }
 * };
 *
 * const defaults = {
 *   setting1: {
 *     subsetting1: 'newValue'
 *   }
 * };
 *
 * const newSchema = overwriteDefaultsInJsonSchema(schema, defaults);
 * console.log(newSchema.properties.setting1.properties.subsetting1.default); // 'newValue'
 * ```
 */
export function overwriteDefaultsInJsonSchema<C>(
  schema: JSONSchemaType<C>,
  defaults: C,
): JSONSchemaType<C> {
  const newSchema = JSON.parse(JSON.stringify(schema)) as JSONSchemaType<C>;
  // TODO make more generic, now only handles .properties and .allOf[n].then.properties
  for (const key in defaults) {
    const val = defaults[key];
    const prop = newSchema.properties[key];
    if (prop && "default" in prop) {
      prop.default = val;
    }
    // for (const subkey in val) {
    //   const subval = val[subkey as keyof typeof val];
    //   const prop =
    //     newSchema.properties[key as keyof Config].properties[
    //       subkey as keyof typeof val
    //     ];
    //   prop.default = subval;
    // }
  }
  if (newSchema.allOf) {
    for (const ifs of newSchema.allOf) {
      const props = ifs.then.properties;
      for (const key in defaults) {
        const val = defaults[key];
        const prop = props[key];
        if (prop && "default" in prop) {
          prop.default = val;
        }
      }
    }
  }
  return newSchema;
}

/**
 * Build function that validates the given input against the here given JSON schema.
 *
 * Errors can be accessed via the `errors` property of the returned function.
 *
 * @param schema - The JSON schema to validate against.
 * @returns A function that validates the input against the schema.
 */
export function buildValidate<C>(
  schema: JSONSchemaType<C>,
): ValidateFunction<C> {
  const ajv = new Ajv2020({
    coerceTypes: true,
    allErrors: true,
    useDefaults: "empty",
    code: { esm: true },
  });

  ajv.addKeyword({
    keyword: "unit",
    type: ["number", "array"],
    schemaType: "string",
    // TODO Add validation, like if unit===K then value >= 0
  });
  ajv.addKeyword({
    keyword: "symbol",
    type: ["number", "array"],
    schemaType: "string",
  });
  /**
   * When property has 'ui:group' keyword, it will be grouped in the UI inside the group of the same name.
   */
  ajv.addKeyword({
    keyword: "ui:group",
    schemaType: "string",
  });
  ajv.addKeyword({
    keyword: "ui:widget",
    schemaType: "string",
  });

  return ajv.compile(schema);
}

// TODO do not redefine, use types from Ajv somehow, difficult due to generics and infers
export interface SchemaOfProperty {
  type: string;
  title?: string;
  symbol?: string;
  unit?: string;
  description?: string;
  // biome-ignore lint/suspicious/noExplicitAny: can be anything
  default?: any;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  minItems?: number;
  items?: {
    type: string;
  };
  "ui:group"?: string;
  "ui:widget"?: string;
}

export type Base = {
  key: string;
  schema: SchemaOfProperty;
};

type Choice = {
  value: string | boolean;
  members: Base[];
};

export type Choices = Base & {
  choices: Choice[];
};

export type Group = {
  group: string;
  members: (Base | Choices)[];
};

export type Item = Base | Choices | Group;

export function isBase(item: Item): item is Base {
  return "key" in item;
}

export function isGroup(item: Item): item is Group {
  return "group" in item;
}

function isChoice(item: Item): item is Choices {
  return "choices" in item;
}

export function isBooleanChoices(item: Item): item is Choices {
  return isChoice(item) && item.schema.type === "boolean";
}

export function isStringChoices(item: Item): item is Choices {
  return isChoice(item) && item.schema.type === "string";
}

function findGroup(tree: Item[], groupName: string): Group | undefined {
  return tree.find(
    (item): item is Group => "group" in item && item.group === groupName,
  );
}

function findByKey(tree: Item[], key: string): Base | Choices | undefined {
  for (const item of tree) {
    if ("key" in item && item.key === key) {
      return item;
    }
    if ("members" in item) {
      const member = findByKey(item.members, key);
      if (member) {
        return member;
      }
    }
    if ("choices" in item) {
      for (const choice of item.choices) {
        const member = findByKey(choice.members, key);
        if (member) {
          return member;
        }
      }
    }
  }
  return undefined;
}

/**
 * Collects all unique keys from members within a group, including members nested in choices.
 *
 * @param group - The group name to search in
 * @returns A Set containing all unique member keys found in the group
 *
 */
export function keysOfGroupMembers(group: Group): Set<string> {
  // This does not look which choice has been made
  // aka whether choices.value === value
  const keys = new Set<string>();
  for (const member of group.members) {
    if (isBase(member)) {
      keys.add(member.key);
    }
    if (isChoice(member)) {
      for (const choice of member.choices) {
        for (const member of choice.members) {
          keys.add(member.key);
        }
      }
    }
  }
  return keys;
}

/**
 * Converts a JSON Schema object into a tree structure for form rendering.
 *
 * @template C - The type of the schema content
 * @param schema - A JSON Schema object that must be of type object with properties
 * @returns An array of items representing the hierarchical structure of the form
 *
 */
export function schema2tree<C>(schema: JSONSchemaType<C>): Item[] {
  const tree: Item[] = [];
  if (!("properties" in schema)) {
    throw new Error("Only object schemas are supported");
  }
  for (const key in schema.properties) {
    const prop = schema.properties[key];
    const groupName = prop["ui:group"];
    if (groupName) {
      const group = findGroup(tree, groupName);
      if (group) {
        group.members.push({ key, schema: prop });
      } else {
        tree.push({ group: groupName, members: [{ key, schema: prop }] });
      }
    } else {
      tree.push({ key, schema: prop });
    }
  }
  if ("allOf" in schema) {
    for (const ifthenelse of schema.allOf) {
      if (!("if" in ifthenelse && "then" in ifthenelse)) {
        throw new Error("Only if-then is supported in allOf array");
      }
      const ifentries = Object.entries(ifthenelse.if.properties) as [
        string,
        { const: string | boolean },
      ][];
      if (ifentries.length !== 1) {
        throw new Error("If can only have one property");
      }
      const ifentry = ifentries[0];
      if (
        "const" in ifentry[1] &&
        typeof ifentry[1].const !== "string" &&
        typeof ifentry[1].const !== "boolean"
      ) {
        throw new Error(
          "If property must have const that is a string or a boolean",
        );
      }
      const key = ifentry[0];

      const item = findByKey(tree, key) as Choices | undefined;
      if (!item) {
        throw new Error(`If property ${key} not found in tree`);
      }
      if (!("choices" in item)) {
        (item as Choices).choices = [];
      }
      const value = ifentry[1].const;
      if (typeof ifthenelse.then.properties !== "object") {
        throw new Error("Then block must have properties object");
      }
      const then = ifthenelse.then.properties as Record<
        string,
        SchemaOfProperty
      >;
      const members: Base[] = [];
      for (const [tkey, tvalue] of Object.entries(then)) {
        if (
          item.schema["ui:group"] &&
          tvalue["ui:group"] &&
          item.schema["ui:group"] !== tvalue["ui:group"]
        ) {
          throw new Error(
            "Properties in then block must be in the same ui:group as the property in if block",
          );
        }
        members.push({ key: tkey, schema: tvalue });
      }
      const choice = {
        value,
        members,
      };
      item.choices.push(choice);
    }
  }
  return tree;
}

/**
 * Creates a deep copy of the given object by serializing it to JSON and then
 * deserializing it back.
 *
 * @typeParam T - The type of the object to be copied.
 * @param obj - The object to create a deep copy of.
 * @returns A new object that is a deep copy of the input object.
 *
 * @remarks
 * This function uses `JSON.stringify` and `JSON.parse` to perform the deep
 * copy. It works well for plain objects and arrays but may not handle objects
 * with methods, circular references, or special types like `Date`, `Map`,
 * `Set`, etc.
 *
 * Unlike structuredClone, this method does not preserve references. This is to
 * avoid uncaught reference errors.
 */
export function deepCopy<T>(obj: T){
  return JSON.parse(JSON.stringify(obj)) as T
}