/** @format */

import AppError from "@error/app-error.js";
import HttpStatus from "@/src/config/http.config.js";
import ErrorCode from "@enum/error-code.js";

import { HttpStatusCodeType, ErrorCodeType } from "@type/types.js";

export default class BadRequestExceptionError extends AppError {
  constructor(
    public message: string,
    public statusCode: HttpStatusCodeType,
    public errorCode?: ErrorCodeType,
  ) {
    super(message, HttpStatus.BAD_REQUEST, errorCode || ErrorCode.VALIDATION_ERROR);
  }
}
