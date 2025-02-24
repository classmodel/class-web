import { deepEqual } from "node:assert";
import { test } from "node:test";
import { jsonSchemaOfConfig } from "@classmodel/class/config";
import { type Toggle, schema2groups } from "./utils";

test("schema2groups()", () => {
  const result = schema2groups(jsonSchemaOfConfig);
  const expected = {
    groupless: ["name", "description"],
    untoggelable: new Map([["Time Control", ["dt", "runtime"]]]),
    toggleable: new Map<string, Toggle>([
      [
        "sw_ml",
        {
          key: "sw_ml",
          value: true,
          members: jsonSchemaOfConfig.allOf[0].then.properties,
        },
      ],
    ]),
  };
  deepEqual(result, expected);
});
