import { NextFunction, Request, Response } from "express";
import { PurchaseOrder } from "../entities/PurchaseOrder";
import { BluebirdBooking } from "../entities/BluebirdBooking";
import { cancelOrder, createOrder } from "./bluebird_logistic/orderController";
import {
  cancelOrderService,
  CreateOrderPayload,
  createOrderService,
  getOrderDetailsByReferenceService,
} from "../services/bluebird_logistic/orderServices";
import { createLog, logError } from "../utils";

export const bookingStatus = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const expectedToken = "integration-prestisa-blue-bird-2025";

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

    const bookingData = await BluebirdBooking.findOne({
      where: { reference_no: req.query.po_id },
      order: { created_at: "DESC" },
    });

    if (!bookingData) {
      return res.status(400).json({
        success: false,
        message: "Failed to find booking data",
        data: [],
      });
    }

    const response = await getOrderDetailsByReferenceService(
      bookingData.reference_no.toString(),
      ""
    );

    const allBookingData = await BluebirdBooking.find({
      where: { reference_no: req.query.po_id },
      order: { created_at: "DESC" },
    });

    return res.json({
      success: true,
      data: response,
      history_data: allBookingData,
    });
  } catch (err: any) {
    await createLog(
      `error_blue_bird_order_status_${req.query.po_id}`,
      err.message
    );
    return res.status(400).json({
      success: false,
      message: err.message,
      data: [],
    });
  }
};

export const bookingCancellation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const request = req.body;
    const expectedToken = "integration-prestisa-blue-bird-2025";
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

    const bookingData = await BluebirdBooking.findOne({
      where: { reference_no: request.po_id },
      order: { created_at: "DESC" },
    });

    if (!bookingData) {
      return res.status(400).json({
        success: false,
        message: "Not allowed to cancel purchase order",
        data: [],
      });
    }

    const response = await cancelOrderService(
      {
        order_id: poData.order_id.toString(),
        reason_text: "Cancel by Prestisa",
        reference_no: poData.id.toString(),
      },
      ""
    );

    if (response.code >= 200 && response.code < 300) {
      const data = response;
      return res.json({
        success: true,
        data,
      });
    } else {
      return res.json({
        success: false,
        data: response,
      });
    }
  } catch (err: any) {
    logError(
      `error_blue_bird_cancel_order_${req.body?.po_id || "unknown"}`,
      err.message
    );

    next(err);
  }
};

export const requestPickupOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const expectedToken = "integration-prestisa-blue-bird-2025";
    const incomingToken = req.header("X-PRSTS-Token");

    if (incomingToken !== expectedToken) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: "Unauthorized",
      });
    }

    const po = await PurchaseOrder.findOne({
      where: { id: req.body.po_id, status: "on shipping" },
      relations: [
        "supplierData",
        "orderData",
        "customerData",
        "productsData",
        "orderItemsData",
      ],
    });

    if (!po) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Purchase Order not found",
      });
    }

    const payload: CreateOrderPayload = {
      reference_no: po.id.toString(),
      pickup_latitude: po.pickup_lat,
      pickup_longitude: po.pickup_long,
      pickup_address: po.shipping_address,
      pickup_instruction: "",
      dropoff_latitude: parseFloat(po.orderItemsData.receiver_latitude),
      dropoff_longitude: parseFloat(po.orderItemsData.receiver_longitude),
      dropoff_address: po.orderItemsData.shipping_address,
      customer_name: po.customerData.name,
      customer_phone: po.customerData.phone,
      customer_email: po.customerData.email,
      weight: po.productsData.weight || 5,
      height: po.productsData.height || 10,
      width: po.productsData.width,
      length: po.productsData.length,
      service_type: "LOG",
      contact_phone: po.customerData.phone,
      callback_url:
        "https://6328185b9a053ff9aab00e81.mockapi.io/rezaqalogistic",
      order_date: po.orderItemsData.date_time.toString(),
      contact_name: po.orderItemsData.sender_name,
    };

    const response = await createOrderService(payload, "null", "Sakura");

    if (response.code >= 200 && response.code < 300) {
      const data = response;
      return res.json({
        success: true,
        data,
      });
    } else {
      return res.json({
        success: false,
        data: response,
      });
    }
  } catch (err: any) {
    next(err);
  }
};
