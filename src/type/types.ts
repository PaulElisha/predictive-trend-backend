/** @format */

import HttpStatus from "@/src/config/http.config.js";
import ErrorCode from "@/src/shared/enum/error-code.js";
import type { NextFunction, Request, Response } from "express";
import z from "zod";

import AppError from "../shared/error/app-error";

export type Result<T, U extends AppError> = Promise<[T | null, null | U]>;

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

export const StockDataParam = z.object({
 tickersArr: z.array(z.string()),
 dates: z.object({
  startDate: z.string(),
  endDate: z.string(),
 }),
 signal: z.instanceof(AbortSignal).optional(),
});

export type HttpStatusCodeType = (typeof HttpStatus)[keyof typeof HttpStatus];

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export type AsyncHandler<
 P = any,
 ResBody = any,
 ReqBody = any,
 ReqQuery = any,
> = (
 req: Request<P, ResBody, ReqBody, ReqQuery>,
 res: Response,
 next: NextFunction,
) => Promise<Response>;
