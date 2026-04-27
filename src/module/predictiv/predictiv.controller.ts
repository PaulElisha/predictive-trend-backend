/** @format */

import HttpStatus from "@/src/config/http.config.js";
import type { NextFunction, Request, Response } from "express";
import PredictivService from "@module/predictiv/predictiv.service.js";
import ErrorCode from "@/src/shared/enum/error-code.js";
import BadRequestExceptionError from "@/src/shared/error/bad-request.js";
import handleAsyncControl from "@/src/shared/middleware/handleAsyncControl";

class PredictivController {
  public generateStockReport = handleAsyncControl(
    async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      const { tickersArr, dates } = req.body;

      if (!Array.isArray(tickersArr) || tickersArr.length === 0) {
        return next(
          new BadRequestExceptionError(
            "Validation error: tickersArr must be a non-empty array",
            HttpStatus.BAD_REQUEST,
            ErrorCode.VALIDATION_ERROR,
          ),
        );
      }

      const abortController = new AbortController();

      const [stream, error] = await PredictivService.generateStockReport({
        tickersArr,
        dates,
        signal: abortController.signal,
      });

      if (error) return next(error);

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
        if (!res.headersSent) {
          res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        }
        res.end();
      });

      req.on("close", () => {
        abortController.abort();
        stream.destroy();
      });
    },
  );
}

export default new PredictivController();
