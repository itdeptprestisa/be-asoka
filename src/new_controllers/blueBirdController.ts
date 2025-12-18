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
import {
  createLog,
  logError,
  normalizeBlueBirdHistoryResponse,
} from "../utils";
import { fetchAccessToken } from "../services/bluebird_logistic/authServices";
import moment from "moment";

export const bookingMonitoring = async (
  req: Request,
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

    // Pagination
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const perPage = Math.max(
      1,
      parseInt(req.query.per_page as string, 10) || 10
    );
    const skip = (page - 1) * perPage;

    // Filters
    const { status, date_start, date_end, keyword } = req.query;

    const qb = BluebirdBooking.createQueryBuilder("booking")
      .leftJoinAndSelect("booking.purchaseOrderData", "purchaseOrderData")
      .leftJoinAndSelect("purchaseOrderData.productsData", "productsData")
      .leftJoinAndSelect(
        "productsData.productCategoryNewData",
        "productCategoryNewData"
      )
      .orderBy("booking.created_at", "DESC")
      .skip(skip)
      .take(perPage);

    // ✅ Status filter (comma separated values)
    if (status) {
      const statusArray = (status as string).split(",").map((s) => s.trim());
      qb.andWhere("booking.order_status_id IN (:...statusArray)", {
        statusArray,
      });
    }

    // ✅ Date range filter
    if (date_start && date_end) {
      qb.andWhere("booking.order_date BETWEEN :start AND :end", {
        start: date_start,
        end: date_end,
      });
    } else if (date_start) {
      qb.andWhere("booking.order_date >= :start", { start: date_start });
    } else if (date_end) {
      qb.andWhere("booking.order_date <= :end", { end: date_end });
    }

    // ✅ Keyword filter (booking_id or po_id)
    if (keyword) {
      qb.andWhere(
        "(booking.bluebird_order_id LIKE :kw OR booking.reference_no LIKE :kw)",
        { kw: `%${keyword}%` }
      );
    }

    const [response, totalCount] = await qb.getManyAndCount();

    // ✅ Normalize response
    const normalizedResponse = response.map((booking) => ({
      ...booking,
      purchaseOrderData: {
        id: booking.purchaseOrderData?.id,
        date_time: booking.purchaseOrderData?.date_time,
        product_name: booking.purchaseOrderData?.productsData?.name,
        category_name:
          booking.purchaseOrderData?.productsData?.productCategoryNewData?.name,
      },
    }));

    return res.json({
      success: true,
      data: normalizedResponse,
      meta: {
        page,
        per_page: perPage,
        total: totalCount,
        total_pages: Math.ceil(totalCount / perPage),
      },
    });
  } catch (err: any) {
    next(err);
  }
};

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

    const tokenData = await fetchAccessToken();

    let response: any = null;
    try {
      response = await getOrderDetailsByReferenceService(
        bookingData.reference_no.toString(),
        tokenData.access_token
      );
    } catch (apiErr: any) {
      // log but don't fail the whole endpoint
      await createLog(
        `error_blue_bird_order_status_${req.query.po_id}`,
        apiErr.message
      );
      response = null;
    }

    const allBookingData = await BluebirdBooking.find({
      where: { reference_no: req.query.po_id },
      order: { created_at: "DESC" },
    });

    const normalizedHistory = allBookingData.map((v) => {
      return normalizeBlueBirdHistoryResponse(v);
    });

    return res.json({
      success: true,
      data: response, // raw Bluebird API response if you still want it
      history_data: normalizedHistory, // normalized to your sample format
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

    const tokenData = await fetchAccessToken();

    const response = await cancelOrderService(
      {
        order_id: bookingData.bluebird_order_id,
        reason_text: "Sakura order cancelled by Asoka system",
        reference_no: bookingData.reference_no.toString(),
      },
      tokenData.access_token
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
      pickup_instruction: "Tidak ada",
      dropoff_latitude: parseFloat(po.orderItemsData.receiver_latitude),
      dropoff_longitude: parseFloat(po.orderItemsData.receiver_longitude),
      dropoff_address: po.orderItemsData.shipping_address,
      customer_name: po.customerData.name,
      customer_phone: po.customerData.phone,
      customer_email: po.customerData.email,
      weight: po.productsData.weight * po.qty || 5,
      height: po.productsData.height * po.qty || 10,
      width: po.productsData.width * po.qty || 10,
      length: po.productsData.length * po.qty || 10,
      service_type: "LOG",
      contact_phone: po.customerData.phone,
      callback_url: "",
      order_date: moment(po.date_time).utcOffset(7).toISOString(true),
      contact_name: po.orderItemsData.sender_name,
      order_items: [
        {
          quantity: po.orderItemsData.qty,
          product_name: po.product_name,
          weight: po.productsData.weight || 5,
          height: po.productsData.height || 10,
          width: po.productsData.width || 10,
          length: po.productsData.length || 10,
        },
      ],
    };

    const tokenData = await fetchAccessToken();
    // console.log("first", JSON.stringify(payload), tokenData.access_token);
    const response = await createOrderService(
      payload,
      tokenData.access_token,
      "Sakura"
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
    next(err);
  }
};
