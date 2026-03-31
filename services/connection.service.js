import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";
import Connection from "../models/connection.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import Experience from "../models/experience.model.js";

const getConnectionPairKey = (firstUserId, secondUserId) => {
  return [firstUserId.toString(), secondUserId.toString()].sort().join(":");
};

const finalUserDetailsFun = async (userIds) => {
  if (!userIds?.length) return {};

  const objectUserIds = userIds.map((id) => new mongoose.Types.ObjectId(id));

  const experience = await Experience.aggregate([
    {
      $match: { user: { $in: objectUserIds } },
    },
    {
      $sort: { isCurrent: -1, createdAt: -1 },
    },
    {
      $group: {
        _id: "$user",
        doc: { $first: "$$ROOT" },
      },
    },
    {
      $replaceRoot: { newRoot: "$doc" },
    },
    {
      $project: {
        location: 1,
        profileHeading: 1,
        user: 1,
        skills: 1,
      },
    },
  ]);

  const connectionCounts = await Connection.aggregate([
    {
      $match: {
        status: "accepted",
        senderId: { $in: objectUserIds },
      },
    },
    {
      $group: {
        _id: "$senderId",
        count: { $sum: 1 },
      },
    },
    {
      $unionWith: {
        coll: "connections",
        pipeline: [
          {
            $match: {
              status: "accepted",
              receiverId: { $in: objectUserIds },
            },
          },
          {
            $group: {
              _id: "$receiverId",
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
    {
      $group: {
        _id: "$_id",
        count: { $sum: "$count" },
      },
    },
  ]);

  const connectionMap = {};
  connectionCounts.forEach((c) => {
    connectionMap[c._id.toString()] = c.count;
  });

  const userDetails = {};

  experience.forEach((e) => {
    const key = e.user.toString();

    userDetails[key] = {
      location: e.location,
      profileHeading: e.profileHeading,
      skills: e.skills,
      connectionCount: connectionMap[key] || 0,
    };
  });

  return userDetails;
};
export const sendConnectionService = async (req) => {
  const userId = req.user.id;
  const receiverId = req.params.receiverId;
  const pairKey = getConnectionPairKey(userId, receiverId);

  if (!receiverId) {
    throw new AppError("receiverId is required", 400);
  }

  if (!mongoose.isValidObjectId(receiverId)) {
    throw new AppError(`Invalid ReceiverId: ${receiverId}`, 400);
  }

  if (userId.toString() === receiverId.toString()) {
    throw new AppError("You cannot connect with yourself", 400);
  }

  const receiverExists = await User.exists({ _id: receiverId });

  if (!receiverExists) {
    throw new AppError("Receiver not found", 404);
  }

  const existingConnection = await Connection.findOne({ pairKey });

  if (existingConnection) {
    if (existingConnection.status === "accepted") {
      throw new AppError("Already connected", 400);
    }

    if (existingConnection.status === "pending") {
      throw new AppError("Connection request already sent", 400);
    }

    if (existingConnection.status === "rejected") {
      await Connection.deleteOne({ _id: existingConnection._id });
    }
  }

  let newConnection;

  try {
    newConnection = await Connection.create({
      senderId: userId,
      receiverId,
      status: "pending",
      pairKey,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const concurrentConnection = await Connection.findOne({ pairKey });

      if (concurrentConnection?.status === "accepted") {
        throw new AppError("Already connected", 400);
      }

      throw new AppError("Connection request already sent", 400);
    }

    throw error;
  }

  await Notification.create({
    user: receiverId,
    type: "connection",
    isRead: false,
    referenceId: userId,
    message: `${req.user.name} wants to connect with you`,
  });

  return {
    status: 200,
    message: "Connection sent successfully",
    data: newConnection,
  };
};

export const getConnectionsService = async (req) => {
  const userId = req.user.id;
  const status = req.query.status;
  const limit = Number(req.query.limit) || 10;
  const page = Number(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const currentUser = await User.findById(userId).select("skills");
  if (!currentUser) {
    throw new AppError("User not found", 404);
  }

  if (!status) {
    const connections = await Connection.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
      status: { $in: ["pending", "accepted"] },
    }).select("senderId receiverId");

    const excludeIds = new Set();

    connections.forEach((conn) => {
      excludeIds.add(conn.senderId.toString());
      excludeIds.add(conn.receiverId.toString());
    });

    excludeIds.add(userId);

    const excludedObjectIds = Array.from(excludeIds).map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    const suggestedUsers = await User.aggregate([
      {
        $match: {
          _id: { $nin: excludedObjectIds },
        },
      },
      {
        $addFields: {
          matchCount: {
            $size: {
              $setIntersection: ["$skills", currentUser.skills || []],
            },
          },
        },
      },
      {
        $sort: { matchCount: -1, createdAt: -1 },
      },
      {
        $project: {
          name: 1,
          profileImage: 1,
          skills: 1,
          matchCount: 1,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    const userIds = suggestedUsers.map((user) => user._id);

    const userDetails = await finalUserDetailsFun(userIds);

    const finalUserDetails = suggestedUsers.map((user) => {
      const key = user._id.toString();
      const details = userDetails[key] || {};

      return {
        ...user,
        ...details,
        connectionCount: details.connectionCount || 0,
      };
    });

    return {
      status: 200,
      message: "Suggested users fetched successfully",
      data: finalUserDetails,
    };
  }

  const allowedStatus = ["pending", "accepted", "rejected"];

  if (!allowedStatus.includes(status)) {
    throw new AppError("Invalid status", 400);
  }

  const connections = await Connection.find({
    $or: [{ senderId: userId }, { receiverId: userId }],
    status,
  })
    .populate("senderId", "name profileImage")
    .populate("receiverId", "name profileImage")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const result = connections.map((conn) => {
    const isSender = conn.senderId._id.toString() === userId;

    return isSender
      ? {
          ...conn.receiverId,
          connectionId: conn._id,
          status: conn.status ?? null,
        }
      : {
          ...conn.senderId,
          connectionId: conn._id,
          status: conn.status ?? null,
        };
  });

  const userIds = result.map((user) => user._id);

  const userDetails = await finalUserDetailsFun(userIds);

  const finalObj = result.map((user) => {
    const key = user._id.toString();
    const details = userDetails[key] || {};

    return {
      ...user,
      ...details,
      connectionCount: details.connectionCount || 0,
    };
  });

  return {
    status: 200,
    message: "Connections fetched successfully",
    data: finalObj,
  };
};

export const actionConnectionService = async (req) => {
  const userId = req.user.id;
  const connectionId = req.params.connectionId;
  const status = req.query.status;

  if (!connectionId) {
    throw new AppError("connectionId is required", 400);
  }

  if (!mongoose.isValidObjectId(connectionId)) {
    throw new AppError(`Invalid connectionId: ${connectionId}`, 400);
  }

  if (!status) {
    throw new AppError("Status is required", 400);
  }

  const allowedStatus = ["accepted", "rejected"];

  if (!allowedStatus.includes(status)) {
    throw new AppError("Invalid status", 400);
  }

  const connection = await Connection.findById(connectionId)
    .populate("senderId", "name profileImage")
    .populate("receiverId", "name profileImage");

  if (!connection) {
    throw new AppError("Connection not found", 404);
  }

  if (connection.receiverId._id.toString() !== userId.toString()) {
    throw new AppError("Only receiver can perform this action", 403);
  }

  if (connection.status !== "pending") {
    throw new AppError("Connection already handled", 400);
  }

  connection.status = status;
  await connection.save();

  await Notification.create({
    user: connection.senderId._id,
    type: "connection",
    message: `${connection.receiverId.name} ${connection.status} your connection request.`,
    referenceId: connection.receiverId._id,
    isRead: false,
  });

  return {
    status: 200,
    message: `status: ${status} updated successfully`,
    data: connection,
  };
};

export const removeConnectionService = async (req) => {
  const userId = req.user.id;
  const connectionId = req.params.connectionId;

  if (!connectionId) {
    throw new AppError("connectionId is required", 400);
  }

  if (!mongoose.isValidObjectId(connectionId)) {
    throw new AppError(`Invalid connectionId: ${connectionId}`, 400);
  }

  const deletedConnection = await Connection.findOneAndDelete({
    _id: connectionId,
    $or: [{ senderId: userId }, { receiverId: userId }],
    status: { $in: ["accepted", "pending"] },
  });

  if (!deletedConnection) {
    throw new AppError("Connection not found or not allowed to delete", 404);
  }

  return {
    status: 200,
    message: "Connection removed successfully",
  };
};
