/** @format */
import Envconfig from "@/env.js";
import cors from "@/src/config/cors.config.js";
import HttpStatus from "@/src/config/http.config.js";
import limiter from "@/src/config/limiter.config.js";
import errorHandler from "@/src/shared/middleware/error-handler.js";
import Db from "@config/db.config.js";
import PredictivRoute from "@module/predictiv/predictiv.route.js";
import type { Express } from "express";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

class App {
 public app: Express;

 constructor() {
  this.app = express();
  this.app.disable("x-powered-by");
  this.app.set("trust proxy", 1);
  this.initializeMiddleware();
  this.initializeRoutes();
 }

 initializeMiddleware() {
  this.app.use(express.json());
  this.app.use(express.urlencoded({ extended: true }));
  this.app.use(cors);
  this.app.use(limiter);
  this.app.use(helmet());
  this.app.use(morgan("dev"));
 }

 async initializeDb() {
  await Db.connect();
 }

 initializeRoutes() {
  this.app.get("/", (_req, res) => {
   res.status(HttpStatus.OK).send("Welcome to The Predictiv Trend");
  });

  this.app.use("/api", PredictivRoute.router);
  this.app.use(errorHandler);
 }

 async startServer() {
  await this.initializeDb();
  this.app.listen(Envconfig.PORT, () => {
   console.log(
    `Server is running on port ${Envconfig.PORT} at ${Envconfig.HOST_NAME}:${Envconfig.PORT}`,
   );
  });
 }
}

const appInstance = new App();
const app = appInstance.app;

// Start server
appInstance.startServer();

export default app;
export { app };
