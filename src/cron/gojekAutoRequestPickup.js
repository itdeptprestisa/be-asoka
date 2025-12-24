// schedulers/gojekAutoRequestPickup.js
const cron = require("node-cron");
const dayjs = require("dayjs");
const { Between, In } = require("typeorm");

const { PurchaseOrder } = require("../entities/PurchaseOrder");
const { GojekBooking } = require("../entities/GojekBooking");
const { createLog, gojekBookingRequest } = require("../utils");

let isRunning = false;

function gojekAutoRequestPickup() {
  console.log("gojek_auto_request_pickup_active");

  // run every 1 minutes
  cron.schedule("*/1 * * * *", async () => {
    await createLog("gojek_scheduler_start_request_order", "");

    if (isRunning) {
      console.log("Skipping cron");
      return;
    }

    try {
      isRunning = true;
      // find purchase orders within 90 minutes window
      const purchaseOrders = await PurchaseOrder.find({
        where: {
          status: "on shipping",
          shipping_expedition: In(["GOJEK", "GOCAR"]),
          date_time: Between(
            dayjs().subtract(3, "hour").toDate(), // 3 jam ke belakang
            dayjs().add(90, "minute").toDate() // sampai 90 menit ke depan
          ),
        },
        relations: [
          "orderData",
          "customerData",
          "productsData",
          "supplierData",
        ],
        // take: 10, // chunk size
      });

      for (const po of purchaseOrders) {
        try {
          // check if latest booking exists
          const latestBooking = await GojekBooking.findOne({
            where: { store_order_id: po.id.toString() },
            order: { created_at: "DESC" },
          });

          if (!latestBooking) {
            await gojekBookingRequest(po, null, true);
            await createLog(
              "gojek_scheduler_finish_request_order",
              JSON.stringify(po)
            );
          }
        } catch (err) {
          await createLog(
            "error_gojek_scheduler_order",
            JSON.stringify({ error: err.message, po })
          );
        }
      }
    } catch (err) {
      await createLog(
        "error_gojek_scheduler_batch",
        JSON.stringify({ error: err.message })
      );
    } finally {
      isRunning = false;
    }
  });
}

module.exports = gojekAutoRequestPickup;
