/** @format */

import axios from "axios";
import FA from "fasy";

import HttpStatus from "@config/http.config.js";
import ErrorCode from "@enum/error-code.js";
import BadRequestExceptionError from "@error/bad-request.js";
import AppError from "@error/app-error.js";
import Envconfig from "@/env.js";
import Messages from "@util/Messages.js";

import type { StockDataParam } from "@type/types.js";

class PredictivService {
  public generateStockReport = async (param: StockDataParam): Promise<any> => {
    const { tickersArr, dates } = param;
    const startDate = dates.startDate;
    const endDate = dates.endDate;

    try {
      const awaitingReport = await FA.serial.pipe([
        async () => {
          return await FA.concurrent.map(async (ticker: string) => {
            const response = await axios.get(
              `${Envconfig.POLYGON_WORKER_URL}?ticker=${ticker}&startDate=${startDate}&endDate=${endDate}`,
            );

            if (!response.status) {
              throw new BadRequestExceptionError(
                "Polygon Worker: Worker Error",
                HttpStatus.BAD_REQUEST,
                ErrorCode.RESOURCE_NOT_FOUND,
              );
            }

            return <any>response.data;
          }, tickersArr);
        },
        async (stockData: any[]) => {
          console.log("Stock data", stockData);

          return await this.fetchReport(stockData);
        },
      ]);

      try {
        return await awaitingReport();
      } catch (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  };

  private fetchReport = async (stockData: any[]): Promise<any> => {
    try {
      const response = await axios.post(Envconfig.OPENAI_WORKER_URL, Messages(stockData), {
        headers: {
          "Content-Type": "application/json",
        },
        responseType: "stream",
      });

      if (response.status !== 200) {
        throw new BadRequestExceptionError(
          "Mistral Worker: Worker Error",
          HttpStatus.BAD_REQUEST,
          ErrorCode.RESOURCE_NOT_FOUND,
        );
      }
      console.log("Response data", response.data);
      return <any>response.data;
    } catch (error) {
      throw error;
    }
  };
}

export default new PredictivService();
