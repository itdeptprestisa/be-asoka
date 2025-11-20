const express = require("express");
const router = express.Router();
const { Op, literal } = require("sequelize");
const {
  obscureData,
  minutesAgo,
  todayDbRange,
  toDbDate,
  nowDbDateTime,
  toDbDateTime,
  getSettings,
  sendToLavenderFtp,
  waNotifHsm,
  autoCreateDocumentInvoice,
  autoCreateFakturPajak,
} = require("../utils/helpers");
const Order = require("../models/order");
const Users = require("../models/users");
const Banks = require("../models/banks");
const PurchaseOrder = require("../models/purchaseOrder");
const Supplier = require("../models/supplier");
const OrderSelection = require("../models/orderSelection");
const Customer = require("../models/customer");
const OrderPayments = require("../models/orderPayments");
const OrderItems = require("../models/orderItems");
const dayjs = require("dayjs");
const moment = require("moment");
const OrderCustomer = require("../models/orderCustomer");
const OrderProblems = require("../models/orderProblems");
const OrderProblemsPayments = require("../models/orderProblemsPayments");
const PrProblems = require("../models/prProblems");
const TaxInvoices = require("../models/taxInvoices");
const RoleUser = require("../models/roleUser");
const Logs = require("../models/logs");
const sequelize = require("../config/db");

exports.updateServiceFee = async (req, res, next) => {
  try {
    const { order_number } = req.body;

    // find order by order_number
    const order = await Order.findOne({
      where: { order_number: order_number },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    let service_fee = 0;
    if (order.service_fee === 0 || order.service_fee == null) {
      service_fee = parseInt(process.env.NOMINAL_SERVICE_FEE);
    }

    await order.update({ service_fee });

    return res.json({
      success: true,
      message: `Successfully ${service_fee == 0 ? "add" : "undo"} service fee`,
    });
  } catch (error) {
    next(error);
  }
};

exports.bankList = async (req, res, next) => {
  let banks = [];

  try {
    if (req.params.type == "all") {
      banks = await Banks.findAll();
    } else if (req.params.type == "6") {
      banks = await Banks.findAll({
        where: {
          id: [1, 2, 3, 4, 5, 6, 8, 9, 10, 17, 23, 33, 35, 36, 37, 41],
        },
      });
    } else {
      banks = await Banks.findAll();
    }

    res.json({ success: true, data: banks });
  } catch (error) {
    next(error);
  }
};

exports.addPayment = async (req, res, next) => {
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

    // 1. Find order
    const order = await Order.findOne({
      where: { order_number },
      include: [
        {
          association: "customerData",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          association: "orderPaymentsData",
          include: [{ association: "bankData" }],
        },
        { association: "websiteData" },
      ],
    });

    if (!order) {
      return res.json({ success: false, message: ["Order not found"] });
    }

    const nextID = order.orderPaymentsData.length + 1;

    // 2. Save receipt image
    const imgPath =
      process.env.NODE_ENV === "production"
        ? `/assets/images/payment_receipts/${order.order_number}_${nextID}.png`
        : `assets/images/payment_receipts/staging_${order.order_number}_${nextID}.png`;

    let uploadSuccess = false;

    if (receipt && receipt.path) {
      uploadSuccess = await sendToLavenderFtp(receipt.path, imgPath);
    }

    // 3. Update revision if needed
    if (order.payment_revision === "need revision") {
      await order.update({ payment_revision: "complete" });
    }

    // 4. Insert Payment
    const payment = await OrderPayments.create({
      order_id: order.id,
      transaction_date,
      transaction_id,
      payment_method,
      status: paymentstat,
      notes,
      amount,
      receipt: uploadSuccess ? imgPath : "",
      user_id: req.user.userId, // Authenticated user (replace with your auth system)
      approved: 0,
    });

    let changeLogs = [];

    // 5. If cash type → adjust delivery times
    if (order.payment_type === "cash") {
      const minutes = 216; // 3h 36m
      const bayar = dayjs(transaction_date);
      const items = await OrderItems.findAll({ where: { order_id: order.id } });

      const to = order.customerData.phone;
      const ord = await OrderItems.findOne({ where: { order_id: order.id } });
      const tgl = ord.date_time;
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

          await item.update({ date_time: newDateTime });

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

      // Insert logs
      await Logs.create({
        data: JSON.stringify(changeLogs),
        created_at: new Date(),
        name: `add-payment-order-id-${order.id}`,
      });

      // Example WA notification
      if (
        (order.websiteData?.name === "Prestisa" ||
          order.websiteData?.name === "Prestisa ID") &&
        sales_user.includes(order.owner) &&
        !sales_ig.includes(order.owner)
      ) {
        waNotifHsm(to, templatename, placeholders);
      }

      // Update order status
      await order.update({
        payment_status: "unpaid",
        approve_logs: JSON.stringify([
          ...JSON.parse(order.approve_logs || "[]"),
          {
            date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            notes: `input payment ${payment.id}`,
            owner: req.user.userId,
          },
        ]),
      });
    }

    // 6. Special case: if order cancelled, reset it
    if (order.status === "cancelled") {
      await order.update({
        status: "unapproved",
        auto_cancel_time: dayjs().add(24, "hour").toDate(), // TODO: check timezone
      });
    }

    // 7. Response
    return res.json({ success: true, message: "Successfully add payment" });
  } catch (error) {
    next(error);
  }
};
