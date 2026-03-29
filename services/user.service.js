import { uploadBufferToCloudinary } from "../config/cloudinary.config.js";
import User from "../models/user.model.js";
import { AppError } from "../utils/AppError.js";
import bcrypt from "bcrypt";
import { setAuthCookies } from "../utils/cookies.js";
import jwt from "jsonwebtoken";
import { config } from "../config/env.config.js";

export const userRegistrationService = async (req) => {
  const { name, email, password } = req.body;

  const requiredFields = ["name", "email", "password"];

  for (let field of requiredFields) {
    if (!req.body[field]?.toString().trim()) {
      throw new AppError(`${field} is required`, 400);
    }
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError("User already exist with same email", 400);
  }

  let uploadedFile = null;
  if (req.file) {
    uploadedFile = await uploadBufferToCloudinary(req.file);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    ...(uploadedFile
      ? {
          profileImage: {
            url: uploadedFile.secure_url,
            publicId: uploadedFile.public_id,
          },
        }
      : {}),
  });

  return {
    status: 201,
    message: "User registerated successfully",
    data: {
      name: newUser.name,
      email: newUser.email,
      _id: newUser._id,
    },
  };
};

export const userLoginService = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !email.trim()) {
    throw new AppError("Email is required", 400);
  }
  if (!password || !password.trim()) {
    throw new AppError("Password is required", 400);
  }

  const userExist = await User.findOne({ email });

  if (!userExist) {
    throw new AppError("Invalid email or password", 400);
  }

  const isPassword = await bcrypt.compare(password, userExist.password);

  if (!isPassword) {
    throw new AppError("Invalid email or password", 400);
  }

  const token = jwt.sign(
    { id: userExist._id, name: userExist.name },
    config.jwt_secret,
    { expiresIn: "1d" },
  );

  setAuthCookies(res, token);

  return {
    status: 200,
    message: "User logged in successfully",
    data: {
      name: userExist.name,
      email: userExist.email,
      _id: userExist._id,
    },
  };
};
