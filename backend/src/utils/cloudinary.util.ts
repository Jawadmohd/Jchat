import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { ApiError } from "./apiError";

const getCloudinaryConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new ApiError(500, "Cloudinary is not configured");
  }

  return { cloudName, apiKey, apiSecret };
};

export const configureCloudinary = () => {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
};

interface AvatarUploadResult {
  url: string;
  publicId: string;
}

export const uploadAvatarToCloudinary = async (
  file: Express.Multer.File,
  userId: string
): Promise<AvatarUploadResult> => {
  configureCloudinary();

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: "jchat/avatars",
        public_id: `${userId}-${Date.now()}`,
        overwrite: false,
        resource_type: "image",
        transformation: [{ width: 400, height: 400, crop: "fill", gravity: "auto" }],
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve(uploadResult);
      }
    );

    upload.end(file.buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

export const deleteAvatarFromCloudinary = async (publicId?: string | null) => {
  if (!publicId) {
    return;
  }

  configureCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};
