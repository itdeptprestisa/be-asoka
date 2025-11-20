import { NextFunction, Request, Response } from "express";
import { Website } from "../entities/Website";

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const websites = await Website.find();

    res.json({
      success: true,
      data: websites,
    });
  } catch (err) {
    next(err);
  }
};
