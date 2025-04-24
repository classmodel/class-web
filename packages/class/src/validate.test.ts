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
    const input = { sw_ml: true, h: "42" };

    validate(input);

    assert.ok(typeof input.h === "number");
  });
});

describe("parse", () => {
  test("given emtpy object should return default config", () => {
    const input = {};

    const output = parse(input);

    const expected = {
      h: 200,
      theta: 288,
      dtheta: 1,
      q: 0.008,
      dq: -0.001,
      wtheta: [0.1],
      advtheta: 0,
      gammatheta: [0.006],
      wq: [0.0001],
      advq: 0,
      gammaq: [0],
      divU: 0,
      beta: 0.2,
      z_theta: [5000],
      z_q: [5000],
      u: 6,
      du: 4,
      advu: 0,
      gamma_u: [0],
      z_u: [5000],
      v: -4,
      dv: 4,
      advv: 0,
      gamma_v: [0],
      z_v: [5000],
      ustar: 0.3,
      name: "",
      description: "",
      dt: 60,
      runtime: 43200,
      sw_ml: true,
      sw_wind: false,
    };
    assert.deepEqual(output, expected);
  });

  test("given partial config should return full config", () => {
    const input = { h: 100, sw_ml: true };

    const output = parse(input);

    const expected = parse({});
    if (!expected.sw_ml) {
      throw new Error("sw_ml is enabled");
    }
    expected.h = 100;
    assert.deepEqual(output, expected);
  });

  test("given partial string config should return full coerced config", () => {
    const input = { h: "100", sw_ml: true };

    const output = parse(input);

    const expected = parse({});
    if (!expected.sw_ml) {
      throw new Error("sw_ml is enabled");
    }
    expected.h = 100;
    assert.deepEqual(output, expected);
  });

  test("given emptry string should return default", () => {
    const input = { h: "", sw_ml: true };

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
