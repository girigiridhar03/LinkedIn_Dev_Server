import {
  actionConnectionService,
  getConnectionsService,
  removeConnectionService,
  sendConnectionService,
} from "../services/connection.service.js";
import { asyncHandler } from "../utils/handlers.js";
import response from "../utils/response.js";

export const sendConnection = asyncHandler(async (req, res) => {
  const { status, message, data } = await sendConnectionService(req);
  response(res, status, message, data);
});

export const getConnections = asyncHandler(async (req, res) => {
  const { status, message, data } = await getConnectionsService(req);
  response(res, status, message, data);
});

export const actionConnection = asyncHandler(async (req, res) => {
  const { status, message, data } = await actionConnectionService(req);
  response(res, status, message, data);
});

export const removeConnection = asyncHandler(async (req, res) => {
  const { status, message } = await removeConnectionService(req);
  response(res, status, message);
});
