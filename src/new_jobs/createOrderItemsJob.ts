import moment from "moment";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { OrderItems } from "../entities/OrderItems";
import { Products } from "../entities/Products";
import { ProductStock } from "../entities/ProductStock";
import { Logs } from "../entities/Logs";
import { Order } from "../entities/Order";
import { createGreetingsCardJob } from "../jobs/createGreetingsCardJob";
import { createImageJob } from "../jobs/createImageJob";
import { addShippingCostEstimation } from "../utils/shipping/addShippingCostEstimation";
import { createLog, logError, saveEntity, sendToLavenderFtp } from "../utils";

const MAX_MINUTES = 270;
const BP_CATEGORIES = [1, 2, 3, 32, 33];
const EXCLUDE_GREETING_IDS = [36, 37, 39, 40, 42, 43, 44, 45, 46, 47, 48];

async function processSpecialImage(
  base64: string,
  filename: string,
  fallbackPath: string
): Promise<string> {
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

async function adjustStock(
  product: Products,
  qty: number,
  userId: number,
  queryRunner
) {
  product.qty -= qty;
  await queryRunner.manager.save(product);

  const stock = queryRunner.manager.create(ProductStock, {
    product_id: product.id,
    qty,
    type: "minus",
    category: 0,
    user_id: userId,
    remarks: "create order",
  });

  await queryRunner.manager.save(stock);
}

function mapOrderItem(cart, product: Products, index: number) {
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
    on_time_delivery: cart.on_time_delivery || 0,
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

async function handleGreetingsCard(
  order: Order,
  items: OrderItems[],
  queryRunner
) {
  for (const item of items) {
    const product = await queryRunner.manager.findOne(Products, {
      where: { id: item.product_id },
    });
    if (!product || EXCLUDE_GREETING_IDS.includes(product.category_id))
      continue;

    const cardPath =
      process.env.NODE_ENV === "production"
        ? `/assets/images/greetings_card/greetings_${item.id}.png`
        : `/assets/images/greetings_card/staging_greetings_${item.id}.png`;

    await saveEntity(queryRunner.manager, OrderItems, {
      id: item.id,
      greetings_card: cardPath,
    });

    await createGreetingsCardJob({
      pr: item,
      website: order.website,
      img: cardPath,
    });
  }
}

export async function createOrderItemsJob(
  order: Order,
  obj,
  userId: number,
  queryRunner
) {
  if (!queryRunner.isTransactionActive) {
    throw new Error(
      "Transaction must be started before calling createOrderItemsJob"
    );
  }

  try {
    const items = [];
    let vip = "NO";

    for (let i = 0; i < obj.cart.length; i++) {
      const cart = obj.cart[i];
      const product = await queryRunner.manager.findOne(Products, {
        where: { id: cart.product_id },
      });

      if (product) {
        const diff = moment().diff(moment(cart.date_time), "minutes");
        const isbp = BP_CATEGORIES.includes(product.category_id);
        if (isbp && diff <= MAX_MINUTES) vip = "YES";
      }

      cart._processed_logo = cart.special_request_logo?.includes("base64")
        ? await processSpecialImage(
            cart.special_request_logo,
            process.env.NODE_ENV === "production"
              ? `logo_${i}_${Date.now()}.png`
              : `staging_logo_${i}_${Date.now()}.png`,
            `/assets/images/custom_logo`
          )
        : cart.special_request_logo || null;

      cart._processed_image = cart.special_request_image?.includes("base64")
        ? await processSpecialImage(
            cart.special_request_image,
            process.env.NODE_ENV === "production"
              ? `image_${i}_${Date.now()}.png`
              : `staging_image_${i}_${Date.now()}.png`,
            `/assets/images/custom_image`
          )
        : cart.special_request_image || null;

      items.push(mapOrderItem(cart, product, i));

      if (cart.shipping_method && product) {
        await adjustStock(product, cart.qty, userId, queryRunner);
      }
    }

    if (order.vip !== vip) {
      await saveEntity(queryRunner.manager, Order, { id: order.id, vip });
    }

    const orderItemsRepo = queryRunner.manager.getRepository(OrderItems);
    const entities = items.map((item) =>
      orderItemsRepo.create({ ...item, order_id: order.id })
    );
    const createdItems = await orderItemsRepo.save(entities);

    const estimationData = buildShippingEstimationData(createdItems, obj.cart);
    if (estimationData.length > 0) {
      for (const dt of estimationData) {
        await addShippingCostEstimation(dt);
      }
    } else {
      createLog(
        `shipping_cost_estimation_error_${createdItems
          .map((i) => i.id)
          .join(",")}`,
        JSON.stringify(estimationData, null, 2)
      );
    }

    await handleGreetingsCard(order, createdItems, queryRunner);
  } catch (error) {
    logError(
      "error_create_gc",
      JSON.stringify({ msg: error.message, line: error.stack })
    );
    throw error;
  }
}
