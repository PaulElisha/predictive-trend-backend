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
  public generateStockReport = async (param: StockDataParam): Result<any, any> => {
    const { tickersArr, dates, signal } = param;
    const startDate = dates.startDate;
    const endDate = dates.endDate;

    axiosRetry(axios, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => axiosRetry.isNetworkOrIdempotentRequestError(error),
    });

    const awaitingReport = await FA.serial.pipe([
      async () => {
        return await FA.concurrent.map(async (ticker: string) => {
          /*
            let attempts = 0;
            const maxAttempts = 3;
            while (attempts < maxAttempts) {
              try {
                const response = await axios.get(
                  `${Envconfig.POLYGON_WORKER_URL}?ticker=${ticker}&startDate=${startDate}&endDate=${endDate}`,
                  { timeout: 5000 }
                );

                if (!response.status) {
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
              } catch (error) {
                attempts++;
                if (attempts === maxAttempts) {
                  return [
                    null,
                    new BadRequestExceptionError(
                      "Polygon Worker: Connection Error",
                      HttpStatus.SERVICE_UNAVAILABLE,
                      ErrorCode.INTERNAL_SERVER_ERROR,
                    ),
                  ];
                }
                await new Promise((res) => setTimeout(res, attempts * 1000));
              }
            }
            */
          const response = await axios.get(
            `${Envconfig.POLYGON_WORKER_URL}?ticker=${ticker}&startDate=${startDate}&endDate=${endDate}`,
            { timeout: 5000 },
          );

          if (!response || !response.status) {
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
