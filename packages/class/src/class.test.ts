import { CLASS } from "./class";
import { classConfig } from "./config";
import { ClassOutput, runClass } from "./runner";

describe("CLASS model", () => {
  it("can be instantiated with default config", () => {
    const config = classConfig.parse({});
    const model = new CLASS(config);
    expect(model).toBeInstanceOf(CLASS);
    expect(model.t).toEqual(0);
    expect(model._cfg.initialState.h_0).toEqual(200);
    expect(model._cfg.timeControl.dt).toEqual(60);
    expect(model._cfg.mixedLayer.wtheta).toEqual(0.1);
    expect(model._cfg.mixedLayer.wq).toEqual(0.0001);
  });

  test("calling update advances the model time", () => {
    const config = classConfig.parse({});
    const model = new CLASS(config);
    model.update();
    expect(model.t).toEqual(60);
  });

  it("can update until the final time step", () => {
    const config = classConfig.parse({});
    const model = new CLASS(config);
    while (model.t < config.timeControl.runtime) {
      model.update();
    }
    expect(model.t).toEqual(12 * 3600);
  });

  it("produces realistic results", () => {
    const config = classConfig.parse({});
    const output = runClass(config);
    console.log(output);
    expect(output);
  });
});
