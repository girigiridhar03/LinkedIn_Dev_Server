import express from "express";
import cors from "cors";


const noCache = (req, res, next) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Surrogate-Control": "no-store",
  });
  next();
};
const allowedOrigin = ["http://localhost:5173"];
const app = express();

app.use(noCache);
app.use(express.json());
app.use(cookieParser())
app.use(
  cors({
    origin: function (origin, cb) {
      if (!origin || allowedOrigin.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error("Not allowed by cors"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

import userRouter from "./routes/user.routes.js";
app.use("/api", userRouter);

import { errorHandler } from "./utils/handlers.js";
import cookieParser from "cookie-parser";
app.use(errorHandler);
export default app;
