/** @format */

import { Router } from "express";
import PredictivController from "@module/predictiv/predictiv.controller.js";

class PredictivRoute {
  public router: Router;

  constructor() {
    this.router = Router();
    this.routes();
  }

  public routes(): void {
    this.router.post("/generate-stock-report", PredictivController.generateStockReport);
  }
}

const predictivRouter = new PredictivRoute().router;

export default predictivRouter;
