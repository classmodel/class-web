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

  test(
    "given additional property should be invalid",
    { skip: "if/then/else does not work with additionalProperties:false" },
    () => {
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
    },
  );

  test("given string should coerce to number", () => {
    const input = { sw_ml: true, h_0: "42" };

    validate(input);

    assert.ok(typeof input.h_0 === "number");
  });
});

describe("parse", () => {
  test("given emtpy object should return default config", () => {
    const input = {};

    const output = parse(input);

    const expected = {
      name: "",
      description: "",
      sw_ml: true,
      h_0: 200,
      theta_0: 288,
      dtheta_0: 1,
      q_0: 0.008,
      dq_0: -0.001,
      dt: 60,
      runtime: 43200,
      wtheta: [0.1],
      advtheta: 0,
      gammatheta: 0.006,
      wq: 0.0001,
      advq: 0,
      gammaq: 0,
      divU: 0,
      beta: 0.2,
      // TODO Props below should not be there when radiationMode is uncommented in config.ts
      // radiationMode: "",
      // albedo: 0.2,
      // cq: 0,
    };
    assert.deepEqual(output, expected);
  });

  test("given partial config should return full config", () => {
    const input = { h_0: 100, sw_ml: true };

    const output = parse(input);

    const expected = parse({});
    if (!expected.sw_ml) {
      throw new Error("sw_ml is enabled");
    }
    expected.h_0 = 100;
    assert.deepEqual(output, expected);
  });

  test("given partial string config should return full coerced config", () => {
    const input = { h_0: "100", sw_ml: true };

    const output = parse(input);

    const expected = parse({});
    if (!expected.sw_ml) {
      throw new Error("sw_ml is enabled");
    }
    expected.h_0 = 100;
    assert.deepEqual(output, expected);
  });

  test("given emptry string should return default", () => {
    const input = { h_0: "", sw_ml: true };

    const output = parse(input);

    const expected = parse({});
    assert.deepEqual(output, expected);
  });

  test(
    "given additional property should throw",
    { skip: "if/then/else does not work with additionalProperties:false" },
    () => {
      const input = { foo: 42 };

      assert.throws(() => parse(input), {
        name: "ValidationError",
        message: "Invalid input: data must NOT have additional properties",
      });
    },
  );
});
