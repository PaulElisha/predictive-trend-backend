/** @format */

import type { EnvConfig } from "@type/types.js";

import dotenv from "dotenv";
dotenv.config();

const getEnvConfig = (): EnvConfig => {
  const getEnv = (key: string): string => process.env[key] ?? "";

  return {
    PORT: getEnv("PORT"),
    HOST_NAME: getEnv("HOST_NAME"),
    MONGODB_URI: getEnv("MONGODB_URI"),
    OPENAI_API_KEY: getEnv("OPENAI_API_KEY"),
    POLYGON_API_KEY: getEnv("POLYGON_API_KEY"),
    POLYGON_BASE_URL: getEnv("POLYGON_BASE_URL"),
    POLYGON_WORKER_URL: getEnv("POLYGON_WORKER_URL"),
    OPENAI_WORKER_URL: getEnv("OPENAI_WORKER_URL"),
    MISTRAL_SERVER_URL: getEnv("MISTRAL_SERVER_URL"),
    MISTRAL_AI_API_KEY: getEnv("MISTRAL_AI_API_KEY"),
    CORS_ORIGIN: getEnv("CORS_ORIGIN"),
  };
};

export default getEnvConfig();
