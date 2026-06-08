/** @format */

import HttpStatus from "@/src/config/http.config.js";
import type { NextFunction, Request, Response } from "express";
import PredictivService from "@module/predictiv/predictiv.service.js";
import ErrorCode from "@/src/shared/enum/error-code.js";
import BadRequestExceptionError from "@/src/shared/error/bad-request.js";
import asyncHandler from "@/src/shared/middleware/async-handler";
import { createSession } from "better-sse";

class PredictivController {
 public generateStockReport = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
   const { tickersArr, dates } = req.body;

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

   const session = await createSession(req, res);

   stream.pipe(res);

   stream.on("error", (err: Error) => {
    console.error("Stream error:", err.message);
    if (!res.headersSent) {
     session.push(`data: ${JSON.stringify({ error: err.message })}\n\n`);
     res.end();
    }
   });

   session.on("disconnected", () => {
    abortController.abort();
    stream.destroy();
    res.end();
   });

   req.on("close", () => {
    abortController.abort();
    stream.destroy();
    res.end();
   });
  },
 );
}

export default new PredictivController();
