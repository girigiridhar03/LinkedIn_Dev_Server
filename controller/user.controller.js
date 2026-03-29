import {
  userLoginService,
  userRegistrationService,
} from "../services/user.service.js";
import { asyncHandler } from "../utils/handlers.js";
import response from "../utils/response.js";

export const userRegistration = asyncHandler(async (req, res) => {
  const { status, message, data } = await userRegistrationService(req);
  response(res, status, message, data);
});

export const userLogin = asyncHandler(async (req, res) => {
  const { status, message, data } = await userLoginService(req, res);
  response(res, status, message, data);
});
