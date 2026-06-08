/** @format */

import Envconfig from "@/env.js";
import HttpStatus from "@/src/config/http.config.js";
import ErrorCode from "@/src/shared/enum/error-code.js";
import AppError from "@/src/shared/error/app-error";
import BadRequestExceptionError from "@/src/shared/error/bad-request.js";
import Messages from "@/src/shared/util/Messages.js";
import { Result, StockDataParam } from "@type/types.js";
import axios from "axios";
import axiosRetry from "axios-retry";
import FA from "fasy";
import { z } from "zod";

class PredictivService {
 constructor() {
  axiosRetry(axios, {
   retries: 1,
   retryDelay: (retryCount) => {
    return retryCount * 500;
   },
   retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error),
  });
 }

 public generateStockReport = async (
  param: z.infer<typeof StockDataParam>,
 ): Result<any, AppError> => {
  const body = StockDataParam.safeParse(param);
  if (!body.success) {
   return [
    null,
    new BadRequestExceptionError(
     "Validation error: " + body.error.message,
     HttpStatus.BAD_REQUEST,
     ErrorCode.VALIDATION_ERROR,
    ),
   ];
  }
  const { tickersArr, dates, signal } = body.data;
  const startDate = dates.startDate;
  const endDate = dates.endDate;

  const awaitingReport = await FA.serial.pipe([
   async () => {
    return await FA.concurrent.map(async (ticker: string) => {
     try {
      const response = await axios.get(
       `${Envconfig.POLYGON_WORKER_URL}?ticker=${ticker}&startDate=${startDate}&endDate=${endDate}`,
       { timeout: 500 },
      );

      if (!response || response.status >= 400) {
       return [
        null,
        new BadRequestExceptionError(
         "Polygon Worker: Worker Error",
         HttpStatus.BAD_REQUEST,
         ErrorCode.RESOURCE_NOT_FOUND,
        ),
       ];
      }

      return <any>response.data;
     } catch (error: any) {
      return [
       null,
       new BadRequestExceptionError(
        "Polygon Worker: Worker Error",
        HttpStatus.BAD_REQUEST,
        ErrorCode.RESOURCE_NOT_FOUND,
       ),
      ];
     }
    }, tickersArr);
   },
   async (stockData: any[]) => {
    console.log("Stock data", stockData);

    const [data, error] = await this.fetchReport(stockData, signal);

    if (error) return [null, error];

    return [data, null];
   },
  ]);

  const [data, error] = await awaitingReport();

  if (error) return [null, error];
  return [data, null];
 };

 private fetchReport = async (
  stockData: any[],
  signal?: AbortSignal,
 ): Result<any, AppError> => {
  const fetchConfig = {
   headers: {
    "Content-Type": "application/json",
   },
   responseType: "stream" as const,
   signal: signal,
  };

  const response = await axios.post(
   Envconfig.OPENAI_WORKER_URL,
   Messages(stockData),
   fetchConfig,
  );

  if (response.status !== 200) {
   return [
    null,
    new BadRequestExceptionError(
     "Mistral Worker: Worker Error",
     HttpStatus.BAD_REQUEST,
     ErrorCode.RESOURCE_NOT_FOUND,
    ),
   ];
  }
  console.log("Response data", response.data);
  return [response.data, null];
 };
}

export default new PredictivService();
