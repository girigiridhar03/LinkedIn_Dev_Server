import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  getConnections,
  sendConnection,
} from "../controller/connection.controller.js";

const connectionRouter = express.Router();

connectionRouter.get("/", authMiddleware, getConnections);
connectionRouter.post("/:receiverId", authMiddleware, sendConnection);

export default connectionRouter;
