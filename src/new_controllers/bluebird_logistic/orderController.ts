import { Request, Response, NextFunction } from "express";
import {
  CancelOrderPayload,
  cancelOrderService,
  CreateOrderPayload,
  createOrderService,
  getOrderDetailsByReferenceService,
  getOrderDetailsService,
  getOrderTrackingService,
} from "../../services/bluebird_logistic/orderServices";

export const createOrder = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authorization token is required",
    });
  }

  const accessToken = authHeader.split(" ")[1] || "";

  const orderData: CreateOrderPayload = req.body;

  const result = await createOrderService(orderData, accessToken, "Asoka");

  return res.status(201).json({
    data: result,
    message: "Order created successfully",
  });
};

export const cancelOrder = async (
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

    const cancelOrderPayload: CancelOrderPayload = req.body;
    const orderId = cancelOrderPayload.order_id;

    if (!orderId) {
      return res.status(400).json({
        message: "order_id is required",
      });
    }

    const result = await cancelOrderService(cancelOrderPayload, accessToken);

    return res.status(201).json({
      data: result,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderDetails = async (
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
    const orderId = req.params.orderId;

    if (!orderId) {
      return res.status(400).json({
        message: "order_id is required",
      });
    }

    const result = await getOrderDetailsService(orderId, accessToken);

    return res.json({
      data: result,
      message: "Order details retrieved successfully",
    });
  } catch (error) {
    console.log(error, "error");
    next(error);
  }
};

export const getOrderDetailsByReference = async (
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

    const referenceNo = req.params.referenceNo;

    if (!referenceNo) {
      return res.status(400).json({
        message: "reference_no is required",
      });
    }

    const result = await getOrderDetailsByReferenceService(
      referenceNo,
      accessToken
    );

    return res.json({
      data: result,
      message: "Order details retrieved successfully",
    });
  } catch (error) {
    console.log(error, "error");
    next(error);
  }
};

export const getOrderTracking = async (
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

    const orderId = req.params.orderId;

    if (!orderId) {
      return res.status(400).json({
        message: "order_id is required",
      });
    }

    const result = await getOrderTrackingService(orderId, accessToken);

    return res.json({
      data: result,
      message: "Order tracking retrieved successfully",
    });
  } catch (error) {
    console.log(error, "error");
    next(error);
  }
};
