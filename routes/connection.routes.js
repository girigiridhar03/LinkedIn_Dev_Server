import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  actionConnection,
  getConnections,
  removeConnection,
  sendConnection,
} from "../controller/connection.controller.js";

const connectionRouter = express.Router();

connectionRouter.get("/", authMiddleware, getConnections);
connectionRouter.post("/:receiverId", authMiddleware, sendConnection);
connectionRouter.patch("/:connectionId", authMiddleware, actionConnection);
connectionRouter.delete("/:connectionId", authMiddleware, removeConnection);

export default connectionRouter;
