/** @format */

import axios from "axios";
import axiosRetry from "axios-retry";
import FA from "fasy";

import HttpStatus from "@config/http.config.js";
import ErrorCode from "@/src/shared/enum/error-code.js";
import BadRequestExceptionError from "@/src/shared/error/bad-request.js";
import Envconfig from "@/env.js";
import Messages from "@/src/shared/util/Messages.js";

import type { StockDataParam, Result } from "@type/types.js";
import AppError from "@/src/shared/error/app-error";

class PredictivService {
  constructor() {
    axiosRetry(axios, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => axiosRetry.isNetworkOrIdempotentRequestError(error),
    });
  }

  public generateStockReport = async (param: StockDataParam): Result<any, any> => {
    const { tickersArr, dates, signal } = param;
    const startDate = dates.startDate;
    const endDate = dates.endDate;

    const awaitingReport = await FA.serial.pipe([
      async () => {
        return await FA.serial.map(async (ticker: string) => {
          try {
            const response = await axios.get(
              `${Envconfig.POLYGON_WORKER_URL}?ticker=${ticker}&startDate=${startDate}&endDate=${endDate}`,
              { timeout: 5000 },
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
            console.error(`Failed to fetch data for ticker ${ticker}:`, error.message);
            return { ticker, error: true };
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

  private fetchReport = async (stockData: any[], signal?: AbortSignal): Result<any, any> => {
    const fetchConfig = {
      headers: {
        "Content-Type": "application/json",
      },
      responseType: "stream" as const,
      timeout: 1000000,
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
