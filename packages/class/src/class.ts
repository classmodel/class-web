/**
 * This module contains the CLASS model implementation.
 * @module
 */
import type { Config, MixedLayerConfig, WindConfig } from "./config.js";
import { findInsertIndex, interpolateHourly } from "./utils.js";

// Constants
const CONSTANTS = {
  fc: 1e-4, // Coriolis parameter [m s-1]
};

// Group related variables so we can require them as complete sets
type Wind = {
  u: number;
  v: number;
  du: number;
  dv: number;
};

type MixedLayer = {
  h: number;
  theta: number;
  dtheta: number;
  q: number;
  dq: number;
};

export class CLASS {
  _cfg: Config;
  ml?: MixedLayer;
  wind?: Wind;
  t = 0;

  /**
   * Create object and initialize the model state
   * @param config Model settings
   */
  constructor(config: Config) {
    this._cfg = config;
    // Initialize state variables from config
    if (config.sw_ml) {
      const { h, theta, dtheta, q, dq } = config;
      this.ml = { h, theta, dtheta, q, dq };

      if (config.sw_wind) {
        const { u, v, du, dv } = config;
        this.wind = { u, v, du, dv };
      }
    }
  }

  /**
   * Integrate mixed layer
   */
  update() {
    const dt = this._cfg.dt;
    if (this.ml) {
      this.ml.h += dt * this.htend;
      this.ml.theta += dt * this.thetatend;
      this.ml.dtheta += dt * this.dthetatend;
      this.ml.q += dt * this.qtend;
      this.ml.dq += dt * this.dqtend;
      if (this.wind) {
        this.wind.u += dt * this.utend;
        this.wind.v += dt * this.vtend;
        this.wind.du += dt * this.dutend;
        this.wind.dv += dt * this.dvtend;
      }
    }
    this.t += dt;
  }

  get utend(): number {
    this.assertWind();
    // TODO make sure all variables are available
    return (
      -CONSTANTS.fc * this.wind.dv +
      (this.uw + this.we * this.wind.du) / this.ml.h +
      this._cfg.advu
    );
    // return 0
  }

  get vtend(): number {
    this.assertWind();
    // TODO make sure all variables are available
    return (
      CONSTANTS.fc * this.wind.du +
      (this.vw + this.we * this.wind.dv) / this.ml.h +
      this._cfg.advv
    );
  }

  get dutend(): number {
    this.assertWind();
    return this.gamma_u * this.we - this.utend;
  }

  get dvtend(): number {
    this.assertWind();
    return this.gamma_v * this.we - this.vtend;
  }

  get uw(): number {
    this.assertWind();
    const { u, v } = this.wind;
    const { ustar } = this._cfg;
    return -Math.sign(u) * (ustar ** 4 / (v ** 2 / u ** 2 + 1)) ** 0.5;
  }

  get vw(): number {
    this.assertWind();
    const { u, v } = this.wind;
    const { ustar } = this._cfg;
    return -Math.sign(v) * (ustar ** 4 / (u ** 2 / v ** 2 + 1)) ** 0.5;
  }

  /** Tendency of CLB [m s-1]*/
  get htend(): number {
    return this.we + this.ws;
  }

  /** Tendency of mixed-layer potential temperature [K s-1] */
  get thetatend(): number {
    this.assertMixedLayer();
    return (this.wtheta - this.wthetae) / this.ml.h + this._cfg.advtheta;
  }

  /** Tendency of potential temperature jump at h [K s-1] */
  get dthetatend(): number {
    this.assertMixedLayer();
    const w_th_ft = 0.0; // TODO: add free troposphere switch
    return this.gammatheta * this.we - this.thetatend + w_th_ft;
  }

  /** Tendency of mixed-layer specific humidity [kg kg-1 s-1] */
  get qtend(): number {
    this.assertMixedLayer();
    return (this.wq - this.wqe) / this.ml.h + this._cfg.advq;
  }

  /** Tendency of specific humidity jump at h[kg kg-1 s-1] */
  get dqtend(): number {
    this.assertMixedLayer();
    const w_q_ft = 0; // TODO: add free troposphere switch
    return this.gammaq * this.we - this.qtend + w_q_ft;
  }

