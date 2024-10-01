// The entry file of your WebAssembly module.

// Constants
const rho: f32 = 1.2; /** Density of air [kg m-3] */
const cp: f32 = 1005.0; /** Specific heat of dry air [J kg-1 K-1] */

class Config {
    /**
     * Initial ABL height [m]
     */
    h_0: f32 = 200;
    /**
     * Initial mixed-layer potential temperature [K]
     */
    theta_0: f32 = 288;
    /**
     * Initial temperature jump at h [K]
     */
    dtheta_0: f32 = 1;
    /**
     * Initial mixed-layer specific humidity [kg kg-1]
     */
    q_0: f32 = 0.008;
    /**
     * Initial specific humidity jump at h [kg kg-1]
     */
    dq_0: f32 = -0.001;
   /**
     * Time step [s]
     */
   dt: f32 = 60;
   /**
    * Total run time [s]
    */
   runtime: f32 = 43200;
      /**
     * Surface kinematic heat flux [K m s-1]
     */
      wtheta: f32 = 0.1;
      /**
       * Advection of heat [K s-1]
       */
      advtheta: f32 = 0;
      /**
       * Free atmosphere potential temperature lapse rate [K m-1]
       */
      gammatheta: f32 = 0.006;
      /**
       * Surface kinematic moisture flux [kg kg-1 m s-1]
       */
      wq: f32 = 0.0001;
      /**
       * Advection of moisture [kg kg-1 s-1]
       */
      advq: f32 = 0;
      /**
       * Free atmosphere specific humidity lapse rate [kg kg-1 m-1]
       */
      gammaq: f32 = 0;
      /**
       * Horizontal large-scale divergence of wind [s-1]
       */
      divU: f32 =0;
      /**
       * Entrainment ratio for virtual heat [-]
       */
      beta: f32 = 0.2;
}

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

class CLASS {
  _cfg: Config;
  h: f32;
  theta: f32;
  dtheta: f32;
  q: f32;
  dq: f32;
  t: f32 = 0;

  /**
   * Create object and initialize the model state
   * @param config Model settings
   */
  constructor(config: Config) {
    this._cfg = config;
    this.h = config.h_0;
    this.theta = config.theta_0;
    this.dtheta = config.dtheta_0;
    this.q = config.q_0;
    this.dq = config.dq_0;
  }
  /**
   * Integrate mixed layer
   */
  update(): void {
    const dt = this._cfg.dt;
    this.h += dt * this.htend;
    this.theta += dt * this.thetatend;
    this.dtheta += dt * this.dthetatend;
    this.q += dt * this.qtend;
    this.dq += dt * this.dqtend;
    this.t += dt;
  }

  /** Tendency of CLB [m s-1]*/
  get htend(): f32 {
    return this.we + this.ws;
  }

  /** Tendency of mixed-layer potential temperature [K s-1] */
  get thetatend(): f32 {
    return (
      (this._cfg.wtheta - this.wthetae) / this.h +
      this._cfg.advtheta
    );
  }

  /** Tendency of potential temperature jump at h [K s-1] */
  get dthetatend(): f32 {
    const w_th_ft: f32 = 0.0; // TODO: add free troposphere switch
    return this._cfg.gammatheta * this.we - this.thetatend + w_th_ft;
  }

  /** Tendency of mixed-layer specific humidity [kg kg-1 s-1] */
  get qtend(): f32 {
    return (
      (this._cfg.wq - this.wqe) / this.h + this._cfg.advq
    );
  }

  /** Tendency of specific humidity jump at h[kg kg-1 s-1] */
  get dqtend(): f32 {
    const w_q_ft: f32 = 0; // TODO: add free troposphere switch
    return this._cfg.gammaq - this.qtend + w_q_ft;
  }

  /** Entrainment velocity [m s-1]. */
  get we(): f32 {
    // TODO add sw_shearwe
    let we = -this.wthetave / this.dthetav;

    // Don't allow boundary layer shrinking
    if (we < 0) {
      we = 0;
    }
    return we;
  }

  /** Large-scale vertical velocity [m s-1]. */
  get ws(): f32 {
    return -this._cfg.divU * this.h;
  }

  /** Entrainment kinematic heat flux [K m s-1]. */
  get wthetae(): f32 {
    return -this.we * this.dtheta;
  }

  /** Entrainment moisture flux [kg kg-1 m s-1]. */
  get wqe(): f32 {
    return -this.we * this.dq;
  }

  /** Entrainment kinematic virtual heat flux [K m s-1]. */
  get wthetave(): f32 {
    return -this._cfg.beta * this.wthetav;
  }

  /** Virtual temperature jump at h [K]. */
  get dthetav(): f32 {
    return (
      (this.theta + this.dtheta) * (1.0 + 0.61 * (this.q + this.dq)) -
      this.theta * (1.0 + 0.61 * this.q)
    );
  }

  /** Surface kinematic virtual heat flux [K m s-1]. */
  get wthetav(): f32 {
    return (
      this._cfg.wtheta + 0.61 * this.theta * this._cfg.wq
    );
  }
}

export function runner(h_0: f32, runtime: f32): Array<Float32Array> {
  // TODO expose config as argument
  // TODO expose output varnames as argument
  const config = new Config();
  config.h_0 = h_0;
  config.runtime = runtime;
  const model = new CLASS(config);
  const outputSize: i32 = i32(config.runtime / config.dt);
  const times: Float32Array = new Float32Array(outputSize);
  const heights: Float32Array = new Float32Array(outputSize);

  let index: i32 = 0;
  while (model.t < config.runtime) {
    model.update();

    if (model.t % 60 === 0) {
      times[index] = model.t;
      heights[index] = model.h;
      index++;
    }
  }

  const output = new Array<Float32Array>(2);
  output[0] = times;
  output[1] = heights;
  return output;
}
