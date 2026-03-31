import { v2 as cloudinary } from "cloudinary";
import { config } from "./env.config.js";
import { AppError } from "../utils/AppError.js";

cloudinary.config({
  cloud_name: config.cloud_name,
  api_key: config.api_key,
  api_secret: config.api_secret,
});

export const uploadBufferToCloudinary = async (file, type = "profile") => {
  if (!file?.buffer) return null;

  let transformation = [];

  if (type === "profile") {
    transformation = [
      { width: 400, height: 400, crop: "fill", gravity: "face" },
      { quality: "auto:good" },
      { fetch_format: "auto" },
    ];
  }

  if (type === "cover") {
    transformation = [
      { width: 1200, height: 400, crop: "fill" },
      { quality: "auto:good" },
      { fetch_format: "auto" },
    ];
  }

  try {
    const response = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "LinkedIn-Dev",
          transformation,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      stream.end(file.buffer);
    });

    return response;
  } catch (error) {
    console.log("upload buffer to cloudinary failed", error);
    throw new AppError("File upload failed", 500);
  }
};

export const deleteFileFromCloudinary = async (publicId) => {
  if (!publicId) return null;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.log("deleting failed: ", error);
    return null;
  }
};
