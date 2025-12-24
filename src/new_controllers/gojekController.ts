// controllers/requestPickup.js
import { NextFunction, Request, Response } from "express";
import { getRepository } from "typeorm";
import axios from "axios";

import { PurchaseOrder } from "../entities/PurchaseOrder";
import { OrderItems } from "../entities/OrderItems";
import { Logs } from "../entities/Logs";
import { GojekBooking } from "../entities/GojekBooking";
import {
  createLog,
  generateRandomPointNear,
  gojekBookingRequest,
  haversineGreatCircleDistance,
  jabodetabekIds,
  logError,
  saveEntity,
} from "../utils";
import dataSource from "../config/dataSource";
import { updateShippingGojek } from "../new_jobs/updateShippingGojek";
import { Geo } from "../entities/Geo";
import { ShippingCostEstimation } from "../entities/ShippingCostEstimation";
import { ShippingCost } from "../entities/ShippingCost";

const GOJEK_HEADERS = {
  "Pass-Key": process.env.GOJEK_PARTNER_KEY,
  "Client-ID": "prestisa-engine",
};
const GOJEK_URL = process.env.GOJEK_BASE_URL;

export const bookingStatus = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const expectedToken = "integration-prestisa-gojek-2025";

  try {
    const incomingToken = req.header("X-PRSTS-Token");

    if (incomingToken !== expectedToken) {
      return res
        .status(401)
        .json({ success: false, status: 401, message: "Unauthorized" });
    }

    const poData = await PurchaseOrder.findOne({
      where: { id: req.query.po_id },
    });
    if (!poData) {
      return res.status(400).json({
        success: false,
        message: "Failed to find purchase order data",
        data: [],
      });
    }

    const bookingData = await GojekBooking.findOne({
      where: { store_order_id: req.query.po_id },
      order: { created_at: "DESC" },
    });

    if (!bookingData) {
      return res.status(400).json({
        success: false,
        message: "Failed to find booking data",
        data: [],
      });
    }

    const response = await axios.get(
      `${GOJEK_URL}/booking/orderno/${bookingData.booking_id}`,
      {
        headers: GOJEK_HEADERS,
      }
    );

    if (response.status >= 200 && response.status < 300) {
      const allBookingData = await GojekBooking.find({
        where: { store_order_id: req.query.po_id },
        order: { created_at: "DESC" },
      });

      return res.json({
        success: true,
        data: response.data,
        history_data: allBookingData,
      });
    }

    return res.status(400).json({
      success: false,
      error_message:
        response.headers["Error-Message"] || JSON.stringify(response.data),
      respon_header: response.headers,
      payload: "",
    });
  } catch (err: any) {
    await createLog(`error_gojek_order_status_${req.query.po_id}`, err.message);
    return res.status(400).json({
      success: false,
      message: err.message,
      data: [],
    });
  }
};

export const priceEstimation = async (
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
        dataPhase1 = await shippingEstimationService({
          origin_latlng: gojek_payload.origin_latlng,
          destination_latlng: gojek_payload.destination_latlng,
          token: "integration-prestisa-gojek-2025",
        });
      } catch (error) {
        dataPhase1 = { success: false };
      }

      if (dataPhase1?.success === true) {
        url = dataPhase1.url;
        const pricings = [];

        for (const method of ["Instant", "SameDay", "InstantCar"]) {
          if (dataPhase1.data && dataPhase1.data[method]) {
            pricings.push({
              final_price: dataPhase1.data[method].price?.total_price || 0,
              logistic: dataPhase1.data[method].shipment_method || {
                name: method,
              },
            });
          }
        }

        dataPhase1 = {
          data: {
            pricings: pricings,
          },
        };
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
        await logError(
          "error_gojek_no_data_received",
          JSON.stringify(req.body)
        );

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
          message: message + "Successfully get couriers data from Gojek",
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
        "gojek_error_get_price_estimation",
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
        }) || "Gojek error api"
      );
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
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

