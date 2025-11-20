import dataSource from "../config/dataSource";
import { Order } from "../entities/Order";
import { OrderItems } from "../entities/OrderItems";
import { Products } from "../entities/Products";
import { ProductStock } from "../entities/ProductStock";
import { ShippingCostEstimation } from "../entities/ShippingCostEstimation";
import { Logs } from "../entities/Logs";
import { addShippingCostEstimation } from "../utils/shipping/addShippingCostEstimation";
import { sendToLavenderFtp } from "../utils/helpers";
import path from "path";
import fs from "fs";
import { logError, saveEntity } from "../utils";
import { createImageJob } from "../jobs/createImageJob";
import { createGreetingsCardJob } from "../jobs/createGreetingsCardJob";

async function syncOrderItems(orderInstance: Order, invoiceItems: any[]) {
  try {
    const OrderItemsRepository = dataSource.getRepository(OrderItems);

    // 1. Soft delete existing items
    // Alternative: Manual soft delete
    await OrderItemsRepository.update(
      { order_id: orderInstance.id },
      { deleted_at: new Date() }
    );

    // 2. Insert new items
    const savedItems = [];
    for (const invoiceItem of invoiceItems) {
      const { id, ...rest } = invoiceItem;
      const created = await saveEntity(OrderItemsRepository, OrderItems, {
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
        previousData = await dataSource.manager.findOne(
          ShippingCostEstimation,
          {
            where: { order_items_id: item.id },
          }
        );
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
      await saveEntity(dataSource.manager, Logs, {
        name: `shipping_cost_estimation_error_${createdIds}`,
        data: JSON.stringify(estimationData),
      });
    }

    return savedItems;
  } catch (error) {
    console.error("Error in syncOrderItems:", error);
    throw error;
  }
}

async function updateOrderItemsJob(orderId: number, cartData: any[]) {
  try {
    const OrderRepository = dataSource.getRepository(Order);
    const ProductsRepository = dataSource.getRepository(Products);
    const ProductStockRepository = dataSource.getRepository(ProductStock);
    const OrderItemsRepository = dataSource.getRepository(OrderItems);

    // Find order
    const order = await OrderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    const items = [];

    for (let i = 0; i < cartData.length; i++) {
      const cart = cartData[i];
      const product = await ProductsRepository.findOne({
        where: { id: cart.product_id },
      });
      if (!product) continue;

      const isBungaPapan = [1, 2, 3, 32, 33].includes(product.category_id);
      const diffMinutes =
        Math.abs(new Date(cart.date_time).getTime() - new Date().getTime()) /
        60000;

      // Update order VIP status
      await saveEntity(OrderRepository, Order, {
        id: order.id,
        vip: isBungaPapan && diffMinutes <= 270 ? "YES" : "NO",
      });

      const saveImage = async (
        base64: string,
        filename: string,
        fallbackPath: string
      ): Promise<string> => {
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
        id: undefined, // ensure id is not carried over
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
    const oldItems = await OrderItemsRepository.find({
      where: { order_id: order.id },
    });

    for (const item of oldItems) {
      if (item.shipping_method) {
        const product = await ProductsRepository.findOne({
          where: { id: item.product_id },
        });
        if (product) {
          // Update product quantity
          await saveEntity(ProductsRepository, Products, {
            id: product.id,
            qty: product.qty + item.qty,
          });

          // Create stock record
          await saveEntity(ProductStockRepository, ProductStock, {
            product_id: product.id,
            qty: item.qty,
            type: "plus",
            category: 0,
            user_id: 1,
            remarks: `edit order id = ${order.id}`,
          });
        }
      }
    }

    // Deduct stock from new items
    for (const item of cartData) {
      if (item.shipping_method) {
        const product = await ProductsRepository.findOne({
          where: { id: item.product_id },
        });
        if (product) {
          // Update product quantity
          await saveEntity(ProductsRepository, Products, {
            id: product.id,
            qty: product.qty - item.qty,
          });

          // Create stock record
          await saveEntity(ProductStockRepository, ProductStock, {
            product_id: product.id,
            qty: item.qty,
            type: "minus",
            category: 0,
            user_id: 1,
            remarks: `edit order id = ${order.id}`,
          });
        }
      }
    }

    // Sync items
    await syncOrderItems(order, items);

    // Generate greetings card
    const createdItems = await OrderItemsRepository.find({
      where: { order_id: order.id },
    });

    for (const item of createdItems) {
      const product = await ProductsRepository.findOne({
        where: { id: item.product_id },
      });
      if (!product) continue;

      const excluded = [36, 37, 39, 40, 42, 43, 44, 45, 46, 47, 48];
      if (excluded.includes(product.category_id)) continue;

      const cardPath =
        process.env.NODE_ENV === "production"
          ? `/assets/images/greetings_card/greetings_${item.id}.png`
          : `/assets/images/greetings_card/staging_greetings_${item.id}.png`;

      // Update item with greetings card path
      await saveEntity(OrderItemsRepository, OrderItems, {
        id: item.id,
        greetings_card: cardPath,
      });

      await createGreetingsCardJob({
        pr: item,
        website: order.website,
        img: cardPath,
      });
    }
  } catch (error) {
    // Log error
    await logError(
      "error_create_gc",
      JSON.stringify({
        msg: error.message,
        line: error.stack?.split("\n")[1] || "unknown",
      })
    );

    throw error;
  }
}

export default updateOrderItemsJob;
