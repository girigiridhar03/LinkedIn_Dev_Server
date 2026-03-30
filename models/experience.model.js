import mongoose from "mongoose";
const monthNyear = {
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
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
      index: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    startDate: monthNyear,
    endDate: {
      month: {
        type: Number,
        required: function () {
          return !this.isCurrent;
        },
        min: 1,
        max: 12,
      },
      year: {
        type: Number,
        required: function () {
          return !this.isCurrent;
        },
      },
    },
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
    skills: [String],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Experience = mongoose.model("Experience", experienceSchema);

export default Experience;