export async function shippingEstimation(req: any, res: Response) {
  try {
    const data = await shippingEstimationService({
      origin_latlng: req.query.origin_latlng,
      destination_latlng: req.query.destination_latlng,
      token: req.header("X-PRSTS-Token") || "",
    });

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function shippingEstimationService(payload: {
  origin_latlng: string;
  destination_latlng: string;
  token: string;
}) {
  const expectedToken = "integration-prestisa-gojek-2025";

  if (payload.token !== expectedToken) {
    throw new Error("Unauthorized");
  }
  if (!payload.origin_latlng)
    throw new Error("Origin latitude and longitude empty");
  if (!payload.destination_latlng)
    throw new Error("Destination latitude and longitude empty");

  const url = `${GOJEK_URL}/calculate/price?origin=${payload.origin_latlng}&destination=${payload.destination_latlng}&paymentType=3`;

  const response = await axios.get(url, { headers: GOJEK_HEADERS });
  return {
    success: response.status == 200 ? true : false,
    data: response.data,
    url,
  };
}

export const bookingCancellation = async (req: Request, res: Response) => {
  try {
    const request = req.body;
    const expectedToken = "integration-prestisa-gojek-2025";
    const incomingToken = req.header("X-PRSTS-Token");

    if (incomingToken !== expectedToken) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: "Unauthorized",
      });
    }

    const poData = await PurchaseOrder.findOne({
      where: { id: request.po_id, status: "on shipping" },
    });

    if (!poData) {
      return res.status(400).json({
        success: false,
        message: "Failed to find purchase order data",
        data: [],
      });
    }

    const bookingData = await GojekBooking.findOne({
      where: { store_order_id: request.po_id },
      order: { created_at: "DESC" },
    });

    // Optional: add status filter like in Laravel comments
    // if (!bookingData) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Not allowed to cancel purchase order",
    //     data: []
    //   });
    // }

    const payload = { orderNo: bookingData?.booking_id };

    const response = await axios.put(`${GOJEK_URL}/booking/cancel`, payload, {
      headers: GOJEK_HEADERS,
    });

    if (response.status >= 200 && response.status < 300) {
      const data = response.data;
      return res.json({
        success: true,
        data,
      });
    }

    const headers = response.headers;
    const errorMessage = response.headers["Error-Message"];

    return res.status(400).json({
      success: false,
      error_message: errorMessage || response.data,
      respon_header: headers,
      payload,
    });
  } catch (err: any) {
    logError(
      `error_gojek_cancel_order_${req.body?.po_id || "unknown"}`,
      err.message
    );

    return res.status(400).json({
      success: false,
      message: err.message,
      data: [],
    });
  }
};

export const requestPickupOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const expectedToken = "integration-prestisa-gojek-2025";
    const incomingToken = req.header("X-PRSTS-Token");

    if (incomingToken !== expectedToken) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: "Unauthorized",
      });
    }

    const poData = await PurchaseOrder.findOne({
      where: { id: req.body.po_id, status: "on shipping" },
      relations: ["supplierData", "orderData", "customerData", "productsData"],
    });

    if (!poData) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Purchase Order not found",
      });
    }

    const result = await gojekBookingRequest(poData);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: "Pickup request created successfully",
        data: result.data,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.error_message || "Pickup request failed",
        data: result.data || [],
      });
    }
  } catch (err: any) {
    // normalize unexpected errors
    next(err);
  }
};

export const requestPickup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const expectedToken = "integration-prestisa-gojek-2025";
    const incomingToken = req.header("X-PRSTS-Token");

    if (incomingToken !== expectedToken) {
      return res
        .status(401)
        .json({ success: false, status: 401, message: "Unauthorized" });
    }

    const result = await gojekRequestPickupHelper(req.body);

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (err) {
    next(err);
  }
};

