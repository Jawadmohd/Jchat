import multer from "multer";
import { ApiError } from "../utils/apiError";

const imageMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const fileMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/zip",
];

const allowedMimeTypes = [...imageMimeTypes, ...fileMimeTypes];

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new ApiError(400, "Unsupported file type"));
};

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (imageMimeTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new ApiError(400, "Only JPEG, PNG, WebP, and GIF images are allowed"));
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const statusUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (imageMimeTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new ApiError(400, "Only JPEG, PNG, WebP, and GIF images are allowed"));
  },
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

export const messageAttachmentUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});
