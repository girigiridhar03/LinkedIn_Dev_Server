import {
  addEducationService,
  addExperienceService,
  getCompanyOrOrganizationService,
  getEducationSchoolService,
  meService,
  userLoginService,
  userRegistrationService,
} from "../services/user.service.js";
import { asyncHandler } from "../utils/handlers.js";
import response from "../utils/response.js";

export const userRegistration = asyncHandler(async (req, res) => {
  const { status, message, data } = await userRegistrationService(req, res);
  response(res, status, message, data);
});

export const userLogin = asyncHandler(async (req, res) => {
  const { status, message, data } = await userLoginService(req, res);
  response(res, status, message, data);
});

export const me = asyncHandler(async (req, res) => {
  const { status, message, data } = await meService(req);
  response(res, status, message, data);
});

export const addEducation = asyncHandler(async (req, res) => {
  const { status, message, data } = await addEducationService(req);
  response(res, status, message, data);
});

export const addExperience = asyncHandler(async (req, res) => {
  const { status, message, data } = await addExperienceService(req);
  response(res, status, message, data);
});

export const getEducationSchool = asyncHandler(async (req, res) => {
  const { status, message, data } = await getEducationSchoolService(req);
  response(res, status, message, data);
});

export const getCompanyOrOrganization = asyncHandler(async (req, res) => {
  const { status, message, data } = await getCompanyOrOrganizationService(req);
  response(res, status, message, data);
});
