import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";
import { config } from "../config/env.config.js";

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return next(new AppError("Token is required", 401));
    }

    const decoded = jwt.verify(token, config.jwt_secret);

    req.user = decoded;

    next();
  } catch (error) {
    console.log("Auth Middleware Error:", error.message);

    return next(new AppError("Unauthorized", 401));
  }
};
