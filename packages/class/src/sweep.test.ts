import assert from "node:assert";
import test, { describe } from "node:test";
import { performSweep } from "./sweep.js";

describe("performSweep", () => {
  test("zero sweeps", () => {
    const perms = performSweep([]);
    assert.deepEqual(perms, []);
  });

  test("one sweep", () => {
    const sweeps = [
      {
        section: "initialState",
        parameter: "h_0",
        start: 100,
        step: 100,
        steps: 5,
      },
    ];

    const perms = performSweep(sweeps);

    const expected = [
      {
        initialState: {
          h_0: 100,
        },
      },
      {
        initialState: {
          h_0: 200,
        },
      },
      {
        initialState: {
          h_0: 300,
        },
      },
      {
        initialState: {
          h_0: 400,
        },
      },
      {
        initialState: {
          h_0: 500,
        },
      },
    ];
    assert.deepEqual(perms, expected);
  });

  test("two sweeps", () => {
    const sweeps = [
      {
        section: "initialState",
        parameter: "h_0",
        start: 100,
        step: 100,
        steps: 2,
      },
      {
        section: "mixedLayer",
        parameter: "beta",
        start: 0.1,
        step: 0.1,
        steps: 2,
      },
    ];

    const perms = performSweep(sweeps);

    const expected = [
      {
        initialState: {
          h_0: 100,
        },
        mixedLayer: {
          beta: 0.1,
        },
      },
      {
        initialState: {
          h_0: 100,
        },
        mixedLayer: {
          beta: 0.2,
        },
      },
      {
        initialState: {
          h_0: 200,
        },
        mixedLayer: {
          beta: 0.1,
        },
      },
      {
        initialState: {
          h_0: 200,
        },
        mixedLayer: {
          beta: 0.2,
        },
      },
    ];
    assert.deepEqual(perms, expected);
  });
});
