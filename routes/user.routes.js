import express from "express";
import { upload } from "../config/multer.config.js";
import {
  addEducation,
  addExperience,
  me,
  userLogin,
  userRegistration,
} from "../controller/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const userRouter = express.Router();

userRouter.post(
  "/auth/register",
  upload.single("profileImage"),
  userRegistration,
);
userRouter.post("/auth/login", userLogin);
userRouter.post("/user/education", authMiddleware, addEducation);
userRouter.post("/user/experience", authMiddleware, addExperience);
userRouter.get("/user/me", authMiddleware, me);

export default userRouter;
