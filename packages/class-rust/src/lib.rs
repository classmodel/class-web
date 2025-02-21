use wasm_bindgen::prelude::*;


mod utils;
use utils::GenericOption;

// Configuration

#[wasm_bindgen]
#[derive(Copy,Clone)]
pub struct Config {
    pub time_control: TimeControl,
    pub initial_state: InitialState,
    pub mixed_layer: MixedLayer,
}

#[wasm_bindgen]
#[derive(Copy,Clone)]
pub struct TimeControl {
    pub runtime: f64,
    pub dt: f64,
}

#[wasm_bindgen]
#[derive(Copy,Clone)]
pub struct InitialState {
    pub h_0: f64,
    pub theta_0: f64,
    pub dtheta_0: f64,
    pub q_0: f64,
    pub dq_0: f64,
}

#[wasm_bindgen]
#[derive(Copy,Clone)]
pub struct MixedLayer {
    pub wtheta: f64,
    pub wq: f64,
    pub advtheta: f64,
    pub advq: f64,
    pub gammatheta: f64,
    pub gammaq: f64,
    pub beta: f64,
    pub div_u: f64,
}

#[wasm_bindgen]
#[derive(Copy,Clone)]
pub struct CLASS {
    h: f64,
    theta: f64,
    dtheta: f64,
    q: f64,
    dq: f64,
    t: f64,
    cfg: Config,
}

// Core model

#[wasm_bindgen]
impl CLASS {
    #[wasm_bindgen(constructor)]
    pub fn new(cfg: Config) -> CLASS {
        CLASS {
            h: cfg.initial_state.h_0,
            theta: cfg.initial_state.theta_0,
            dtheta: cfg.initial_state.dtheta_0,
            q: cfg.initial_state.q_0,
            dq: cfg.initial_state.dq_0,
            t: 0.0,
            cfg,
        }
    }

    pub fn update(&mut self) {
        let dt = self.cfg.time_control.dt;
        self.h += dt * self.htend();
        self.theta += dt * self.thetatend();
        self.dtheta += dt * self.dthetatend();
        self.q += dt * self.qtend();
        self.dq += dt * self.dqtend();
        self.t += dt;
    }

    fn htend(&self) -> f64 {
        self.we() + self.ws()
    }

    fn thetatend(&self) -> f64 {
        (self.cfg.mixed_layer.wtheta - self.wthetae()) / self.h + self.cfg.mixed_layer.advtheta
    }

    fn dthetatend(&self) -> f64 {
        let w_th_ft = 0.0; // Placeholder for free troposphere switch
        self.cfg.mixed_layer.gammatheta * self.we() - self.thetatend() + w_th_ft
    }

    fn qtend(&self) -> f64 {
        (self.cfg.mixed_layer.wq - self.wqe()) / self.h + self.cfg.mixed_layer.advq
    }

    fn dqtend(&self) -> f64 {
        let w_q_ft = 0.0; // Placeholder for free troposphere switch
        self.cfg.mixed_layer.gammaq * self.we() - self.qtend() + w_q_ft
    }

    fn we(&self) -> f64 {
        let mut we = -self.wthetave() / self.dthetav();
        if we < 0.0 {
            we = 0.0;
        }
        we
    }

    fn ws(&self) -> f64 {
        -self.cfg.mixed_layer.div_u * self.h
    }

    fn wthetae(&self) -> f64 {
        -self.we() * self.dtheta
    }

    fn wqe(&self) -> f64 {
        -self.we() * self.dq
    }

    fn wthetave(&self) -> f64 {
        -self.cfg.mixed_layer.beta * self.wthetav()
    }

    fn dthetav(&self) -> f64 {
        (self.theta + self.dtheta) * (1.0 + 0.61 * (self.q + self.dq)) -
        self.theta * (1.0 + 0.61 * self.q)
    }

    fn wthetav(&self) -> f64 {
        self.cfg.mixed_layer.wtheta + 0.61 * self.theta * self.cfg.mixed_layer.wq
    }
}

// Basic model interface (light)

#[wasm_bindgen]
pub struct BmiClass {
    model: GenericOption<CLASS>,
    config: GenericOption<Config>,
}

#[wasm_bindgen]
impl BmiClass {
    #[wasm_bindgen(constructor)]
    pub fn new() -> BmiClass {
        BmiClass {
            // GenericOption allows us to use Option<T> as if it was T, without having to as_ref() or as_mut() everywhere
            model: GenericOption::new("Model not available - call initialize first".to_string()),
            config: GenericOption::new("Config not available - call initialize first".to_string()),
        }
    }

    pub fn initialize(&mut self, config: Config) {
        self.model.set(CLASS::new(config.clone()));
        self.config.set(config);
    }

    pub fn update(&mut self) {
        self.model.update();
    }

    pub fn get_component_name(&self) -> String {
        "Chemistry Land-surface Atmosphere Soil Slab model".to_string()
    }

    pub fn get_current_time(&self) -> f64 {
        self.model.t
    }

    pub fn get_end_time(&self) -> f64 {
        self.config.time_control.runtime
    }

    pub fn get_time_step(&self) -> f64 {
        self.config.time_control.dt
    }

    pub fn get_value(&self, variable: &str) -> f64 {
        // TODO: could use macros to reduce repetition and simulate dynamic access
        match variable {
            "t" => self.model.t,
            "h" => self.model.h,
            "theta" => self.model.theta,
            "dtheta" => self.model.dtheta,
            "q" => self.model.q,
            "dq" => self.model.dq,
            _ => panic!("Unknown variable: {}", variable),
        }
    }
}

// Note: run method should be implemented by client.
// Not so great alternatives:
//   - store all model state in default struct and expose that (no `variables` argument); but length of output is not known a priory
//   - store requested variables in hashmap and somehow pass that onto js (serde?)
