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
    this.h = config.initialState.h_0;
    this.theta = config.initialState.theta_0;
    this.dtheta = config.initialState.dtheta_0;
    this.q = config.initialState.q_0;
    this.dq = config.initialState.dq_0;
  }
  /**
   * Integrate mixed layer
   */
  update() {
    const dt = this._cfg.timeControl.dt;
    this.h += dt * this.htend;
    this.theta += dt * this.thetatend;
    this.dtheta += dt * this.dthetatend;
    this.q += dt * this.qtend;
    this.dq += dt * this.dqtend;
    this.t += dt;
  }

  /** Tendency of CLB [m s-1]*/
  get htend(): number {
    return this.we + this.ws;
  }

  /** Tendency of mixed-layer potential temperature [K s-1] */
  get thetatend(): number {
    return (
      (this._cfg.mixedLayer.wtheta - this.wthetae) / this.h +
      this._cfg.mixedLayer.advtheta
    );
  }

  /** Tendency of potential temperature jump at h [K s-1] */
  get dthetatend(): number {
    const w_th_ft = 0.0; // TODO: add free troposphere switch
    return this._cfg.mixedLayer.gammatheta * this.we - this.thetatend + w_th_ft;
  }

  /** Tendency of mixed-layer specific humidity [kg kg-1 s-1] */
  get qtend(): number {
    return (
      (this._cfg.mixedLayer.wq - this.wqe) / this.h + this._cfg.mixedLayer.advq
    );
  }

  /** Tendency of specific humidity jump at h[kg kg-1 s-1] */
  get dqtend(): number {
    const w_q_ft = 0; // TODO: add free troposphere switch
    return this._cfg.mixedLayer.gammaq - this.qtend + w_q_ft;
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
    return -this._cfg.mixedLayer.divU * this.h;
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
    return -this._cfg.mixedLayer.beta * this.wthetav;
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
    return (
      this._cfg.mixedLayer.wtheta + 0.61 * this.theta * this._cfg.mixedLayer.wq
    );
  }
}
