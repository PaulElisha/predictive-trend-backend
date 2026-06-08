/** @format */

import PredictivController from "@module/predictiv/predictiv.controller.js";
import { Router } from "express";

class PredictivRoute {
 public router: Router;

 constructor() {
  this.router = Router();
  this.routes();
 }

 private routes(): void {
  this.router.post(
   "/generate-stock-report",
   PredictivController.generateStockReport,
  );
 }
}

export default new PredictivRoute();
