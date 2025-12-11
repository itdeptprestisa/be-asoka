// import BluebirdBooking from "../../models/BluebirdBooking";
const BluebirdBooking = require("../../models/bluebirdBooking");

export interface WebhookPayload {
  order_id: string;
  reference_no: string;
  order_status_id: string;
  order_status_description: string;
  note: string;
  vehicle_no: string;
  driver_name: string;
  driver_phone: string;
  sender_name: string;
  receiver_name: string;
  signature_key: string;
  event_time: string;
  change_by: string;
  photo_sender1: string;
  photo_sender2: string;
  photo_receiver1: string;
  photo_receiver2: string;
  delivery_status?: string | null;
  undelivery_reason?: string | null;
  tracking_link?: string | null;
}

const updateBookingRecord = async (payload: WebhookPayload): Promise<void> => {
  try {
    const existingBooking = await BluebirdBooking.findOne({
      where: {
        bluebird_order_id: payload.order_id,
      },
    });

    const bookingData = {
      bluebird_order_id: payload.order_id,
      order_status_id: payload.order_status_id,
      order_status_description: payload.order_status_description,
      note: payload.note || null,
      vehicle_no: payload.vehicle_no || null,
      driver_name: payload.driver_name || null,
      driver_phone: payload.driver_phone || null,
      sender_name: payload.sender_name || null,
      receiver_name: payload.receiver_name || null,
      signature_key: payload.signature_key || null,
      event_time: payload.event_time || null,
      change_by: payload.change_by || null,
      photo_sender_1: payload.photo_sender1 || null,
      photo_sender_2: payload.photo_sender2 || null,
      photo_receiver_1: payload.photo_receiver1 || null,
      photo_receiver_2: payload.photo_receiver2 || null,
      delivery_status: payload.delivery_status || null,
      undelivery_reason: payload.undelivery_reason || null,
      tracking_link: !payload.tracking_link
        ? existingBooking.tracking_link
        : payload.tracking_link,
    };

    if (existingBooking) {
      await existingBooking.update(bookingData);
      console.log(`Updated booking record for order: ${payload.order_id}`);
    } else {
      await BluebirdBooking.create({
        reference_no: payload.reference_no,
        ...bookingData,
      });
      console.log(`Created new booking record for order: ${payload.order_id}`);
    }
  } catch (error) {
    console.error("Failed to update booking record:", error);
    throw error;
  }
};

/**
 * Sets delivery status based on order status
 */
const getDeliveryStatus = (orderStatusId: string): string => {
  switch (orderStatusId) {
    case "1": // Order Created
    case "6": // Request Fleet
      return "pending";
    case "2": // Driver Picking Order
      return "picked_up";
    case "3": // Delivery in Progress
      return "in_transit";
    case "4": // Unsuccessful
      return "unsucessful";
    case "5": // Completed
      return "delivered";
    case "12": // Complete Undelivered
      return "undelivered";
    case "7": // Cancel by Partner
    case "8": // Cancel by Operator
    case "10": // Cancel by System
      return "cancelled";
    case "9": // Hold
      return "on_hold";
    default:
      return "unknown";
  }
};

export const handleOrderWebhook = async (
  payload: WebhookPayload
): Promise<void> => {
  console.log("Webhook received:", payload);

  if (!payload.delivery_status) {
    payload.delivery_status = getDeliveryStatus(payload.order_status_id);
  }

  try {
    switch (String(payload.order_status_id)) {
      case "1":
        // Order Created - Initial record creation
        console.log("Order created:", payload.order_id);
        await updateBookingRecord(payload);
        break;

      case "2":
        // Driver is picking up order
        console.log("Driver picking up order:", payload.order_id);
        await updateBookingRecord(payload);
        break;
      case "3":
        // Delivery in Progress - driver info and sender photos available
        console.log("Order in progress:", payload.order_id);
        await updateBookingRecord(payload);
        break;
      case "4":
        // Unsucessful - driver info and sender photos available
        console.log("Unsuccessful:", payload.order_id);
        await updateBookingRecord(payload);
        break;

      case "5":
        // Completed - all photos available
        console.log("Order completed:", payload.order_id);
        await updateBookingRecord(payload);
        break;

      case "6":
        // Request Fleet - waiting for driver assignment
        console.log("Request fleet:", payload.order_id);
        await updateBookingRecord(payload);
        break;

      case "7":
        // Cancel by Partner
        console.log("Order cancelled by partner:", payload.order_id);
        await updateBookingRecord(payload);
        break;

      case "8":
        // Cancel by Operator
        console.log("Order cancelled by operator:", payload.order_id);
        await updateBookingRecord(payload);
        break;

      case "9":
        // Hold
        console.log("Order on hold:", payload.order_id);
        await updateBookingRecord(payload);
        break;

      case "10":
        // Cancel by System
        console.log("Order cancelled by system:", payload.order_id);
        await updateBookingRecord(payload);
        break;

      case "12":
        // Complete Undelivered
        console.log("Order completed but undelivered:", payload.order_id);
        await updateBookingRecord(payload);
        break;

      default:
        console.log("Unknown status:", payload.order_status_id);
        await updateBookingRecord(payload);
    }

    console.log(
      `Successfully processed webhook for order: ${payload.order_id}`
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    throw error;
  }
};
