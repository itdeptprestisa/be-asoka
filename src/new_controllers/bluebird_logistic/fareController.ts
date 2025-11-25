import { Request, Response, NextFunction } from "express";
import {
  FareEstimationParams,
  getFarePriceEstimationService,
} from "../../services/bluebird_logistic/fareServices";

export const getFarePriceEstimation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization token is required",
      });
    }

    const accessToken = authHeader.split(" ")[1] || "";

    const params: FareEstimationParams = {
      pickup_lat: parseFloat(req.query.pickup_lat as string),
      pickup_lon: parseFloat(req.query.pickup_lon as string),
      dropoff_lat: parseFloat(req.query.dropoff_lat as string),
      dropoff_lon: parseFloat(req.query.dropoff_lon as string),
      service_type: (req.query.service_type as string) || "LOG",
    };
    let isError = false;
    let isParamEmpty = false;
    const missingQureyParams = [];

    if (!params.pickup_lat) {
      isError = true;
      isParamEmpty = true;
      missingQureyParams.push("pickup_lat");
    }
    if (!params.pickup_lon) {
      isError = true;
      isParamEmpty = true;
      missingQureyParams.push("pickup_lon");
    }
    if (!params.dropoff_lat) {
      isError = true;
      isParamEmpty = true;
      missingQureyParams.push("dropoff_lat");
    }
    if (!params.dropoff_lon) {
      isError = true;
      isParamEmpty = true;
      missingQureyParams.push("dropoff_lon");
    }

    if (isError) {
      return res.status(400).json({
        message: [
          isParamEmpty &&
            `Missing ${
              missingQureyParams.length
            } required query parameter(s): ${missingQureyParams.join(", ")}`,
        ],
      });
    }

    const result = await getFarePriceEstimationService(params, accessToken);

    return res.json({
      data: result,
      message: "Fare estimation retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};
