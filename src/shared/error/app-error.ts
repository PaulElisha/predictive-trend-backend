/** @format */

import { HttpStatusCodeType, ErrorCodeType } from "@type/types.js";

export default class AppError extends Error {
  public message: string;
  public statusCode: HttpStatusCodeType;
  public errorCode?: ErrorCodeType;

  constructor(message: string, statusCode: HttpStatusCodeType, errorCode?: ErrorCodeType) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
