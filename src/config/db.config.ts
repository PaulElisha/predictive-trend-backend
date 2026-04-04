/** @format */

import mongoose from "mongoose";
import Envconfig from "@config/env.config.js";

const mongoURI = Envconfig.MONGODB_URI;

class Db {
  private connectionPromise: Promise<typeof mongoose> | null = null;

  connect = async () => {
    if (!mongoURI) {
      throw new Error("MONGODB_URI is not defined");
    }

    if (mongoose.connection.readyState === 1) {
      return Promise.resolve(mongoose);
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    try {
      this.connectionPromise = mongoose.connect(mongoURI);
      return this.connectionPromise.finally(() => {
        this.connectionPromise = null;
      });
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      throw error;
    }
  };
}

export default new Db();
