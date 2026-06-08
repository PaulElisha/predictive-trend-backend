/** @format */

import type { NextFunction, Request, Response } from "express";
import type { AsyncHandler } from "@type/types.js";

const asyncHandler =
  <P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
    controller: AsyncHandler<P, ResBody, ReqBody, ReqQuery>,
  ) =>
  (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response, next: NextFunction) => {
    Promise.resolve(controller(req, res, next)).catch(next);
  };

export default asyncHandler;
