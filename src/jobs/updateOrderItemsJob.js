const { Orders } = require("../models");
const Logs = require("../models/logs");
const OrderItems = require("../models/orderItems");
const Products = require("../models/products");
const ProductStock = require("../models/productStock");
const ShippingCostEstimation = require("../models/shippingCostEstimation");
const addShippingCostEstimation = require("../utils/shipping/addShippingCostEstimation");
const createGreetingsCardJob = require("./createGreetingsCardJob");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const createImageJob = require("./createImageJob");
const { sendToLavenderFtp } = require("../utils/helpers");

async function syncOrderItems(orderInstance, invoiceItems) {
  // 1. Soft delete existing items
  await OrderItems.update(
    { deleted_at: new Date() }, // assuming you use paranoid soft delete
    { where: { order_id: orderInstance.id } }
  );

  // 2. Insert new items
  const savedItems = [];
  for (const invoiceItem of invoiceItems) {
    const { id, ...rest } = invoiceItem; // remove id
    const created = await OrderItems.create({
      ...rest,
      order_id: orderInstance.id,
    });
    savedItems.push(created);
  }

  // 3. Shipping estimation logic
  const estimationData = [];
  for (let i = 0; i < savedItems.length; i++) {
    const item = savedItems[i];
    const cartItem = invoiceItems[i];
    const {
      distance,
      shipping_cost_by_estimation: shippingCost,
      shipping_expedition_by_estimation: courierName,
      shipping_estimation_error_log: errorLog,
    } = cartItem;

    let previousData = null;
    if (errorLog === "-" && shippingCost === 0) {
      previousData = await ShippingCostEstimation.findOne({
        where: { order_items_id: item.id },
      });
    }

    if (distance) {
      estimationData.push({
        id: item.id,
        city_id: item.city,
        shipping_cost: shippingCost,
        distance: Math.round(distance * 100) / 100,
        cost_per_km: Math.ceil(shippingCost / Math.ceil(distance)),
        courier_name: courierName,
        error_log: errorLog,
      });
    } else if (previousData) {
      estimationData.push({
        id: item.id,
        city_id: item.city,
        shipping_cost: previousData.shipping_cost,
        distance: previousData.distance,
        cost_per_km: previousData.cost_per_km,
        courier_name: previousData.courier_name || "No shipping available",
        error_log: "order items has been edited without changing location",
      });
    } else {
      estimationData.push({
        id: item.id,
        city_id: item.city,
        shipping_cost: 0,
        distance: 0,
        cost_per_km: 0,
        courier_name: courierName || "No shipping available",
        error_log: errorLog,
      });
    }
  }

  // 4. Dispatch shipping cost estimation
  if (estimationData.length > 0) {
    for (const data of estimationData) {
      await addShippingCostEstimation(data);
    }
  } else {
    const createdIds = savedItems.map((i) => i.id).join(",");
    await Logs.create({
      name: `shipping_cost_estimation_error_${createdIds}`,
      data: JSON.stringify(estimationData),
    });
  }
}

