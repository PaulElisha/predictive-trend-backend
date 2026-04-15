/** @format */
import type { Express } from "express";

import express from "express";
import cors from "cors";
import morgan from "morgan";

import Db from "@config/db.config.js";
import Envconfig from "@/env.js";
import errorHandler from "@/src/shared/middleware/errorHandler.js";
import limiter from "@config/limiter.config.js";

import predictivRouter from "@module/predictiv/predictiv.route.js";
import HttpStatus from "@config/http.config.js";

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
    this.app.use(
      cors({
        origin: Envconfig.CORS_ORIGIN,
        credentials: true,
      }),
    );
    this.app.use(limiter);
    this.app.use(morgan("dev"));
  }

  async initializeDb() {
    await Db.connect();
  }

  initializeRoutes() {
    this.app.get("/", (_req, res) => {
      res.status(HttpStatus.OK).send("Welcome to The Predictiv Trend");
    });

    this.app.use("/api", predictivRouter);
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
