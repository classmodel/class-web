import assert from "node:assert";
import test, { describe } from "node:test";

import { parse, validate } from "./validate.js";

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
      name: "",
      description: "",
      initialState: {
        h_0: 200,
        theta_0: 288,
        dtheta_0: 1,
        q_0: 0.008,
        dq_0: -0.001,
      },
      timeControl: { dt: 60, runtime: 43200 },
      mixedLayer: {
        wtheta: [0.1],
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
