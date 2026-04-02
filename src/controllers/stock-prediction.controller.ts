/** @format */

import { HTTP_STATUS } from "../config/http.config.js";
import { Request, Response } from "express";
import {
  StockPredictionService,
  StockPredictionServiceInstance,
} from "../services/stock-prediction.service.js";
import { ErrorCode } from "../enums/error-code.enum.js";
import { AppError } from "../errors/app.error.js";
import { BadRequestExceptionError } from "../errors/bad-request.error.js";

class StockPredictionController {
  private stockPredictionService: StockPredictionServiceInstance;
  constructor() {
    this.stockPredictionService = new StockPredictionService();
  }

  public generateStockReport = async (req: Request, res: Response): Promise<any> => {
    try {
      const { tickersArr, dates } = req.body;

      if (!Array.isArray(tickersArr) || tickersArr.length == 0) {
        throw new BadRequestExceptionError(
          "Validation error",
          HTTP_STATUS.BAD_REQUEST,
          ErrorCode.VALIDATION_ERROR,
        );
      }

      const reportData = await this.stockPredictionService.generateStockReport({
        tickersArr,
        dates,
      });

      if (!reportData) {
        throw new BadRequestExceptionError(
          "Report data not found",
          HTTP_STATUS.NOT_FOUND,
          ErrorCode.RESOURCE_NOT_FOUND,
        );
      }
      console.log("Report data", JSON.stringify(reportData, null, 2));

      return res
        .status(HTTP_STATUS.OK)
        .json({ message: "Stock Report fetched successfully", reportData });
    } catch (error) {
      if (error instanceof AppError) {
        console.log(`${error.message}`);
        return res.status(error.statusCode).json({ message: error.message });
      }

      if (error instanceof Error) {
        console.log(`${error.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
      }

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error });
    }
  };
}

export type StockPredictionControllerInstance = StockPredictionController;
export { StockPredictionController };
