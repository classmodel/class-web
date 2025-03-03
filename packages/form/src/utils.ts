import { group } from "console";
import {
  Ajv2020,
  type JSONSchemaType,
  type ValidateFunction,
} from "ajv/dist/2020.js";

function group2nested<C>(schema: JSONSchemaType<C>): {
  unnested: string[];
  nested: Map<string, string[]>;
} {
  if (!("properties" in schema)) {
    throw new Error("Only object schemas are supported");
  }
  const unnested: string[] = [];
  const nested = new Map<string, string[]>();
  for (const key in schema.properties) {
    const prop = schema.properties[key];
    const groupName = prop["ui:group"];
    if (groupName) {
      const nest = nested.get(groupName);
      if (nest) {
        nest.push(key);
      } else {
        nested.set(groupName, [key]);
      }
    } else {
      unnested.push(key);
    }
  }
  if ("allOf" in schema) {
    for (const ifthenelses of schema.allOf) {
      for (const key in ifthenelses.then.properties) {
        const prop = ifthenelses.then.properties[key];
        const groupName = prop["ui:group"];
        if (groupName) {
          const nest = nested.get(groupName);
          if (nest) {
            nest.push(key);
          } else {
            nested.set(groupName, [key]);
          }
        } else {
          unnested.push(key);
        }
      }
    }
  }

  /*
    Should return:
  
    {
      unnested: ['name', 'description', 'runtime', 'h_0'],
      nested: new Map([
        ['Mixed layer', ['mixedLayer', 'wtheta']]
      ])
    }
  
    */
  return { unnested, nested };
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

export interface BooleanToggle {
  // key of the property that triggers the toggle
  key: string;
  // properties that are toggled (aka made required) by the key, excludes key
  members: Record<string, SchemaOfProperty>;
}

export interface EnumToggle {
   // key of the property that triggers the toggle
   key: string;
   choices: Record<string, Record<string, SchemaOfProperty>>;
}

export type Toggle = BooleanToggle | EnumToggle;

function conditions2toggles<C>(schema: JSONSchemaType<C>): Toggle[] {
  if (schema.type !== "object") {
    throw new Error("Only object schemas are supported");
  }
  if (!schema.allOf) {
    return [];
  }
  /* Should return 
  
      [ { key: 'mixedLayer', value: true, members: [ 'wtheta' ] } ]
    */
  const toggles: Toggle[] = [];
  for (const subSchema of schema.allOf) {
    if (!subSchema.if || !subSchema.then) {
      continue;
    }
    const ifProp = subSchema.if.properties;
    const members = subSchema.then.properties;
    const key = Object.keys(ifProp)[0];
    const value = ifProp[key].const;
    toggles.push({ key, members });
  }
  return toggles;
}

export function schema2groups<C>(schema: JSONSchemaType<C>): {
  groupless: string[];
  untoggelable: Map<string, string[]>;
  toggleable: Map<string, Toggle[]>;
} {
  const hierarchy = group2nested(schema);
  const toggles = conditions2toggles(schema);
  const groupless = hierarchy.unnested;
  const untoggelable = new Map<string, string[]>();
  const toggleable = new Map<string, Toggle[]>();
  for (const [groupName, members] of hierarchy.nested) {
    const groupToggles = toggles.filter((t) => members.includes(t.key))
    for (const toggle of groupToggles) {
      const tg = toggleable.get(groupName)
      if (tg) {
        tg.push(toggle);
      } else {
        toggleable.set(groupName, [toggle]);
      }
    }
    if (groupToggles.length === 0) {
      untoggelable.set(groupName, members);
    }
  }
  return {
    groupless,
    untoggelable,
    toggleable,
  };
}

// TODO move to from @classmodel/config
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
  const newSchema = structuredClone(schema);
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
