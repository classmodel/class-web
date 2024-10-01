import { describe, test } from "node:test";
import assert from "node:assert";
import { runner as asRunner } from '../build/debug.js';
import { CLASS } from '@classmodel/class/class';

describe('asRunner', () => {
    test('should run', () => {
        console.time('asRunner');
        const [times, heights] = asRunner(200, 100 * 12 * 3600);
        console.timeEnd('asRunner');
        // assert.strictEqual(times.length, 720);
        // assert.strictEqual(heights.length, 720);
    });
})

function jsRunner(h_0, runtime) {
    const config = {
        title: "Test",
        description: "Test",
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
    config.timeControl.h_0 = h_0;
    config.timeControl.runtime = runtime;
    const model = new CLASS(config);
    const outputSize = Math.floor(config.timeControl.runtime / config.timeControl.dt);
    const times = new Float32Array(outputSize);
    const heights = new Float32Array(outputSize);

    let index = 0;
    while (model.t < config.timeControl.runtime) {
        model.update();
        if (model.t % 60 === 0) {
            times[index] = model.t;
            heights[index] = model.h;
            index++;
        }
    }

    const output = new Array(2);
    output[0] = times;
    output[1] = heights;
    return output;
}

/**
 * 
 * mkdir node_modules/@classmodel
 * ln -s ../../../class node_modules/@classmodel/
 */
describe('jsRunner', () => {
    test('should run', () => {
        console.time('jsRunner');
        const [times, heights] = jsRunner(200, 100 * 12 * 3600);
        console.timeEnd('jsRunner');
        // assert.strictEqual(times.length, 720);
        // assert.strictEqual(heights.length, 720);
        // console.log(times, heights);
    });
})