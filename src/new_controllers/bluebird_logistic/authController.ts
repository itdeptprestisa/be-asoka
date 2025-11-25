import { Request, Response, NextFunction } from "express";
import { fetchAccessToken } from "../../services/bluebird_logistic/authServices";

export const getAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tokenData = await fetchAccessToken();

    return res.json({
      data: tokenData,
      message: "Login successful",
    });
  } catch (error) {
    next(error);
  }
};
