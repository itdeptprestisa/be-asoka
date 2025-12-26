// schedulers/gojekAutoRequestPickup.js
const cron = require("node-cron");
const dayjs = require("dayjs");
const { In, Between } = require("typeorm");

const { PurchaseOrder } = require("../entities/PurchaseOrder");
const { GojekBooking } = require("../entities/GojekBooking");
const { createLog, gojekBookingRequest } = require("../utils");

let isRunning = false;

function gojekAutoRequestPickup() {
  console.log("gojek_auto_request_pickup_active");

  // run every 1 minute
  cron.schedule("*/1 * * * *", async () => {
    await createLog("gojek_scheduler_start_request_order", "");

    if (isRunning) {
      console.log("Skipping cron");
      return;
    }

    try {
      isRunning = true;

      const now = dayjs();

      // batas bawah: 90 menit sebelum sekarang
      const minDate = now.subtract(90, "minute").toDate();
      // batas atas: 3 jam setelah sekarang
      const maxDate = now.add(3, "hour").toDate();

      // find purchase orders within window
      const purchaseOrders = await PurchaseOrder.find({
        where: {
          status: "on shipping",
          shipping_expedition: In(["GOJEK", "GOCAR"]),
          date_time: Between(minDate, maxDate),
        },
        relations: [
          "orderData",
          "customerData",
          "productsData",
          "supplierData",
        ],
      });

      for (const po of purchaseOrders) {
        try {
          const dt = dayjs(po.date_time);

          // validasi window lagi (double protect)
          const inWindow =
            now.isAfter(dt.subtract(90, "minute")) &&
            now.isBefore(dt.add(3, "hour"));

          if (!inWindow) {
            continue;
          }

          // check if latest booking exists
          const latestBooking = await GojekBooking.findOne({
            where: { store_order_id: po.id.toString() },
            order: { created_at: "DESC" },
          });

          if (!latestBooking) {
            await gojekBookingRequest(po, null, true);
            await createLog(
              `gojek_scheduler_finish_request_order_asoka_${po.id}`,
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
