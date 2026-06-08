/** @format */

import Envconfig from "@/env.js";
import cors from "cors";

export default cors({
 origin: Envconfig.CORS_ORIGIN || true,
 credentials: true,
});
