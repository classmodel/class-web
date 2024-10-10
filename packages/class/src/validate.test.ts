import assert from "node:assert";
import test, { describe } from "node:test";
import type { Config } from "./config";
import {
  type PartialConfig,
  jsonSchemaOfConfig,
  overwriteDefaultsInJsonSchema,
  parse,
  pruneDefaults,
  validate,
} from "./validate";

describe("validate", () => {
  test("should validate a valid config", () => {
    const input = {};

    const valid = validate(input);

    assert.ok(valid);
    assert(validate.errors === null);
  });

  test("given additional property should be invalid", () => {
    const input = { foo: 42 };

    const valid = validate(input);

    assert.ok(!valid);
    assert.deepEqual(validate.errors, [
      {
        instancePath: "",
        schemaPath: "#/additionalProperties",
        keyword: "additionalProperties",
        params: { additionalProperty: "foo" },
        message: "must NOT have additional properties",
      },
    ]);
  });

  test("given string should coerce to number", () => {
    const input = { initialState: { h_0: "42" } };

    validate(input);

    assert.ok(typeof input.initialState.h_0 === "number");
  });
});

describe("parse", () => {
  test("given emtpy object should return default config", () => {
    const input = {};

    const output = parse(input);

    const expected = {
      initialState: {
        h_0: 200,
        theta_0: 288,
        dtheta_0: 1,
        q_0: 0.008,
        dq_0: -0.001,
      },
      timeControl: { dt: 60, runtime: 43200 },
      mixedLayer: {
        wtheta: 0.1,
        advtheta: 0,
        gammatheta: 0.006,
        wq: 0.0001,
        advq: 0,
        gammaq: 0,
        divU: 0,
        beta: 0.2,
      },
    };
    assert.deepEqual(output, expected);
  });

  test("given partial config should return full config", () => {
    const input = { initialState: { h_0: 100 } };

    const output = parse(input);

    const expected = parse({});
    expected.initialState.h_0 = 100;
    assert.deepEqual(output, expected);
  });

  test("given partial string config should return full coerced config", () => {
    const input = { initialState: { h_0: "100" } };

    const output = parse(input);

    const expected = parse({});
    expected.initialState.h_0 = 100;
    assert.deepEqual(output, expected);
  });

  test("given emptry string should return default", () => {
    const input = { initialState: { h_0: "" } };

    const output = parse(input);

    const expected = parse({});
    assert.deepEqual(output, expected);
  });

  test("given additional property should throw", () => {
    const input = { foo: 42 };

    assert.throws(() => parse(input), {
      name: "ValidationError",
      message: "Invalid input: data must NOT have additional properties",
    });
  });
});

describe("pruneDefaults", () => {
  test("given all defaults should return empty object", () => {
    const input: Config = {
      initialState: {
        h_0: 200,
        theta_0: 288,
        dtheta_0: 1,
        q_0: 0.008,
        dq_0: -0.001,
      },
      timeControl: { dt: 60, runtime: 43200 },
      mixedLayer: {
        wtheta: 0.1,
        advtheta: 0,
        gammatheta: 0.006,
        wq: 0.0001,
        advq: 0,
        gammaq: 0,
        divU: 0,
        beta: 0.2,
      },
    };

    const output = pruneDefaults(input);

    assert.deepEqual(output, {});
  });

  test("given 1 non defaults should return object with single key", () => {
    const input: Config = {
      initialState: {
        h_0: 300,
        theta_0: 288,
        dtheta_0: 1,
        q_0: 0.008,
        dq_0: -0.001,
      },
      timeControl: { dt: 60, runtime: 43200 },
      mixedLayer: {
        wtheta: 0.1,
        advtheta: 0,
        gammatheta: 0.006,
        wq: 0.0001,
        advq: 0,
        gammaq: 0,
        divU: 0,
        beta: 0.2,
      },
    };

    const output = pruneDefaults(input);

    const expected: PartialConfig = {
      initialState: { h_0: 300 },
    };
    assert.deepEqual(output, expected);
  });
});

describe("overwriteDefaultsInJsonSchema", () => {
  test("given zero defaults should return original schema", () => {
    const schema = structuredClone(jsonSchemaOfConfig);
    const defaults = {};

    const result = overwriteDefaultsInJsonSchema(schema, defaults);

    const expected = structuredClone(jsonSchemaOfConfig);
    assert.deepEqual(result, expected);
  });

  test("given default for initialState.h_0 should return schema with given default", () => {
    const schema = structuredClone(jsonSchemaOfConfig);
    const defaults = { initialState: { h_0: 42 } };

    const result = overwriteDefaultsInJsonSchema(schema, defaults);

    const expected = structuredClone(jsonSchemaOfConfig);
    expected.properties.initialState.properties.h_0.default = 42;
    assert.deepEqual(result, expected);
  });
});
