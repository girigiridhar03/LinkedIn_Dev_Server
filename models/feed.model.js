import mongoose from "mongoose";

const feedSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    imgOrVideo: {
      url: {
        type: String,
        default: null,
      },
      publicId: {
        type: String,
        default: null,
      },
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    visibility: {
      type: String,
      enum: ["public", "connections"],
      default: "public",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
feedSchema.index({ user: 1, createdAt: -1 });
const Feed = mongoose.model("Feed", feedSchema);

export default Feed;
