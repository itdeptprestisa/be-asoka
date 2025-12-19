// services/updateShippingGojek.ts
import { getRepository } from "typeorm";
import { GojekBooking } from "../entities/GojekBooking";
import { PurchaseOrder } from "../entities/PurchaseOrder";
import { Logs } from "../entities/Logs";
// import { OrderSelectionController } from "../controllers/OrderSelectionController"; // adapt path
import { Request } from "express";
import dataSource from "../config/dataSource";
import { createLog } from "../utils";
import { uploadLocationImage } from "./uploadLocationImage";

// helper to reformat phone numbers
function phoneReformat(phone?: string): string | null {
  if (!phone) return null;
  return phone.replace(/^62/, "0");
}

export async function updateShippingGojek(request: any): Promise<void> {
  const bookingRepo = dataSource.getRepository(GojekBooking);

  const bookingData = await GojekBooking.findOne({
    where: { booking_id: request.booking_id },
  });

  if (bookingData) {
    const originalType = bookingData.type;

    bookingData.price = request.price ?? null;
    bookingData.status = request.status ?? null;
    bookingData.type = request.type ?? null;
    bookingData.driver_name = request.driver_name ?? null;
    bookingData.delivery_eta = request.delivery_eta ?? null;
    bookingData.driver_phone = phoneReformat(request.driver_phone) ?? null;
    bookingData.driver_phone2 = phoneReformat(request.driver_phone2) ?? null;
    bookingData.driver_phone3 = phoneReformat(request.driver_phone3) ?? null;
    bookingData.driver_photo_url = request.driver_photo_url ?? null;
    bookingData.cancellation_reason = request.cancellation_reason ?? null;
    bookingData.total_distance_in_kms = request.total_distance_in_kms ?? null;
    bookingData.live_tracking_url = request.live_tracking_url ?? null;

    await bookingRepo.save(bookingData);

    const purchaseOrder = await PurchaseOrder.findOne({
      where: { id: Number(bookingData.store_order_id) },
    });

    if (purchaseOrder) {
      await createLog(`gojek_webhook_start_po_${purchaseOrder.id}`, "");

      try {
        if (request.type === "COMPLETED") {
          // avoid repetition
          if (originalType !== "COMPLETED") {
            await uploadLocationImage({
              po_id: purchaseOrder.id,
              courier: "GOJEK",
              img_location: request.live_tracking_url,
            });
          }
        }
      } catch (err: any) {
        await createLog(
          `gojek_webhook_error_po_${purchaseOrder.id}`,
          JSON.stringify({ msg: err.message, line: err.line })
        );
      }
    }
  } else {
    await createLog(
      `gojek_webhook_not_found_booking_id_${request.booking_id}`,
      JSON.stringify(request)
    );
  }
}
