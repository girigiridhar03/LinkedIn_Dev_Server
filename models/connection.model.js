import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    pairKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

connectionSchema.pre("validate", function () {
  if (!this.senderId || !this.receiverId) {
    return;
  }

  const [firstId, secondId] = [
    this.senderId.toString(),
    this.receiverId.toString(),
  ].sort();

  this.pairKey = `${firstId}:${secondId}`;
});

const Connection = mongoose.model("Connection", connectionSchema);

export default Connection;
