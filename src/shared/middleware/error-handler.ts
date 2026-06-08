/** @format */

import type { NextFunction, Request, Response } from "express";
import AppError from "../error/app-error.js";

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log("Error", err);
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      error: err.errorCode,
      status: "error",
    });
  }

  if (err instanceof Error) {
    return res.status(500).json({
      message: "Internal Server error",
      error: err.message || "Unknown error occurred",
      status: "error",
    });
  }
};

export default errorHandler;
