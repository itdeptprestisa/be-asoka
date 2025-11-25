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
}

export const handleOrderWebhook = async (
  payload: WebhookPayload
): Promise<void> => {
  console.log("Webhook received:", payload);

  switch (payload.order_status_id.trim()) {
    case "1":
      // TODO: Handle "Order Created" status
      console.log("Order created:", payload.order_id);
      break;
    case "2":
      // TODO: Handle "Order Pickup" status
      console.log("Order Pickup:", payload.order_id);
      break;
    case "3":
      // TODO: Handle "In Progress" status
      console.log("Order In Progress:", payload.order_id);
      break;
    case "4":
      // TODO: Handle "Unsuccessful" status
      console.log("Order Unsuccessful:", payload.order_id);
      break;
    case "5":
      // TODO: Handle "Completed" status
      console.log("Order Completed:", payload.order_id);
      break;
    case "6":
      // TODO: Handle "Request Fleet" status
      console.log("Request Fleet:", payload.order_id);
      break;
    case "7":
      // TODO: Handle "Cancel by Partner" status
      console.log("Order Cancelled by Partner:", payload.order_id);
      break;
    case "8":
      // TODO: Handle "Cancel by Operator" status
      console.log("Order Cancelled by Operator:", payload.order_id);
      break;
    case "9":
      // TODO: Handle "Hold" status
      console.log("Order on Hold:", payload.order_id);
      break;
    case "10":
      // TODO: Handle "Cancel by System" status
      console.log("Order Cancelled by System:", payload.order_id);
      break;
    case "12":
      // TODO: Handle "Complete Undelivered" status
      console.log("Complete Undelivered:", payload.order_id);
      break;

    default:
      console.log("Unknown status:", payload.order_status_id);
  }
};
