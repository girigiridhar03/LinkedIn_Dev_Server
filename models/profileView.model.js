import mongoose from "mongoose";

const profileViewSchema = new mongoose.Schema(
  {
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    profileOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

profileViewSchema.index({ profileOwner: 1, createdAt: -1 });

const ProfileView = mongoose.model("ProfileView", profileViewSchema);

export default ProfileView;
