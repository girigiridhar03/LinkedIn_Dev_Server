import mongoose from "mongoose";
import { config } from "./env.config.js";

const dbConnection = async () => {
  try {
    await mongoose.connect(config.db_url);
    console.log("DB connected successfully");
  } catch (error) {
    console.log("DB connection failed", error);
    process.exit(1);
  }
};

export default dbConnection;
