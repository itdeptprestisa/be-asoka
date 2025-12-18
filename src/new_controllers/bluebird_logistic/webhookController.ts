import { Request, Response, NextFunction } from "express";
import {
  handleOrderWebhook,
  WebhookPayload,
} from "../../services/bluebird_logistic/webhookServices";
import { logError } from "../../utils";

export const blueBirdWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let payload: any = req.body;

    // if body is a string, try to parse it as JSON
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch (err) {
        return res.status(400).json({
          code: 400,
          message: "Invalid JSON payload",
        });
      }
    }

    // now payload is guaranteed to be an object
    if (!payload.order_id || !payload.order_status_id) {
      return res.status(400).json({
        code: 400,
        message: "Missing required fields: order_id or order_status_id",
      });
    }

    handleOrderWebhook(payload).catch((error) => {
      console.error("Error processing webhook:", error);
    });

    return res.status(200).json({
      code: 200,
      message: "OK",
    });
  } catch (error) {
    await logError("bluebird_webhook_error", error);
    return res.status(200).json({
      code: 200,
      message: "OK",
    });
  }
};