export async function gojekRequestPickupHelper(request: any) {
  try {
    const validPo = await PurchaseOrder.findOne({
      where: { id: request.order_data.po_id, status: "on shipping" },
      relations: ["supplierData", "customerData", "orderItemsData"],
    });

    if (!validPo) {
      await createLog(
        `gojek_booking_request_invalid_request_${request.order_data.po_id}`,
        JSON.stringify(validPo)
      );
      return {
        success: false,
        message: "Status purchase order not valid",
        data: [],
      };
    }

    const validLocation = jabodetabekIds().includes(validPo.city);
    if (!validLocation) {
      await createLog(
        `gojek_booking_request_invalid_location_${request.order_data.po_id}`,
        JSON.stringify(validPo)
      );

      validPo.orderItemsData.shipping_expedition = "KURIR TOKO";
      validPo.orderItemsData.shipping_expedition_note =
        "Lokasi tidak didukung, diluar JABODETABEK";
      validPo.shipping_expedition = "KURIR TOKO";

      await PurchaseOrder.save(validPo);
      await OrderItems.save(validPo.orderItemsData);

      return {
        success: false,
        message:
          "Location purchase order not valid, now Shipping Expedition is set to KURIR TOKO",
        data: [],
      };
    }

    const orderItems = await OrderItems.find({
      where: { order_id: validPo.order_id },
      relations: ["productsData", "productsData.productCategoryNewData"],
    });

    if (!orderItems.length) {
      return { success: false, message: "Failed to find order data", data: [] };
    }

    const sumPriceOrder = orderItems.reduce((sum, item) => sum + item.price, 0);

    if (
      validPo.shipping_expedition !== "GOJEK" &&
      validPo.shipping_expedition !== "GOCAR"
    ) {
      return {
        success: false,
        message: "Invalid shipping method type",
        data: [],
      };
    }

    const payload = {
      paymentType: 3,
      collection_location: "pickup",
      shipment_method:
        validPo.shipping_expedition == "GOCAR" ? "InstantCar" : "Instant",
      routes: [
        {
          originName: validPo.supplierData.name,
          originNote: request.origin.note,
          originContactName: request.origin.contact_name,
          originContactPhone: validPo.supplierData.phone.replace(/^62/, "0"),
          originLatLong: request.origin.lat_lng,
          originAddress: validPo.supplierData.address,
          destinationName: validPo.customerData.name,
          destinationNote: request.destination.note,
          destinationContactName: request.destination.contact_name,
          destinationContactPhone: request.destination.phone.replace(
            /^62/,
            "0"
          ),
          destinationLatLong: request.destination.lat_lng,
          destinationAddress: request.destination.address,
          item:
            [
              ...new Set(
                orderItems
                  .map((oi) => oi.productsData?.productCategoryNewData?.name)
                  .filter(Boolean)
              ),
            ].join(", ") || "Produk Prestisa",
          storeOrderId: String(validPo.id),
          insuranceDetails: {
            applied: "true",
            fee: "2500",
            product_description:
              [
                ...new Set(
                  orderItems.map((oi) => oi.productsData?.name).filter(Boolean)
                ),
              ].join(", ") || "Produk Prestisa",
            product_price: String(sumPriceOrder),
          },
        },
      ],
    };

    await createLog(
      `gojek_booking_request_${validPo.id}`,
      JSON.stringify(payload)
    );

    const response = await axios.post(`${GOJEK_URL}/booking`, payload, {
      headers: GOJEK_HEADERS,
    });

    if (response.status >= 200 && response.status < 300) {
      const data = response.data;

      const gojekRepository = dataSource.getRepository(GojekBooking);
      await saveEntity(gojekRepository, GojekBooking, {
        booking_id: data.orderNo,
        gojek_id: data.id,
        booking_type: data.bookingType,
        store_order_id: data.storeOrderId,
        error_message: data.errorMessage,
        prebook: data.prebook,
        prebook_message: data.prebookMessage,
      });

      return { success: true, data };
    } else {
      await logError(
        `error_gojek_booking_request_${
          request?.order_data?.po_id || "unknown"
        }`,
        JSON.stringify(response)
      );
    }

    return {
      success: false,
      error_message:
        response.headers["Error-Message"] || JSON.stringify(response.data),
      respon_header: response.headers,
      payload,
    };
  } catch (err: any) {
    await logError(
      `error_gojek_booking_request_${request?.order_data?.po_id || "unknown"}`,
      JSON.stringify(err.message)
    );
    throw err;
  }
}

export const webhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const expectedToken = "integration-prestisa-gojek-2025";
  const incomingToken = req.header("X-PRSTS-Token");

  if (incomingToken !== expectedToken) {
    return res.status(401).json({
      success: false,
      status: 401,
      message: "Unauthorized",
    });
  }

  const request = req.body;

  try {
    if (request && Object.keys(request).length > 0) {
      // Replace with your actual job dispatch / queue
      updateShippingGojek(request);

      return res.status(200).json({
        success: true,
        message: "Prestisa successfully receive webhook data",
        data: request,
      });
    } else {
      return res.status(200).json({
        success: true,
        message:
          "Successfully access webhook api, but no webhook data received",
        data: [],
      });
    }
  } catch (err: any) {
    await logError(
      `error_gojek_webhook_booking_id_${request?.booking_id || "unknown"}`,
      JSON.stringify(err.message)
    );

    return res.status(200).json({
      success: true,
      message: "Successfully access webhook api, but something wrong",
      data: [],
    });
  }
};
