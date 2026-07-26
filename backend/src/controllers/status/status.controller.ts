import type { Request, Response } from "express";
import {
  createImageStatus,
  createTextStatus,
  deleteStatus,
  getStatusFeed,
  getStatusViewers,
  markStatusViewed,
} from "../../services/status/status.service";
import { asyncHandler } from "../../utils";
import { uploadStatusMediaToCloudinary } from "../../utils/cloudinary.util";

export const listStatusFeed = asyncHandler(async (req: Request, res: Response) => {
  const feed = await getStatusFeed(req.user!.id);

  res.status(200).json({
    success: true,
    data: feed,
  });
});

export const createStatus = asyncHandler(async (req: Request, res: Response) => {
  const status = await createTextStatus(
    req.user!.id,
    req.body.text,
    req.body.backgroundColor
  );

  res.status(201).json({
    success: true,
    message: "Status posted",
    data: status,
  });
});

export const createStatusMedia = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: "Image is required" });
    return;
  }

  const upload = await uploadStatusMediaToCloudinary(req.file, req.user!.id);
  const caption = typeof req.body.caption === "string" ? req.body.caption : undefined;
  const status = await createImageStatus(
    req.user!.id,
    upload.url,
    upload.publicId,
    caption
  );

  res.status(201).json({
    success: true,
    message: "Status posted",
    data: status,
  });
});

export const viewStatus = asyncHandler(async (req: Request, res: Response) => {
  const status = await markStatusViewed(String(req.params.id), req.user!.id);

  res.status(200).json({
    success: true,
    data: status,
  });
});

export const removeStatus = asyncHandler(async (req: Request, res: Response) => {
  const result = await deleteStatus(String(req.params.id), req.user!.id);

  res.status(200).json({
    success: true,
    message: "Status deleted",
    data: result,
  });
});

export const listStatusViewers = asyncHandler(async (req: Request, res: Response) => {
  const viewers = await getStatusViewers(String(req.params.id), req.user!.id);

  res.status(200).json({
    success: true,
    count: viewers.length,
    data: viewers,
  });
});
