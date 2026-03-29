import { v2 as cloudinary } from "cloudinary";
import { config } from "./env.config.js";

cloudinary.config({
  cloud_name: config.cloud_name,
  api_key: config.api_key,
  api_secret: config.api_secret,
});

export const uploadBufferToCloudinary = async (file) => {
  if (!file?.buffer) return null;

  try {
    const response = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "LinkedIn-Dev",
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
    return null;
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
