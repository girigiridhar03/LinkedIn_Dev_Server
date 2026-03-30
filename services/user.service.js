import {
  deleteFileFromCloudinary,
  uploadBufferToCloudinary,
} from "../config/cloudinary.config.js";
import User from "../models/user.model.js";
import { AppError } from "../utils/AppError.js";
import bcrypt from "bcrypt";
import { setAuthCookies } from "../utils/cookies.js";
import jwt from "jsonwebtoken";
import { config } from "../config/env.config.js";
import Education from "../models/education.model.js";
import Experience from "../models/experience.model.js";
import slugify from "slugify";

export const userRegistrationService = async (req, res) => {
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

  const baseSlug = slugify(name, {
    lower: true,
    strict: true,
  });

  const uniqueSlug = `${baseSlug}-${Date.now()}`;

  const newUser = await User.create({
    name,
    slug: uniqueSlug,
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

  const token = jwt.sign(
    { id: newUser._id, name: newUser.name, slug: newUser.slug },
    config.jwt_secret,
    { expiresIn: "1d" },
  );

  setAuthCookies(res, token);

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
    { id: userExist._id, name: userExist.name, slug: userExist.slug },
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
    .sort({ isCurrent: -1, createdAt: -1, year: -1, month: 1 })
    .select("-user -createdAt -updatedAt")
    .lean();

  const educationgrouped = education.reduce((acc, curr) => {
    const school = curr.school;

    if (!acc[school]) {
      acc[school] = [];
    }

    acc[school].push(curr);

    return acc;
  }, {});

  const educationresult = Object.entries(educationgrouped).map(
    ([school, education]) => ({
      school,
      education,
    }),
  );

  const experience = await Experience.find({ user: userId })
    .sort({ isCurrent: -1, createdAt: -1, year: -1, month: 1 })
    .select("-user -createdAt -updatedAt")
    .lean();

  const experiencegrouped = experience.reduce((acc, curr) => {
    const company = curr.companyOrOrganization;

    if (!acc[company]) {
      acc[company] = [];
    }

    acc[company].push(curr);

    return acc;
  }, {});

  const experienceresult = Object.entries(experiencegrouped).map(
    ([company, experience]) => ({
      company,
      experience,
    }),
  );

  return {
    status: 200,
    message: "User Fetched Successfully",
    data: {
      user,
      educations: educationresult,
      experiences: experienceresult,
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
    if (endDate) {
      throw new AppError(
        "End date should not be provided if currently working",
        400,
      );
    }
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
    startDate: {
      month: startMonth,
      year: startYear,
    },
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

export const addExperienceService = async (req) => {
  if (!req.body) {
    throw new AppError("Body is empty", 400);
  }

  const userId = req.user.id;

  let {
    title,
    employmentType,
    companyOrOrganization,
    isCurrent,
    startDate,
    endDate,
    location,
    locationType,
    description,
    profileHeading,
    skills,
  } = req.body;

  isCurrent = isCurrent ?? false;

  if (!title || !title.toString().trim()) {
    throw new AppError("title is required", 400);
  }
  if (!employmentType || !employmentType.toString().trim()) {
    throw new AppError("Employment type is required", 400);
  }
  if (!companyOrOrganization || !companyOrOrganization.toString().trim()) {
    throw new AppError("Company/Organization is required", 400);
  }

  if (!startDate) {
    throw new AppError("StartDate is required", 400);
  }

  const isObject = (value) => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  };

  if (!isObject(startDate)) {
    throw new AppError("Start Data must be an object", 400);
  }

  const startMonth = Number(startDate.month);
  const startYear = Number(startDate.year);

  if (
    !startDate.month ||
    !startDate.year ||
    Number.isNaN(startMonth) ||
    Number.isNaN(startYear)
  ) {
    throw new AppError("Start Date is invalid", 400);
  }

  if (startMonth < 1 || startMonth > 12) {
    throw new AppError("startmonth must be between 1 to 12", 400);
  }

  let endMonth, endYear;

  if (isCurrent) {
    if (endDate) {
      throw new AppError(
        "End date should not be provided if currently working",
        400,
      );
    }
    endDate = null;
  } else {
    if (!endDate) {
      throw new AppError("EndDate is required", 400);
    }
    if (!isObject(endDate)) {
      throw new AppError("End Date must be an object", 400);
    }

    endMonth = Number(endDate.month);
    endYear = Number(endDate.year);

    if (
      !endDate.month ||
      !endDate.year ||
      Number.isNaN(endMonth) ||
      Number.isNaN(endYear)
    ) {
      throw new AppError("End Date is invalid", 400);
    }

    if (endMonth < 1 || endMonth > 12) {
      throw new AppError("EndMonth must be between 1 to 12", 400);
    }

    if (
      startYear > endYear ||
      (startYear === endYear && startMonth > endMonth)
    ) {
      throw new AppError("Start date cannot be after end date", 400);
    }
  }

  if (!location || !location.toString().trim()) {
    throw new AppError("Location is required", 400);
  }
  if (!locationType || !locationType.toString().trim()) {
    throw new AppError("Location is required", 400);
  }

  if (skills && !Array.isArray(skills)) {
    throw new AppError("skills need to be an array", 400);
  }

  const newExperience = await Experience.create({
    user: userId,
    title,
    employmentType,
    companyOrOrganization,
    isCurrent,
    startDate: {
      month: startMonth,
      year: startYear,
    },
    endDate: isCurrent
      ? null
      : {
          month: endMonth,
          year: endYear,
        },
    location,
    locationType,
    description,
    profileHeading,
    skills,
  });

  return {
    status: 201,
    message: "Experience added successfully",
    data: newExperience,
  };
};

export const getEducationSchoolService = async (req) => {
  const filter = req?.query?.search
    ? { school: { $regex: req?.query?.search, $options: "i" } }
    : {};

  const schools = await Education.distinct("school", filter);

  return {
    status: 200,
    message: "school names fetched successfully",
    data: schools,
  };
};

export const getCompanyOrOrganizationService = async (req) => {
  const filter = req?.query?.search
    ? { school: { $regex: req?.query?.search, $options: "i" } }
    : {};

  const compaines = await Experience.distinct("companyOrOrganization", filter);

  return {
    status: 200,
    message: "Company/Organization names fetched successfully",
    data: compaines,
  };
};

export const editUserDetailsService = async (req) => {
  const userId = req.user.id;
  const data = req.body;
  const updatedData = await User.findById(userId).select(
    "-password -createdAt -updatedAt",
  );

  if (!data) {
    throw new AppError("Body is empty", 400);
  }

  if (data?.name?.trim() && data?.nam !== updatedData.name) {
    updatedData.name = data.name;
    const baseSlug = slugify(data.name, {
      lower: true,
      strict: true,
    });

    const uniqueSlug = `${baseSlug}-${Date.now()}`;

    updatedData.slug = uniqueSlug;
  }

  if (
    data?.phoneNumber?.trim() &&
    data?.phoneNumber !== updatedData.phoneNumber
  ) {
    updatedData.phoneNumber = data.phoneNumber;
  }

  if (data?.address && data?.address !== updatedData.address) {
    updatedData.address = data.address;
  }

  if (data?.dob && typeof data.dob === "object") {
    if (!updatedData.dob) updatedData.dob = {};

    if (data.dob?.month) updatedData.dob.month = data.dob.month;
    if (data.dob?.year) updatedData.dob.year = data.dob.year;
  }

  if (data?.bio?.trim() && data?.bio !== updatedData.bio) {
    updatedData.bio = data.bio;
  }

  if (req.files?.profileImage) {
    if (updatedData.profileImage.publicId) {
      await deleteFileFromCloudinary(updatedData.profileImage.publicId);
    }

    let profileImageData = await uploadBufferToCloudinary(
      req.files.profileImage[0],
      "profile",
    );
    if (profileImageData) {
      updatedData.profileImage = {
        url: profileImageData.secure_url,
        publicId: profileImageData.public_id,
      };
    }
  }

  if (req.files?.coverImage) {
    if (updatedData.coverImage.publicId) {
      await deleteFileFromCloudinary(updatedData.coverImage.publicId);
    }

    let coverImageData = await uploadBufferToCloudinary(
      req.files.coverImage[0],
      "cover",
    );
    if (coverImageData) {
      updatedData.coverImage = {
        url: coverImageData.secure_url,
        publicId: coverImageData.public_id,
      };
    }
  }

  if (data?.skills && Array.isArray(data?.skills)) {
    updatedData.skills = data?.skills;
  }

  if (data?.website && Array.isArray(data?.website)) {
    const isValid = data.website.every((item) => item.url && item.type);

    if (!isValid) {
      throw new AppError("Invalid website format", 400);
    }

    updatedData.website = data.website;
  }

  await updatedData.save();

  return {
    status: 200,
    message: "Updated successfully",
    data: updatedData,
  };
};
