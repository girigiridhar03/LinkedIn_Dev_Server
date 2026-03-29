import mongoose from "mongoose";

const imageObj = {
  url: {
    type: String,
    default: null,
  },
  publicId: {
    type: String,
    default: null,
  },
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phoneNumber: {
      type: String,
    },
    phoneType: {
      type: String,
      enum: ["Mobile", "Work", "Home"],
    },
    address: {
      type: String,
    },
    dob: {
      month: {
        type: Number,
      },
      year: {
        type: Number,
      },
    },
    bio: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: imageObj,
    coverImage: imageObj,
    skills: [String],
    website: [
      {
        url: {
          type: String,
          default: null,
        },
        type: {
          type: String,
          default: null,
        },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
