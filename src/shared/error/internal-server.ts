/** @format */

import AppError from "@error/app-error.js";
import HttpStatus from "@config/http.config.js";
import ErrorCode from "@enum/error-code.js";

import { ErrorCodeType, HttpStatusCodeType } from "@type/types.js";

export default class InternalServerError extends AppError {
  constructor(
    public message: string,
    public statusCode: HttpStatusCodeType,
    public errorCode?: ErrorCodeType,
  ) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, errorCode || ErrorCode.INTERNAL_SERVER_ERROR);
  }
}
