/** @format */

import axios from "axios";
import axiosRetry from "axios-retry";

export default () => {
 axiosRetry(axios, {
  retries: 1,
  retryDelay(retryCount, error) {
   return retryCount * 0;
  },
  shouldResetTimeout: true,
  retryCondition: (error) =>
   axiosRetry.isNetworkOrIdempotentRequestError(error),
 });
};
