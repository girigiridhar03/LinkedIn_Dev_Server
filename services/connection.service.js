import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";
import Connection from "../models/connection.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

export const sendConnectionService = async (req) => {
  const userId = req.user.id;
  const receiverId = req.params.receiverId;
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

  const existingConnection = await Connection.findOne({
    $or: [
      { senderId: userId, receiverId },
      { senderId: receiverId, receiverId: userId },
    ],
  });

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

  const newConnection = await Connection.create({
    senderId: userId,
    receiverId,
    status: "pending",
  });

  await Notification.create({
    user: receiverId,
    type: "connection",
    isRead: false,
    referenceId: userId,
    message: `${req.user.name} whats to connect with you`,
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

  if (!status) {
    const currentUser = await User.findById(userId).select("skills");

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

    const suggestedUsers = await User.aggregate([
      {
        $match: {
          _id: {
            $nin: Array.from(excludeIds).map(
              (id) => new mongoose.Types.ObjectId(id),
            ),
          },
        },
      },
      {
        $addFields: {
          matchCount: {
            $size: {
              $filter: {
                input: "$skills",
                as: "skill",
                cond: {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: currentUser.skills || [],
                          as: "userSkill",
                          cond: {
                            $regexMatch: {
                              input: "$$skill",
                              regex: "$$userSkill",
                              options: "i",
                            },
                          },
                        },
                      },
                    },
                    0,
                  ],
                },
              },
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
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);

    return {
      status: 200,
      message: "Suggested users fetched successfully",
      data: suggestedUsers,
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
      ? { ...conn.receiverId, status: conn.status ?? null }
      : { ...conn.senderId, status: conn.status ?? null };
  });

  return {
    status: 200,
    message: "connections fetched successfull",
    data: result,
  };
};
