import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    feed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Feed",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
likeSchema.index({ user: 1, feed: 1 }, { unique: true });
const Like = mongoose.model("Like", likeSchema);

export default Like;
