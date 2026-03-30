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
      index : true,
    },
    degree: {
      type: String,
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
    grade: {
      type: String,
    },
    activitiesNsocieties: [String],
    description: {
      type: String,
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
