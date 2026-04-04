/** @format */

import type { NextFunction, Request, Response } from "express";
import type { HandleAsyncControl } from "@type/types.js";

const handleAsyncControl =
  <P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
    controller: HandleAsyncControl<P, ResBody, ReqBody, ReqQuery>,
  ) =>
  async (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response, next: NextFunction) => {
    try {
      return await controller(req, res, next);
    } catch (error) {
      next(error);
    }
  };

export default handleAsyncControl;
