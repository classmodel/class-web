import { CLASS } from "./class";
import { classConfig } from "./config";

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
      if (model.t % 3600 == 0) {
        // TODO I wasn't sure how to quickly try this in a REPL
        // briefly tried ts-node but it complained about modules and more
        console.log(model.t, model.h);
      }
    }
    expect(model.t).toEqual(12 * 3600);
  });
});
