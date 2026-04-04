/** @format */

import cors from "cors";
import Envconfig from "@/env.js";

export default cors({ origin: Envconfig.CORS_ORIGIN || true, credentials: true });