async function updateOrderItemsJob(orderId, cartData) {
  try {
    const order = await Orders.findByPk(orderId);
    const items = [];

    for (let i = 0; i < cartData.length; i++) {
      const cart = cartData[i];
      const product = await Products.findByPk(cart.product_id);
      const isBungaPapan = [1, 2, 3, 32, 33].includes(product.category_id);
      const diffMinutes =
        Math.abs(new Date(cart.date_time) - new Date()) / 60000;

      await order.update({
        vip: isBungaPapan && diffMinutes <= 270 ? "YES" : "NO",
      });

      const saveImage = async (base64, filename, fallbackPath) => {
        const localPath = path.join(
          process.cwd(),
          "storage",
          "app",
          "images",
          "faktur",
          filename
        );

        fs.mkdirSync(path.dirname(localPath), { recursive: true });

        const base64Data = base64.replace(/^data:.*;base64,/, "");
        fs.writeFileSync(localPath, Buffer.from(base64Data, "base64"));

        await createImageJob({ src: localPath, dest: localPath });
        await sendToLavenderFtp(localPath, `${fallbackPath}/${filename}`);

        return `${fallbackPath}/${filename}`;
      };

      let special_request_logo = null;
      let special_request_image = null;

      if (
        cart.special_request_logo &&
        cart.special_request_logo.includes("base64")
      ) {
        special_request_logo = await saveImage(
          cart.special_request_logo,
          process.env.NODE_ENV === "production"
            ? `logo_${i}_${Date.now()}.png`
            : `staging_logo_${i}_${Date.now()}.png`,
          `/assets/images/custom_logo`
        );
      } else {
        special_request_logo = cart.special_request_logo || null;
      }

      if (
        cart.special_request_image &&
        cart.special_request_image.includes("base64")
      ) {
        special_request_image = await saveImage(
          cart.special_request_image,
          process.env.NODE_ENV === "production"
            ? `image_${i}_${Date.now()}.png`
            : `staging_image_${i}_${Date.now()}.png`,
          `/assets/images/custom_image`
        );
      } else {
        special_request_image = cart.special_request_image || null;
      }

      items.push({
        ...cart,
        id: undefined, // ❌ ensure id is not carried over
        special_request_logo,
        special_request_image,
        shipping_cost_by_estimation: cart.shipping_cost_by_estimation || 0,
        shipping_expedition_by_estimation:
          cart.shipping_expedition_by_estimation || "-",
        shipping_estimation_error_log:
          cart.shipping_estimation_error_log || "-",
        shipping_expedition: cart.shipping_expedition || "-",
        shipping_expedition_note: cart.shipping_expedition_note || "-",
        notes: cart.notes || "",
        notes_internal: cart.notes_internal || "",
        occasion: cart.occasion || "null",
        district: cart.district || null,
        sub_district: cart.sub_district || null,
        id_district: cart.id_district || null,
        id_sub_district: cart.id_sub_district || null,
        assignment: null,
        shipping_express: cart.shipping_express || 0,
        po_type: cart.po_type || null,
        shipping_method: cart.shipping_method || null,
        address_type: cart.address_type || null,
        pickup_lat: cart.pickup_lat || null,
        pickup_long: cart.pickup_long || null,
        distance: cart.distance || 0,
        marked_up_shipping_cost: cart.marked_up_shipping_cost || 0,
        assembly_cost: cart.assembly_cost || 0,
        express_fee: cart.express_fee || 0,
        selling_price: cart.selling_price || 0,
      });
    }

    // Restore stock from old items
    const oldItems = await OrderItems.findAll({
      where: { order_id: order.id },
    });
    for (const item of oldItems) {
      if (item.shipping_method) {
        const product = await Products.findByPk(item.product_id);
        await product.increment("qty", { by: item.qty });

        await ProductStock.create({
          product_id: product.id,
          qty: item.qty,
          type: "plus",
          category: 0,
          user_id: 1,
          remarks: `edit order id = ${order.id}`,
        });
      }
    }

    // Deduct stock from new items
    for (const item of cartData) {
      if (item.shipping_method) {
        const product = await Products.findByPk(item.product_id);
        await product.decrement("qty", { by: item.qty });

        await ProductStock.create({
          product_id: product.id,
          qty: item.qty,
          type: "minus",
          category: 0,
          user_id: 1,
          remarks: `edit order id = ${order.id}`,
        });
      }
    }

    // Sync items
    await syncOrderItems(order, items);

    // Generate greetings card
    const createdItems = await OrderItems.findAll({
      where: { order_id: order.id },
    });

    for (const item of createdItems) {
      const product = await Products.findByPk(item.product_id);
      const excluded = [36, 37, 39, 40, 42, 43, 44, 45, 46, 47, 48];
      if (excluded.includes(product.category_id)) continue;

      const cardPath =
        process.env.NODE_ENV === "production"
          ? `/assets/images/greetings_card/greetings_${item.id}.png`
          : `/assets/images/greetings_card/staging_greetings_${item.id}.png`;

      await item.update({ greetings_card: cardPath });

      await createGreetingsCardJob({
        pr: item,
        website: order.website,
        img: cardPath,
      });
    }
  } catch (error) {
    await Logs.create({
      name: "error_create_gc",
      data: JSON.stringify({
        msg: error.message,
        line: error.stack?.split("\n")[1] || "unknown",
      }),
    });
    console.error("Error in updateOrderItemsJob:", error);
    throw error;
  }
}

module.exports = updateOrderItemsJob;
