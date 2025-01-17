import type { Config } from "@classmodel/class/config";
import type { PartialConfig } from "@classmodel/class/config_utils";

/**
 * An experiment configuration is a combination of a reference configuration and a set of permutation configurations.
 */
export interface ExperimentConfig<C = Config> {
  preset: string;
  reference: C;
  permutations: C[];
}

/**
 * A partial experiment configuration used for input and output.
 *
 * Parameters in permutation which are same as in reference or preset are absent.
 * Parameters in reference which are same as in preset are absent.
 */
export type PartialExperimentConfig = ExperimentConfig<PartialConfig>;
