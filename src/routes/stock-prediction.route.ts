/** @format */

import { Router } from "express";
import {
  StockPredictionController,
  StockPredictionControllerInstance,
} from "../controllers/stock-prediction.controller.js";

class StockPredictionRoute {
  private stockPredictionController: StockPredictionControllerInstance;
  public router: Router;

  constructor() {
    this.router = Router();
    this.stockPredictionController = new StockPredictionController();
    this.routes();
  }

  public routes(): void {
    this.router.post("/", this.stockPredictionController.generateStockReport);
  }
}

export const stockPredictionRouter = new StockPredictionRoute().router;
