import { uploadBufferToCloudinary } from "../config/cloudinary.config.js";
import User from "../models/user.model.js";
import { AppError } from "../utils/AppError.js";
import bcrypt from "bcrypt";
import { setAuthCookies } from "../utils/cookies.js";
import jwt from "jsonwebtoken";
import { config } from "../config/env.config.js";
import Education from "../models/education.model.js";
import Experience from "../models/experience.model.js";

export const userRegistrationService = async (req) => {
  if (!req.body) {
    throw new AppError("Body is empty", 400);
  }
  const { name, email, password } = req.body;

  const requiredFields = ["name", "email", "password"];

  for (let field of requiredFields) {
    if (!req.body[field] || !req.body[field].toString().trim()) {
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
  if (!req.body) {
    throw new AppError("Body is empty", 400);
  }
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

export const meService = async (req) => {
  const userId = req.user.id;

  const user = await User.findById(userId)
    .select("-password -updatedAt")
    .lean();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const education = await Education.find({ user: userId })
    .select("-user -createdAt -updatedAt")
    .lean();
  const experience = await Experience.find({ user: userId })
    .select("-user -createdAt -updatedAt")
    .lean();

  return {
    status: 200,
    message: "User Fetched Successfully",
    data: {
      user,
      education,
      experience,
    },
  };
};

export const addEducationService = async (req) => {
  if (!req.body) {
    throw new AppError("Body is empty", 400);
  }
  const userId = req.user.id;
  let {
    school,
    degree,
    startDate,
    endDate,
    grade,
    activitiesNsocieties,
    description,
    isCurrent,
    skills,
  } = req.body;

  isCurrent = isCurrent ?? false;

  if (!school || !school.toString().trim()) {
    throw new AppError("School is required", 400);
  }

  if (!startDate) {
    throw new AppError("Start date is required", 400);
  }

  const isObject = (value) =>
    typeof value === "object" && value !== null && !Array.isArray(value);

  if (!isObject(startDate)) {
    throw new AppError("Start Date must be an object", 400);
  }

  const startMonth = Number(startDate.month);
  const startYear = Number(startDate.year);

  if (
    !startDate.month ||
    !startDate.year ||
    Number.isNaN(startMonth) ||
    Number.isNaN(startYear)
  ) {
    throw new AppError("Invalid start date", 400);
  }

  if (startMonth < 1 || startMonth > 12) {
    throw new AppError("Start month must be between 1 and 12", 400);
  }

  let endMonth, endYear;

  if (isCurrent) {
    endDate = null;
  } else {
    if (!endDate) {
      throw new AppError("End date is required if not currently studying", 400);
    }

    if (!isObject(endDate)) {
      throw new AppError("End date must be an object", 400);
    }

    endMonth = Number(endDate.month);
    endYear = Number(endDate.year);

    if (
      !endDate.month ||
      !endDate.year ||
      Number.isNaN(endMonth) ||
      Number.isNaN(endYear)
    ) {
      throw new AppError("Invalid end date", 400);
    }

    if (endMonth < 1 || endMonth > 12) {
      throw new AppError("End month must be between 1 and 12", 400);
    }
    if (
      startYear > endYear ||
      (startYear === endYear && startMonth > endMonth)
    ) {
      throw new AppError("Start date cannot be after end date", 400);
    }
  }

  if (activitiesNsocieties && !Array.isArray(activitiesNsocieties)) {
    throw new AppError("activitiesNsocieties need to be an array", 400);
  }

  if (skills && !Array.isArray(skills)) {
    throw new AppError("skills need to be an array", 400);
  }

  const newEducation = await Education.create({
    user: userId,
    school,
    degree,
    startDate,
    endDate: isCurrent
      ? null
      : {
          month: endMonth,
          year: endYear,
        },
    grade,
    activitiesNsocieties,
    description,
    isCurrent,
    skills,
  });

  return {
    status: 201,
    message: "education added successfully",
    data: newEducation,
  };
};
