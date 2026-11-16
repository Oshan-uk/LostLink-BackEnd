import type { Request, Response } from "express";

import app from "../src/app.js";
import connectDatabase from "../src/config/database.js";

export default async function handler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    await connectDatabase();

    app(req, res);
  } catch (error) {
    console.error("Vercel API error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}