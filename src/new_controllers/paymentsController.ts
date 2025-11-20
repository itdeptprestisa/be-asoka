import { Request, Response, NextFunction } from "express";
import dayjs from "dayjs";
import dataSource from "../config/dataSource";
import { Order } from "../entities/Order";
import { OrderPayments } from "../entities/OrderPayments";
import { OrderItems } from "../entities/OrderItems";
import {
  createLog,
  getSettings,
  saveEntity,
  sendToLavenderFtp,
  waNotifHsm,
} from "../utils";
import { Banks } from "../entities/Banks";
import { In } from "typeorm";

export const bankList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const BanksRepository = dataSource.getRepository(Banks);
    let banks = [];

    if (req.params.type === "6") {
      banks = await BanksRepository.find({
        where: {
          id: In([1, 2, 3, 4, 5, 6, 8, 9, 10, 17, 23, 33, 35, 36, 37, 41]),
        },
      });
    } else {
      banks = await BanksRepository.find();
    }

    return res.json({ success: true, data: banks });
  } catch (error) {
    next(error);
  }
};

export const updateServiceFee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { order_number } = req.body;
    const OrdersRepository = dataSource.getRepository(Order);

    const order = await OrdersRepository.findOne({ where: { order_number } });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    let service_fee = 0;
    if (order.service_fee === 0 || order.service_fee == null) {
      service_fee = parseInt(process.env.NOMINAL_SERVICE_FEE || "0");
    }

    order.service_fee = service_fee;
    await OrdersRepository.save(order);

    return res.json({
      success: true,
      message: `Successfully ${service_fee === 0 ? "undo" : "add"} service fee`,
    });
  } catch (error) {
    next(error);
  }
};

export const addPayment = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      order_number,
      transaction_date,
      transaction_id,
      payment_method,
      paymentstat,
      notes,
      amount,
    } = req.body;

    const receipt = req.file;

    const OrdersRepository = dataSource.getRepository(Order);
    const OrderPaymentsRepository = dataSource.getRepository(OrderPayments);
    const OrderItemsRepository = dataSource.getRepository(OrderItems);

    // 1. Find order with relations
    const order = await OrdersRepository.findOne({
      where: { order_number },
      relations: {
        customerData: true,
        websiteData: true,
      },
    });

    if (!order) {
      return res.json({ success: false, message: ["Order not found"] });
    }

    const orderPaymentsData = await OrderPaymentsRepository.find({
      where: { order_id: order.id },
      relations: { bankData: true },
    });

    const nextID = (orderPaymentsData.length || 0) + 1;

    // 2. Save receipt image
    const imgPath =
      process.env.NODE_ENV === "production"
        ? `/assets/images/payment_receipts/${order.order_number}_${nextID}.png`
        : `assets/images/payment_receipts/staging_${order.order_number}_${nextID}.png`;

    let uploadSuccess = false;
    if (receipt?.path) {
      uploadSuccess = await sendToLavenderFtp(receipt.path, imgPath);
    }

    // 3. Update revision if needed
    if (order.payment_revision === "need revision") {
      order.payment_revision = "complete";
      await OrdersRepository.save(order);
    }

    // 4. Insert Payment
    const payment = await saveEntity(OrderPaymentsRepository, OrderPayments, {
      order_id: order.id,
      transaction_date,
      transaction_id,
      payment_method,
      status: paymentstat,
      notes,
      amount,
      receipt: uploadSuccess ? imgPath : "",
      user_id: req.user.userId,
      approved: 0,
    });

    const changeLogs = [];

    // 5. If cash type → adjust delivery times
    if (order.payment_type === "cash") {
      const minutes = 216;
      const bayar = dayjs(transaction_date);
      const items = await OrderItemsRepository.find({
        where: { order_id: order.id },
      });

      const to = order.customerData?.phone;
      const ord = await OrderItemsRepository.findOne({
        where: { order_id: order.id },
      });
      const tgl = ord?.date_time;
      const templatename = "customer_confirm_payment_v2";
      const placeholders = [tgl];
      const sales_user = await getSettings("general-settings", "sales_users");
      const sales_ig = [174, 142];

      for (const item of items) {
        const dt = dayjs(item.date_time);
        const diff = dt.diff(bayar, "minute");
        if (diff < minutes) {
          const add = minutes - diff;
          const newDateTime = dt.add(add, "minute");

          item.date_time = newDateTime.toDate();
          await OrderItemsRepository.save(item);

          changeLogs.push({
            order_number: order.order_number,
            order_id: order.id,
            pr_id: item.id,
            trans_date: transaction_date,
            old_date_time: item.date_time,
            new_date_time: newDateTime.format("YYYY-MM-DD HH:mm"),
            add_minutes: add,
            diff_minutes: diff,
            from: "create payment",
          });
        }
      }

      await createLog(
        `add-payment-order-id-${order.id}`,
        JSON.stringify(changeLogs)
      );

      if (
        (order.websiteData?.name === "Prestisa" ||
          order.websiteData?.name === "Prestisa ID") &&
        sales_user.includes(order.owner) &&
        !sales_ig.includes(order.owner)
      ) {
        waNotifHsm(to, templatename, placeholders);
      }

      const logs = JSON.parse(order.approve_logs || "[]");
      logs.push({
        date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        notes: `input payment ${payment.id}`,
        owner: req.user.userId,
      });

      order.payment_status = "unpaid";
      order.approve_logs = JSON.stringify(logs);
      await OrdersRepository.save(order);
    }

    // 6. If order was cancelled, reset it
    if (order.status === "cancelled") {
      order.status = "unapproved";
      order.auto_cancel_time = dayjs().add(24, "hour").toDate();
      await OrdersRepository.save(order);
    }

    return res.json({ success: true, message: "Successfully add payment" });
  } catch (error) {
    next(error);
  }
};
