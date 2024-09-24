import Ajv from "ajv";

import schema from "./config.json"
import type { Config } from "./config";

const ajv = new Ajv()

export const validate = ajv.compile<Config>(schema)
