// schedulers/gojekAutoRequestPickup.js
const cron = require("node-cron");
const dayjs = require("dayjs");
const { Between } = require("typeorm");

const { PurchaseOrder } = require("../entities/PurchaseOrder");
const { BluebirdBooking } = require("../entities/BluebirdBooking");
const { createLog } = require("../utils");
const {
  createOrderService,
} = require("../services/bluebird_logistic/orderServices");
const {
  fetchAccessToken,
} = require("../services/bluebird_logistic/authServices");

function blueBirdAutoRequestPickup() {
  console.log("blue_bird_auto_request_pickup_active");

  // run every 5 minutes
  cron.schedule("*/1 * * * *", async () => {
    await createLog("blue_bird_scheduler_start_request_order", "");
    const tokenData = await fetchAccessToken();

    try {
      // find purchase orders within 90 minutes window
      const purchaseOrders = await PurchaseOrder.find({
        where: {
          status: "on shipping",
          date_time: Between(
            dayjs().toDate(),
            dayjs().add(90, "minute").toDate()
          ),
        },
        relations: [
          "orderData",
          "orderItemsData",
          "customerData",
          "productsData",
          "supplierData",
        ],
        take: 10, // chunk size
      });

      for (const po of purchaseOrders) {
        try {
          // check if latest booking exists
          const latestBooking = await BluebirdBooking.findOne({
            where: { reference_no: po.id },
            order: { created_at: "DESC" },
          });

          if (!latestBooking) {
            const payload = {
              reference_no: po.id,
              pickup_latitude: po.pickup_lat,
              pickup_longitude: po.pickup_long,
              pickup_address: po.shipping_address,
              pickup_instruction: "",
              dropoff_latitude: parseFloat(po.orderItemsData.receiver_latitude),
              dropoff_longitude: parseFloat(
                po.orderItemsData.receiver_longitude
              ),
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
              callback_url: `${process.env.BE_ASOKA_BASE_URL}/bluebird/webhook`,
              order_date: po.orderItemsData.date_time,
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
            await createOrderService(payload, tokenData.access_token, "Sakura");
            await createLog(
              "blue_bird_scheduler_finish_request_order",
              JSON.stringify(po)
            );
          } else {
            await createLog(
              "blue_bird_scheduler_skip_request_order",
              JSON.stringify(po)
            );
          }
        } catch (err) {
          await createLog(
            "error_blue_bird_scheduler_order",
            JSON.stringify({ error: err.message, po })
          );
        }
      }
    } catch (err) {
      await createLog(
        "error_blue_bird_scheduler_batch",
        JSON.stringify({ error: err.message })
      );
    }
  });
}

module.exports = blueBirdAutoRequestPickup;
