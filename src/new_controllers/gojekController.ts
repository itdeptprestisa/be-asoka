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
import { getFarePriceEstimationService } from "../services/bluebird_logistic/fareServices";

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

    if (!bookingData) {
      return res.status(400).json({
        success: false,
        message: "Not allowed to cancel purchase order",
        data: [],
      });
    }

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
      relations: ["supplierData", "customerData"],
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
      return {
        success: false,
        message: "Location purchase order not valid",
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
            orderItems
              .map((oi) => oi.productsData?.productCategoryNewData?.name)
              .filter(Boolean)
              .join(", ") || "Produk Prestisa",
          storeOrderId: String(validPo.id),
          insuranceDetails: {
            applied: "true",
            fee: "2500",
            product_description:
              orderItems.map((oi) => oi.productsData?.name).join(", ") ||
              "Produk Prestisa",
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
