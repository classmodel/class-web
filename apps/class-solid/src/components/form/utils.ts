import type { JsonSchemaOfConfig } from "@classmodel/class/config";

function group2nested(schema: JsonSchemaOfConfig): {
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

export interface SchemaOfProperty {
  type: string;
  title?: string;
  symbol?: string;
  unit?: string;
  description?: string;
  // biome-ignore lint/suspicious/noExplicitAny: can be anything
  default?: any;
  items?: {
    type: string;
  };
}

export interface Toggle {
  // key of the property that triggers the toggle
  key: string;
  // value of key that triggers the toggle
  value: boolean | string;
  // properties that are toggled (aka made required) by the key, excludes key
  members: Record<string, SchemaOfProperty>;
}

function conditions2toggles(schema: JsonSchemaOfConfig): Toggle[] {
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
    toggles.push({ key, value, members });
  }
  return toggles;
}

export function schema2groups(schema: JsonSchemaOfConfig): {
  groupless: string[];
  untoggelable: Map<string, string[]>;
  toggleable: Map<string, Toggle>;
} {
  const hierarchy = group2nested(schema);
  const toggles = conditions2toggles(schema);
  const groupless = hierarchy.unnested;
  const untoggelable = new Map<string, string[]>();
  const toggleable = new Map<string, Toggle>();
  for (const [groupName, members] of hierarchy.nested) {
    const toggle = toggles.find((t) => members.includes(t.key));
    if (toggle) {
      toggleable.set(groupName, toggle);
    } else {
      untoggelable.set(groupName, members);
    }
  }
  return {
    groupless,
    untoggelable,
    toggleable,
  };
}
