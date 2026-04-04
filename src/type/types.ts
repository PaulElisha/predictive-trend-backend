/** @format */

import HttpStatus from "@config/http.config.js";
import ErrorCode from "../shared/enum/error-code";
import type { Request, Response, NextFunction } from "express";

export type EnvConfig = {
  PORT: string;
  HOST_NAME: string;
  MONGODB_URI: string;
  OPENAI_API_KEY: string;
  MISTRAL_AI_API_KEY: string;
  POLYGON_API_KEY: string;
  POLYGON_BASE_URL: string;
  POLYGON_WORKER_URL: string;
  OPENAI_WORKER_URL: string;
  MISTRAL_SERVER_URL: string;
  CORS_ORIGIN: string;
};

export type StockDataParam = {
  tickersArr: Array<string>;
  dates: {
    startDate: string;
    endDate: string;
  };
};

export type HttpStatusCodeType = (typeof HttpStatus)[keyof typeof HttpStatus];

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export type HandleAsyncControl<P = any, ResBody = any, ReqBody = any, ReqQuery = any> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response,
  next: NextFunction,
) => Promise<Response>;
