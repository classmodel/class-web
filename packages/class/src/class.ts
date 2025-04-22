/**
 * This module contains the CLASS model implementation.
 * @module
 */
import type { Config } from "./config.js";

// Constants
const rho = 1.2; /** Density of air [kg m-3] */
const cp = 1005.0; /** Specific heat of dry air [J kg-1 K-1] */

/**
 * CLASS model definition
 * @property _cfg: object containing the model settings
 * @property h: ABL height [m]
 * @property theta: Mixed-layer potential temperature [K]
 * @property dtheta: Temperature jump at h [K]
 * @property q: Mixed-layer specific humidity [kg kg-1]
 * @property dq: Specific humidity jump at h [kg kg-1]
 * @property t: Model time [s]
 */
export class CLASS {
  _cfg: Config;
  h: number;
  theta: number;
  dtheta: number;
  q: number;
  dq: number;
  t = 0;

  /**
   * Create object and initialize the model state
   * @param config Model settings
   */
  constructor(config: Config) {
    this._cfg = config;
    if (config.sw_ml) {
      this.h = config.h;
      this.theta = config.theta;
      this.dtheta = config.dtheta;
      this.q = config.q;
      this.dq = config.dq;
    } else {
      // TODO dont have defaults here, but have it work without this else block
      this.h = 200;
      this.theta = 288;
      this.dtheta = 1;
      this.q = 0.008;
      this.dq = -0.001;
    }
  }
  /**
   * Integrate mixed layer
   */
  update() {
    const dt = this._cfg.dt;
    this.h += dt * this.htend;
    this.theta += dt * this.thetatend;
    this.dtheta += dt * this.dthetatend;
    this.q += dt * this.qtend;
    this.dq += dt * this.dqtend;
    this.t += dt;
  }

  /**
   * Type guard assertion function that checks if mixed layer mode is enabled in the configuration.
   * @throws {Error} When mixed layer is not enabled in the configuration.
   * @typeAssertion {CLASS & {_cfg: Config & {sw_ml: true}}} - Asserts that this instance has mixed layer enabled
   * @private
   */
  private hasMixedLayer(): asserts this is CLASS & {
    _cfg: Config & { sw_ml: true };
  } {
    if (!this._cfg.sw_ml) {
      throw new Error("Mixed layer is not enabled");
    }
  }

  private interpolatedWtheta(): number {
    this.hasMixedLayer();
    // TODO interpolated based on this.t / this.runtime and the wtheta values
    return this._cfg.wtheta[0];
  }

  /** Tendency of CLB [m s-1]*/
  get htend(): number {
    return this.we + this.ws;
  }

  /** Tendency of mixed-layer potential temperature [K s-1] */
  get thetatend(): number {
    this.hasMixedLayer();
    const wtheta = this.interpolatedWtheta();
    return (wtheta - this.wthetae) / this.h + this._cfg.advtheta;
  }

  /** Tendency of potential temperature jump at h [K s-1] */
  get dthetatend(): number {
    this.hasMixedLayer();
    const w_th_ft = 0.0; // TODO: add free troposphere switch
    const gammatheta = this._cfg.gammatheta[0]; // TODO: make conditional on h and z_ft_theta
    return gammatheta * this.we - this.thetatend + w_th_ft;
  }

  /** Tendency of mixed-layer specific humidity [kg kg-1 s-1] */
  get qtend(): number {
    this.hasMixedLayer();
    const wq = this._cfg.wq[0]; // TODO: interpolate
    return (wq - this.wqe) / this.h + this._cfg.advq;
  }

  /** Tendency of specific humidity jump at h[kg kg-1 s-1] */
  get dqtend(): number {
    this.hasMixedLayer();
    const w_q_ft = 0; // TODO: add free troposphere switch
    const gammaq = this._cfg.gammaq[0]; // TODO: make conditional on h and z_ft_theta
    return gammaq * this.we - this.qtend + w_q_ft;
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
    this.hasMixedLayer();
    return -this._cfg.divU * this.h;
  }

  /** Entrainment kinematic heat flux [K m s-1]. */
  get wthetae(): number {
    return -this.we * this.dtheta;
  }

  /** Entrainment moisture flux [kg kg-1 m s-1]. */
  get wqe(): number {
    return -this.we * this.dq;
  }

  /** Entrainment kinematic virtual heat flux [K m s-1]. */
  get wthetave(): number {
    this.hasMixedLayer();
    return -this._cfg.beta * this.wthetav;
  }

  /** Virtual temperature jump at h [K]. */
  get dthetav(): number {
    return (
      (this.theta + this.dtheta) * (1.0 + 0.61 * (this.q + this.dq)) -
      this.theta * (1.0 + 0.61 * this.q)
    );
  }

  /** Surface kinematic virtual heat flux [K m s-1]. */
  get wthetav(): number {
    this.hasMixedLayer();
    const wtheta = this.interpolatedWtheta();
    const wq = this._cfg.wq[0]; // TODO: interpolate
    return wtheta + 0.61 * this.theta * wq;
  }
}
