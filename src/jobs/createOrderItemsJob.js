const moment = require("moment");
const Logs = require("../models/logs");
const Products = require("../models/products");
const ProductStock = require("../models/productStock");
const addShippingCostEstimation = require("../utils/shipping/addShippingCostEstimation");
const createGreetingsCardJob = require("./createGreetingsCardJob");
const createImageJob = require("./createImageJob");
const OrderItems = require("../models/orderItems");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { sendToLavenderFtp } = require("../utils/helpers");

/**
 * Helpers
 */
const MAX_MINUTES = 270;
const BP_CATEGORIES = [1, 2, 3, 32, 33];
const EXCLUDE_GREETING_IDS = [36, 37, 39, 40, 42, 43, 44, 45, 46, 47, 48];

async function processSpecialImage(base64, filename, fallbackPath) {
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
}

async function adjustStock(product, qty, userId) {
  product.qty -= qty;
  await product.save();

  await ProductStock.create({
    product_id: product.id,
    qty,
    type: "minus",
    category: 0,
    user_id: userId,
    remarks: "create order",
  });
}

function mapOrderItem(cart, product, index) {
  const city = cart.city || cart.province;

  return {
    product_id: cart.product_id,
    name: cart.name,
    price: cart.price,
    qty: cart.qty,
    image: cart.image,
    product_code: cart.product_code,
    subtotal: cart.subtotal,
    shipping_cost: cart.shipping_cost,
    shipping_cost_by_estimation: cart.shipping_cost_by_estimation || 0,
    shipping_expedition_by_estimation:
      cart.shipping_expedition_by_estimation || "-",
    shipping_estimation_error_log: cart.shipping_estimation_error_log || "-",
    shipping_expedition: cart.shipping_expedition,
    shipping_expedition_note: cart.shipping_expedition_note || "-",
    shipping_address: cart.shipping_address,
    sender_name: cart.sender_name,
    greetings: cart.greetings,
    receiver_name: cart.receiver_name,
    receiver_phone: cart.receiver_phone,
    notes: cart.notes || "",
    notes_internal: cart.notes_internal || "",
    occasion: cart.occasion || "null",
    city,
    country: cart.country,
    province: cart.province,
    district: cart.district,
    sub_district: cart.sub_district || "",
    id_district: cart.id_district || "",
    id_sub_district: cart.id_sub_district || "",
    date_time: cart.date_time,
    assignment: null,
    capital_price: cart.capital_price,
    shipping_express: cart.shipping_express || 0,
    special_request_logo: cart._processed_logo,
    special_request_image: cart._processed_image,
    product_type: cart.product_type || null,
    po_type: cart.po_type || null,
    shipping_method: cart.shipping_method || null,
    address_type: cart.address_type || null,
    pickup_lat: cart.pickup_lat || null,
    pickup_long: cart.pickup_long || null,
    marked_up_shipping_cost: cart.marked_up_shipping_cost || 0,
    assembly_cost: cart.assembly_cost || 0,
    express_fee: cart.express_fee || 0,
    selling_price: cart.selling_price || 0,
    checked: "",
  };
}

function buildShippingEstimationData(createdItems, cartList) {
  return createdItems
    .map((item, index) => {
      const cart = cartList[index];
      const distance = cart.distance || 0;
      const shipping_cost = cart.shipping_cost_by_estimation || 0;
      const courier_name = cart.shipping_expedition_by_estimation || "-";

      return {
        id: item.id,
        city_id: item.city,
        shipping_cost,
        distance: Math.round(distance * 100) / 100,
        cost_per_km: distance
          ? Math.ceil(shipping_cost / Math.ceil(distance))
          : 0,
        courier_name: courier_name || "No shipping available",
        error_log: cart.shipping_estimation_error_log || "-",
      };
    })
    .filter(Boolean);
}

async function handleGreetingsCard(order, items) {
  for (const item of items) {
    const product = await Products.findByPk(item.product_id);
    if (EXCLUDE_GREETING_IDS.includes(product.category_id)) continue;

    const cardPath =
      process.env.NODE_ENV === "production"
        ? `/assets/images/greetings_card/greetings_${item.id}.png`
        : `/assets/images/greetings_card/staging_greetings_${item.id}.png`;

    await OrderItems.update(
      { greetings_card: cardPath },
      { where: { id: item.id } }
    );

    await createGreetingsCardJob({
      pr: item,
      website: order.website,
      img: cardPath,
    });
  }
}

/**
 * Main job
 */
async function createOrderItemsJob(order, obj, userId, transaction) {
  try {
    const items = [];
    let vip = "NO"; // default

    for (let i = 0; i < obj.cart.length; i++) {
      const cart = obj.cart[i];
      const product = await Products.findByPk(cart.product_id);

      // --- VIP check piggybacked here ---
      if (product) {
        const diff = moment().diff(moment(cart.date_time), "minutes");
        const isbp = BP_CATEGORIES.includes(product.category_id);
        const desc = diff <= MAX_MINUTES;
        if (isbp && desc) {
          vip = "YES";
        }
      }

      // Process images
      if (cart.special_request_logo?.includes("base64")) {
        cart._processed_logo = await processSpecialImage(
          cart.special_request_logo,
          process.env.NODE_ENV === "production"
            ? `logo_${i}_${Date.now()}.png`
            : `staging_logo_${i}_${Date.now()}.png`,
          `/assets/images/custom_logo`
        );
      } else {
        cart._processed_logo = cart.special_request_logo || null;
      }

      if (cart.special_request_image?.includes("base64")) {
        cart._processed_image = await processSpecialImage(
          cart.special_request_image,
          process.env.NODE_ENV === "production"
            ? `image_${i}_${Date.now()}.png`
            : `staging_image_${i}_${Date.now()}.png`,
          `/assets/images/custom_image`
        );
      } else {
        cart._processed_image = cart.special_request_image || null;
      }

      // Build order item
      items.push(mapOrderItem(cart, product, i));

      // Stock adjustment if needed
      if (cart.shipping_method) {
        await adjustStock(product, cart.qty, userId);
      }
    }

    // Update VIP flag once after loop
    if (order.vip !== vip) {
      await order.update({ vip }, { transaction });
    }

    const createdItems = await OrderItems.bulkCreate(
      items.map((item) => ({ ...item, order_id: order.id })),
      { transaction }
    );

    // Handle shipping cost estimation
    const data = buildShippingEstimationData(createdItems, obj.cart);
    if (data.length > 0) {
      for (const dt of data) {
        await addShippingCostEstimation(dt);
      }
    } else {
      await Logs.create({
        name: `shipping_cost_estimation_error_${createdItems
          .map((i) => i.id)
          .join(",")}`,
        data: JSON.stringify(data, null, 2),
      });
    }

    handleGreetingsCard(order, createdItems);
  } catch (error) {
    await Logs.create({
      name: "error_create_gc",
      data: JSON.stringify({ msg: error.message, line: error.stack }),
    });
    throw error;
  }
}

module.exports = createOrderItemsJob;
