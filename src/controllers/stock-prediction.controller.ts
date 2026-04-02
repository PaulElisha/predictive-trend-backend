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

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.flushHeaders();

      const stream = await this.stockPredictionService.generateStockReport({
        tickersArr,
        dates,
      });

      if (!stream || typeof stream.pipe !== "function") {
        res.write("event: error\ndata: Report stream not available\n\n");
        return res.end();
      }

      stream.pipe(res);

      stream.on("error", (err: Error) => {
        console.error("Stream error:", err.message);
        res.write(`event: error\ndata: ${err.message}\n\n`);
        res.end();
      });

      stream.on("end", () => {
        res.end();
      });

      req.on("close", () => {
        stream.destroy();
      });
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
