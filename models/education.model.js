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

const educationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    school: {
      type: String,
      required: true,
    },
    degree: {
      type: String,
    },
    startDate: monthNyear,
    endDate: monthNyear,
    grade: {
      type: String,
    },
    activitiesNsocieties: [String],
    description: {
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

const Education = mongoose.model("Education", educationSchema);

export default Education;
