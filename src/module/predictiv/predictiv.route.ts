/** @format */

import { Router } from "express";
import PredictivController from "@module/predictiv/predictiv.controller.js";

class PredictivRoute {
  public router: Router;

  constructor() {
    this.router = Router();
    this.routes();
  }

  private routes(): void {
    this.router.post("/generate-stock-report", PredictivController.generateStockReport);
  }
}

export default new PredictivRoute();