  /** Entrainment velocity [m s-1]. */
  get we(): number {
    // TODO add sw_shearwe
    let we = -this.wthetave / this.dthetav;

    // Don't allow boundary layer shrinking
    if (we < 0) {
      we = 0;
    }
    return we;
  }

  /** Large-scale vertical velocity [m s-1]. */
  get ws(): number {
    this.assertMixedLayer();
    return -this._cfg.divU * this.ml.h;
  }

  /** Entrainment kinematic heat flux [K m s-1]. */
  get wthetae(): number {
    this.assertMixedLayer();
    return -this.we * this.ml.dtheta;
  }

  /** Entrainment moisture flux [kg kg-1 m s-1]. */
  get wqe(): number {
    this.assertMixedLayer();
    return -this.we * this.ml.dq;
  }

  /** Entrainment kinematic virtual heat flux [K m s-1]. */
  get wthetave(): number {
    this.assertMixedLayer();
    return -this._cfg.beta * this.wthetav;
  }

  /** Virtual temperature jump at h [K]. */
  get dthetav(): number {
    this.assertMixedLayer();
    return (
      (this.ml.theta + this.ml.dtheta) *
        (1.0 + 0.61 * (this.ml.q + this.ml.dq)) -
      this.ml.theta * (1.0 + 0.61 * this.ml.q)
    );
  }

  get wtheta(): number {
    this.assertMixedLayer();
    return interpolateHourly(this._cfg.wtheta, this.t);
  }

  get wq(): number {
    this.assertMixedLayer();
    return interpolateHourly(this._cfg.wq, this.t);
  }

  /** Surface kinematic virtual heat flux [K m s-1]. */
  get wthetav(): number {
    this.assertMixedLayer();
    return this.wtheta + 0.61 * this.ml.theta * this.wq;
  }

  // Lapse rates

  /** Free atmosphere potential temperature lapse rate */
  get gammatheta(): number {
    this.assertMixedLayer();
    const { z_theta, gammatheta } = this._cfg;
    const i = findInsertIndex(z_theta, this.ml.h);
    return gammatheta[i] ?? 0;
  }

  /** Free atmosphere specific humidity lapse rate */
  get gammaq(): number {
    this.assertMixedLayer();
    const { z_q, gammaq } = this._cfg;
    const i = findInsertIndex(z_q, this.ml.h);
    return gammaq[i] ?? 0;
  }

  /** Free atmosphere u-wind lapse rate */
  get gamma_u(): number {
    this.assertWind();
    const { z_u, gamma_u } = this._cfg;
    const i = findInsertIndex(z_u, this.ml.h);
    return gamma_u[i] ?? 0;
  }

  /** Free atmosphere v-wind lapse rate */
  get gamma_v(): number {
    this.assertWind();
    const { z_v, gamma_v } = this._cfg;
    const i = findInsertIndex(z_v, this.ml.h);
    return gamma_v[i] ?? 0;
  }

  // Type guards
  private assertMixedLayer(): asserts this is CLASS & {
    _cfg: MixedLayerConfig;
    ml: MixedLayer;
  } {
    if (!this._cfg.sw_ml || this.ml === undefined) {
      throw new Error("Mixed layer is not enabled in config");
    }
  }

  private assertWind(): asserts this is CLASS & {
    _cfg: MixedLayerConfig & WindConfig;
    ml: MixedLayer;
    wind: Wind;
  } {
    this.assertMixedLayer();
    if (!this._cfg.sw_wind || this.wind === undefined) {
      throw new Error(
        "Wind is not enabled in config or wind state is not initialized.",
      );
    }
  }

  get q() {
    return this.ml?.q || 999;
  }

  /**
   * Retrieve a value by name, treating nested state (wind, ml) as if it's flat.
   *
   * Lookup order:
   *  1. Property on the class instance itself.
   *  2. Property on `wind`, if available.
   *  3. Property on `ml`, if available.
   *
   * Returns `999` if the property is not found in any of the above.
   */
  getValue(name: string): number {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const self = this as any;
    if (name in self && typeof self[name] === "number") return self[name];
    if (this.wind && name in this.wind) return this.wind[name as keyof Wind];
    if (this.ml && name in this.ml) return this.ml[name as keyof MixedLayer];
    return 999;
  }
}
