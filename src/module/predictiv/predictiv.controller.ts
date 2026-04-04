/** @format */

import { Readable, Transform } from "node:stream";

import HttpStatus from "@config/http.config.js";
import type { Request, Response } from "express";
import PredictivService from "@module/predictiv/predictiv.service.js";
import ErrorCode from "@enum/error-code.js";
import AppError from "@error/app-error.js";
import BadRequestExceptionError from "@error/bad-request.js";

class PredictivController {
  public generateStockReport = async (req: Request, res: Response): Promise<any> => {
    try {
      const { tickersArr, dates } = req.body;

      if (!Array.isArray(tickersArr) || tickersArr.length == 0) {
        throw new BadRequestExceptionError(
          "Validation error",
          HttpStatus.BAD_REQUEST,
          ErrorCode.VALIDATION_ERROR,
        );
      }

      const stream = await PredictivService.generateStockReport({
        tickersArr,
        dates,
      });

      if (!stream || typeof stream.pipe !== "function") {
        return res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: "Report stream not available" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.flushHeaders();

      stream.pipe(res);

      stream.on("error", (err: Error) => {
        console.error("Stream error:", err.message);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      });

      stream.on("end", () => {
        res.end();
      });

      req.on("close", () => {
        stream.destroy();
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error });
    }
  };
}

export default new PredictivController();
