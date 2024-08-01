import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

// TODO: alternatively, we could use JsonSchemaToZod so the JSON schema is
// leading.

const initialState = z
	.object({
		h_0: z.coerce.number().default(200).describe("Initial ABL height [m]"),
		theta_0: z.coerce
			.number()
			.default(288)
			.describe("Initial mixed-layer potential temperature [K]"),
		dtheta_0: z.coerce
			.number()
			.default(1)
			.describe("Initial temperature jump at h [K]"),
		q_0: z.coerce
			.number()
			.default(0.008)
			.describe("Initial mixed-layer specific humidity [kg kg-1]"),
		dq_0: z.coerce
			.number()
			.default(-0.001)
			.describe("Initial specific humidity jump at h [kg kg-1]"),
	})
	.describe("Initial State");

const timeControl = z
	.object({
		// TODO: alteratively use start and end time, more consistent with BMI
		dt: z.coerce.number().default(60).describe("Time step [s]"),
		runtime: z.coerce
			.number()
			.default(12 * 3600)
			.describe("Total run time [s]"),
	})
	.describe("Time control");

const mixedLayer = z
	.object({
		// TODO: can we automatically coerce everthing?
		wtheta: z.coerce
			.number()
			.default(0.1)
			.describe("Surface kinematic heat flux [K m s-1]"),
		advtheta: z.coerce
			.number()
			.default(0)
			.describe("Advection of heat [K s-1]"),
		gammatheta: z.coerce
			.number()
			.default(0.006)
			.describe("Free atmosphere potential temperature lapse rate [K m-1]"),
		wq: z.coerce
			.number()
			.default(0.1e-3)
			.describe("Surface kinematic moisture flux [kg kg-1 m s-1]"),
		advq: z.coerce
			.number()
			.default(0)
			.describe("Advection of moisture [kg kg-1 s-1]"),
		gammaq: z.coerce
			.number()
			.default(0)
			.describe("Free atmosphere specific humidity lapse rate [kg kg-1 m-1]"),
		divU: z.coerce
			.number()
			.default(0)
			.describe("Horizontal large-scale divergence of wind [s-1]"),
		beta: z.coerce
			.number()
			.default(0.2)
			.describe("Entrainment ratio for virtual heat [-]"),
	})
	.describe("Mixed layer");

const radiation = z
	.object({
		dFz: z.coerce
			.number()
			.default(0)
			.describe("Cloud top radiative divergence [W m-2]"),
	})
	.describe("Radiation");

export const classConfig = z.object({
	initialState: initialState.default({}),
	timeControl: timeControl.default({}),
	mixedLayer: mixedLayer.default({}),
	radiation: radiation.default({}),
});

export type ClassConfig = z.infer<typeof classConfig>;
export const classDefaultConfigSchema = zodToJsonSchema(
	classConfig,
	"classConfig",
);
