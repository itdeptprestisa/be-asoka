import { NextFunction, Request, Response } from "express";
import { Like, Between, MoreThan, LessThan, In, IsNull, Not } from "typeorm";
import { Logs } from "../entities/Logs";
import dataSource from "../config/dataSource";
import {
  generateRandomPointNear,
  haversineGreatCircleDistance,
  logError,
  saveEntity,
  sendToLavenderFtp,
} from "../utils";
import moment from "moment";
import { Geo } from "../entities/Geo";
import axios from "axios";
import { ShippingCostEstimation } from "../entities/ShippingCostEstimation";
import { getFarePriceEstimationService } from "../services/bluebird_logistic/fareServices";
import { shippingEstimationService } from "./gojekController";
import { getAccessToken } from "./bluebird_logistic/authController";
import { fetchAccessToken } from "../services/bluebird_logistic/authServices";

export const shippingPriceEstimation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let message = "";
    let distance = 0;
    let newDistance = 0;
    const supplierId = req.body.supplier_id;

    // Google Maps Distance Matrix API
    const urlCheckDistance = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${req.body.origin_lat},${req.body.origin_lng}&destinations=${req.body.destination_lat},${req.body.destination_lng}&key=AIzaSyBys4EI0yuZd9hC7umhIys-_fAT6Yw7f4g`;

    const geoRepository = dataSource.getRepository(Geo);
    const parentData = await geoRepository.findOne({
      where: { id: req.body.city_id },
      select: ["name", "parent_id"],
    });

    if (!parentData) {
      res.status(404).json({ success: false, message: "City not found" });
      return;
    }

    // Get distance from Google API
    try {
      const response = await axios.get(urlCheckDistance);
      const data = response.data;

      if (data?.rows?.[0]?.elements?.[0]?.distance?.text) {
        distance = data.rows[0].elements[0].distance.value; // value in meters
      } else {
        message = JSON.stringify(data);
      }
    } catch (error) {
      message = `Google API error: ${error.message}`;
    }

    // Only for non-warehouse product
    if (!supplierId) {
      const lastEstimation = await ShippingCostEstimation.findOne({
        where: { city_id: req.body.city_id },
        order: { created_at: "DESC" },
      });

      if (
        distance > 35000 &&
        (!lastEstimation ||
          lastEstimation.distance === 0 ||
          lastEstimation.shipping_cost === 0)
      ) {
        const possibleOrigins = generateRandomPointNear(
          req.body.destination_lat,
          req.body.destination_lng,
          5000
        );
        const destLat = req.body.destination_lat;
        const destLng = req.body.destination_lng;
        const distKm = haversineGreatCircleDistance(
          possibleOrigins.lat,
          possibleOrigins.lng,
          destLat,
          destLng
        );

        if (distKm) {
          req.body.origin_lat = possibleOrigins.lat;
          req.body.origin_lng = possibleOrigins.lng;
          newDistance = distKm;
          message =
            message + "Origin address successfully re-routed to nearest 5 km";
        } else {
          return avoidZeroPricingEstimation(
            res,
            distance,
            req.body.city_id,
            parentData.name,
            parentData.parent_id,
            message +
              "No nearby point found within 2 km, then using Gojek Shipping Rate data"
          );
        }
      } else if (distance > 35000 && lastEstimation) {
        const costPerKm =
          lastEstimation.cost_per_km >= 4000
            ? 4000
            : lastEstimation.cost_per_km;
        res.json({
          success: true,
          message: "Successfully get couriers data from database",
          distance: distance / 1000,
          new_distance: lastEstimation.distance,
          distance_unit: "km",
          data: {
            data: {
              pricings: [
                {
                  final_price: costPerKm * (distance / 1000),
                  logistic: {
                    name: lastEstimation.courier_name,
                  },
                },
              ],
            },
          },
          url: [],
          request: [],
        });
        return;
      }
    }

    try {
      const payload = {
        origin: {
          lat: String(req.body.origin_lat),
          lng: String(req.body.origin_lng),
        },
        destination: {
          lat: String(req.body.destination_lat),
          lng: String(req.body.destination_lng),
        },
        item_categories: ["Makanan"],
        schedule_at: new Date(Date.now() + 10 * 60 * 1000)
          .toISOString()
          .replace(/\.\d{3}Z$/, "Z"),
        cod: false,
        for_order: true,
        item_value: req.body.price,
        weight: 10,
        length: 40,
        width: 40,
        height: 60,
        limit: 30,
        sort_by: ["final_price"],
      };

      let url = "";
      const gojek_payload = {
        origin_latlng: `${req.body.origin_lat},${req.body.origin_lng}`,
        destination_latlng: `${req.body.destination_lat},${req.body.destination_lng}`,
      };

      let dataPhase1: any = {};

      try {
        if (req.body.shipping_method == "bluebird") {
          const tokenData = await fetchAccessToken();
          const response = await getFarePriceEstimationService(
            {
              pickup_lat: req.body.origin_lat,
              pickup_lon: req.body.origin_lng,
              dropoff_lat: req.body.destination_lat,
              dropoff_lon: req.body.destination_lng,
              service_type: "LOG",
            },
            tokenData.access_token
          );

          if (response.code >= 200 && response.code < 300) {
            dataPhase1 = {
              data: {
                pricings: [
                  {
                    final_price: response.result.price,
                    logistic: "BlueBird",
                  },
                ],
              },
            };
          }
        } else {
          dataPhase1 = await shippingEstimationService({
            origin_latlng: gojek_payload.origin_latlng,
            destination_latlng: gojek_payload.destination_latlng,
            token: "integration-prestisa-gojek-2025",
          });

          if (dataPhase1?.success === true) {
            url = dataPhase1.url;
            const pricings = [];

            for (const method of ["Instant", "SameDay", "InstantCar"]) {
              if (dataPhase1.data && dataPhase1.data[method]) {
                pricings.push({
                  final_price: dataPhase1.data[method].price?.total_price || 0,
                  logistic: dataPhase1.data[method].shipment_method || method,
                });
              }
            }

            dataPhase1 = {
              data: {
                pricings: pricings,
              },
            };
          }
        }
      } catch (error) {
        dataPhase1 = { success: false };
      }

      // Recursive handling with depth limit
      const depth = req.body.depth || 1;
      if (depth >= 3) {
        res.json({
          success: false,
          message: "Recursive limit reached",
          data: [],
          url: url,
          request: payload,
        });
        return;
      }

      if (!dataPhase1.data?.pricings || dataPhase1.data.pricings.length === 0) {
        await logError("error_no_data_received", JSON.stringify(req.body));

        message = message + JSON.stringify(dataPhase1);

        return avoidZeroPricingEstimation(
          res,
          distance,
          req.body.city_id,
          parentData.name,
          parentData.parent_id,
          message
        );
      } else {
        res.json({
          success: true,
          message: message + "Successfully get estimation data",
          distance: distance / 1000,
          new_distance: newDistance,
          distance_unit: "km",
          data: dataPhase1,
          url: url,
          request: payload,
        });
        return;
      }
    } catch (error: any) {
      await logError(
        "error_get_price_estimation",
        JSON.stringify({
          type: "error",
          message: error.message,
        })
      );

      return avoidZeroPricingEstimation(
        res,
        distance,
        req.body.city_id,
        parentData.name,
        parentData.parent_id,
        JSON.stringify({
          msg: error.message,
          line: error.stack?.split("\n")[1] || "unknown",
        }) || "shipping estimation error api"
      );
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

// Helper function that was called in the original code
const avoidZeroPricingEstimation = async (
  res: Response,
  distance: number,
  cityId: number,
  cityName: string,
  parentId: number,
  message: string
): Promise<void> => {
  try {
    const lastEstimation = await ShippingCostEstimation.findOne({
      where: { city_id: cityId },
      order: { created_at: "DESC" },
    });

    if (lastEstimation) {
      res.json({
        success: true,
        message: message + "Using last estimation data",
        distance: distance / 1000,
        new_distance: lastEstimation.distance,
        distance_unit: "km",
        data: {
          data: {
            pricings: [
              {
                final_price: lastEstimation.cost_per_km * (distance / 1000),
                logistic: {
                  name: lastEstimation.courier_name,
                },
              },
            ],
          },
        },
        url: [],
        request: [],
      });
    } else {
      // Fallback to default pricing
      const defaultCostPerKm = 4000;
      res.json({
        success: true,
        message: message + "Using default shipping rate",
        distance: distance / 1000,
        new_distance: 0,
        distance_unit: "km",
        data: {
          data: {
            pricings: [
              {
                final_price: defaultCostPerKm * (distance / 1000),
                logistic: {
                  name: "Default Courier",
                },
              },
            ],
          },
        },
        url: [],
        request: [],
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fallback pricing",
      error: error.message,
    });
  }
};

export const testFtpUpload = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (process.env.NODE_ENV === "development") {
    try {
      const file = req.file;
      if (!file) {
        res.json({ success: false, message: "No file uploaded" });
      }
      const localPath = file.path; // Multer sets this
      const remotePath = `/assets/images/customers/sakura-upload-test.png`; // or customize as needed

      await sendToLavenderFtp(localPath, remotePath);
      res.status(200).json({
        message: "FTP upload successful",
        remotePath,
      });
    } catch (error) {
      next(error);
    }
  }
};

export const postLog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const LogsRepository = dataSource.getRepository(Logs);

  try {
    saveEntity(LogsRepository, Logs, {
      name: "coba timezone",
      data: moment().format("DD-MM-YYYY HH:mm:ss"),
    });

    res.json({
      success: true,
      message: "Log created successfully",
    });
  } catch (error) {
    next(error);
  }
};
