import express from "express";
import { upload } from "../config/multer.config.js";
import { userLogin, userRegistration } from "../controller/user.controller.js";

const userRouter = express.Router();

userRouter.post(
  "/auth/register",
  upload.single("profileImage"),
  userRegistration,
);
userRouter.post("/auth/login", userLogin);

export default userRouter;
