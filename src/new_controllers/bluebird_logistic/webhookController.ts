import { Request, Response, NextFunction } from "express";
import {
  handleOrderWebhook,
  WebhookPayload,
} from "../../services/bluebird_logistic/webhookServices";

export const blueBirdWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload: WebhookPayload = req.body;

    if (!payload.order_id || !payload.order_status_id) {
      return res.status(400).json({
        code: 400,
        message: "Missing required fields: order_id or order_status_id",
      });
    }

    console.log(payload, "payload");
    handleOrderWebhook(payload).catch((error) => {
      console.error("Error processing webhook:", error);
    });

    return res.status(200).json({
      code: 200,
      message: "OK",
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(200).json({
      code: 200,
      message: "OK",
    });
  }
};
