import type { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Please select an image to upload.",
      });
      return;
    }

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "lostlink/items",
          resource_type: "image",
        },
        (error, uploadedImage) => {
          if (error || !uploadedImage) {
            reject(error || new Error("Image upload failed."));
            return;
          }

          resolve({
            secure_url: uploadedImage.secure_url,
            public_id: uploadedImage.public_id,
          });
        },
      );

      Readable.from(req.file!.buffer).pipe(stream);
    });

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully.",
      image: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { uploadImage };