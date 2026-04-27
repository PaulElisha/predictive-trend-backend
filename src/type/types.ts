/** @format */

import HttpStatus from "@/src/config/http.config.js";
import ErrorCode from "@/src/shared/enum/error-code.js";
import type { Request, Response, NextFunction } from "express";

export type Result<T, U> = Promise<[T | null, null | U]>;

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
  signal?: AbortSignal;
};

export type HttpStatusCodeType = (typeof HttpStatus)[keyof typeof HttpStatus];

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export type HandleAsyncControl<P = any, ResBody = any, ReqBody = any, ReqQuery = any> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response,
  next: NextFunction,
) => Promise<Response>;
