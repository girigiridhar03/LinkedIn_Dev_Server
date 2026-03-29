import mongoose from "mongoose";
const monthNyear = {
  month: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
};
const experienceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    employmentType: {
      type: String,
      required: true,
    },
    companyOrOrganization: {
      type: String,
      required: true,
    },
    startDate: monthNyear,
    endDate: monthNyear,
    location: {
      type: String,
      required: true,
    },
    locationType: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    profileHeading: {
      type: String,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    skills: [String],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Experience = mongoose.model("Experience", experienceSchema);
