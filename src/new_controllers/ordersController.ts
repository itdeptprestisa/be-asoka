import { NextFunction, Request, Response } from "express";
import { Order } from "../entities/Order";
import {
  Like,
  Between,
  MoreThan,
  LessThan,
  In,
  IsNull,
  Not,
  MoreThanOrEqual,
  LessThanOrEqual,
  ILike,
  Equal,
} from "typeorm";
import {
  createLog,
  getSettings,
  getUserByRole,
  logError,
  maskOrder,
  obscureData,
  phone62,
  referralCodeGenerator,
  saveEntity,
  sendToLavenderFtp,
  waNotifHsm,
} from "../utils";
import { Products } from "../entities/Products";
import { Customer } from "../entities/Customer";
import { EpPotentialReferrals } from "../entities/EpPotentialReferrals";
import dataSource from "../config/dataSource";
import { Users } from "../entities/Users";
import { Logs } from "../entities/Logs";
import { uploadImageKtpNpwp } from "../utils/orders/uploadImageKtpNpwp";
import { MetaValues } from "../entities/MetaValues";
import { createVaXendit } from "../new_jobs/createVaXendit";
import { createOrderCustomerJob } from "../new_jobs/createOrderCustomerJob";
import { createOrderItemsJob } from "../new_jobs/createOrderItemsJob";
import { OrderItems } from "../entities/OrderItems";
import { expireVaXendit } from "../jobs/expireVaXendit";
import { updateVaXendit } from "../jobs/updateVaXendit";
import { updateOrderCustomerJob } from "../new_jobs/updateOrderCustomerJob";
import updateOrderItemsJob from "../new_jobs/updateOrderItemsJob";
import { PurchaseOrder } from "../entities/PurchaseOrder";
import { PurchaseOrderRating } from "../entities/PurchaseOrderRating";
import { Supplier } from "../entities/Supplier";
import { supplierRateAvg } from "../utils/orders/supplierRateAvg";
import { photoApproval } from "../utils/orders/photoApproval";
import XLSX from "xlsx";
import { OrderPayments } from "../entities/OrderPayments";
import { ProductStock } from "../entities/ProductStock";
import axios from "axios";
import { CustomerBanks } from "../entities/CustomerBanks";
import { OrderProblems } from "../entities/OrderProblems";
import { TaxInvoices } from "../entities/TaxInvoices";
import path from "path";
import * as fs from "fs";
import moment from "moment";
import { ApprovalInvoiceUpdate } from "../entities/ApprovalInvoiceUpdate";
import { autoCreateDocumentInvoice } from "../new_jobs/autoCreateDocumentInvoice";
import { autoCreateFakturPajak } from "../new_jobs/autoCreateFakturPajak";
import dayjs from "dayjs";
import { RoleUser } from "../entities/RoleUser";
import { PrProblems } from "../entities/PrProblems";
import { OrderSelection } from "../entities/OrderSelection";

export const widgetStateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const type = req?.query?.type as string;
    const betweenToday = [
      moment().startOf("day").toDate(),
      moment().endOf("day").toDate(),
    ];
    const dateFrom = betweenToday[0];
    const dateTo = betweenToday[1];
    const now = new Date();

    // Base order where = today's orders and not cancelled
    // const baseOrderWhere = {
    //   created_at: Between(new Date(date_from), new Date(date_to)),
    //   status: Not("cancelled"),
    // };

    // Lazy full-data queries (only executed when requested)
    const queries = {
      // Waiting payments: today's orders that have no payments
      waiting_payment: async () => {
        const queryBuilder = dataSource
          .getRepository(Order)
          .createQueryBuilder("order")
          .leftJoinAndSelect("order.ownerData", "ownerData")
          .leftJoinAndSelect("order.customerData", "customerData")
          .leftJoinAndSelect("order.orderItemsData", "orderItemsData")
          .leftJoinAndSelect("order.orderPaymentsData", "orderPaymentsData")
          .leftJoinAndSelect("orderPaymentsData.bankData", "bankData")
          .where("order.payment_type = :paymentType", { paymentType: "cash" })
          .andWhere("DATE(order.created_at) BETWEEN :dateFrom AND :dateTo", {
            dateFrom,
            dateTo,
          })
          .andWhere("order.status != :status", { status: "cancelled" })
          .andWhere("orderPaymentsData.id IS NULL")
          .andWhere(`DATE_ADD(order.created_at, INTERVAL 30 MINUTE) < :now`, {
            now,
          });

        return queryBuilder.getMany();
      },

      payment_approval: async () => {
        const queryBuilder = dataSource
          .getRepository(Order)
          .createQueryBuilder("order")
          .leftJoinAndSelect("order.ownerData", "ownerData")
          .leftJoinAndSelect("order.customerData", "customerData")
          .leftJoinAndSelect("order.orderItemsData", "orderItemsData")
          .innerJoinAndSelect("order.orderPaymentsData", "orderPaymentsData")
          .leftJoinAndSelect("orderPaymentsData.bankData", "bankData")
          .where("order.payment_type = :paymentType", { paymentType: "cash" })
          .andWhere("DATE(order.created_at) BETWEEN :dateFrom AND :dateTo", {
            dateFrom,
            dateTo,
          })
          .andWhere("order.status != :status", { status: "cancelled" })
          .andWhere("orderPaymentsData.approved = :approved", { approved: 0 })
          .andWhere(`DATE_ADD(order.created_at, INTERVAL 34 MINUTE) < :now`, {
            now,
          });

        return queryBuilder.getMany();
      },

      order_approval_cash: async () => {
        const queryBuilder = dataSource
          .getRepository(Order)
          .createQueryBuilder("order")
          .leftJoinAndSelect("order.ownerData", "ownerData")
          .leftJoinAndSelect("order.customerData", "customerData")
          .leftJoinAndSelect("order.orderItemsData", "orderItemsData")
          .leftJoinAndSelect("order.orderPaymentsData", "orderPaymentsData")
          .where("order.payment_type = :paymentType", { paymentType: "cash" })
          .andWhere("order.payment_status = :paymentStatus", {
            paymentStatus: "paid",
          })
          .andWhere("order.status = :status", { status: "unapproved" })
          .andWhere("DATE(order.created_at) BETWEEN :dateFrom AND :dateTo", {
            dateFrom,
            dateTo,
          })
          .andWhere(`DATE_ADD(order.created_at, INTERVAL 35 MINUTE) < :now`, {
            now,
          });

        return queryBuilder.getMany();
      },

      order_approval_piutang: async () => {
        const queryBuilder = dataSource
          .getRepository(Order)
          .createQueryBuilder("order")
          .leftJoinAndSelect("order.ownerData", "ownerData")
          .leftJoinAndSelect("order.customerData", "customerData")
          .leftJoinAndSelect("order.orderItemsData", "orderItemsData")
          .leftJoinAndSelect("order.orderPaymentsData", "orderPaymentsData")
          .where("order.payment_type = :paymentType", {
            paymentType: "piutang",
          })
          .andWhere("order.verify = :verify", { verify: 1 })
          .andWhere("order.status = :status", { status: "unapproved" })
          .andWhere("DATE(order.created_at) BETWEEN :dateFrom AND :dateTo", {
            dateFrom,
            dateTo,
          })
          .andWhere(`DATE_ADD(order.created_at, INTERVAL 35 MINUTE) < :now`, {
            now,
          });

        return queryBuilder.getMany();
      },

      purchase_request: async () => {
        const queryBuilder = dataSource
          .getRepository(OrderItems)
          .createQueryBuilder("orderItems")
          .innerJoinAndSelect("orderItems.orderData", "orderData")
          .leftJoinAndSelect("orderData.customerData", "customerData")
          .where("orderData.status = :status", { status: "approved" })
          .andWhere(
            "DATE(orderData.created_at) BETWEEN :dateFrom AND :dateTo",
            { dateFrom, dateTo }
          )
          .andWhere(
            `DATE_ADD(orderData.created_at, INTERVAL 65 MINUTE) < :now`,
            { now }
          )
          .andWhere("orderItems.assignment IS NULL")
          .andWhere("orderItems.bought < orderItems.qty");

        return queryBuilder.getMany();
      },

      production_normal: async () => {
        const queryBuilder = dataSource
          .getRepository(Order)
          .createQueryBuilder("order")
          .leftJoinAndSelect("order.ownerData", "ownerData")
          .leftJoinAndSelect("order.customerData", "customerData")
          .leftJoinAndSelect("order.orderItemsData", "orderItemsData")
          .leftJoinAndSelect("order.orderPaymentsData", "orderPaymentsData")
          .innerJoinAndSelect("order.purchaseOrderData", "purchaseOrderData")
          .leftJoinAndSelect("purchaseOrderData.supplierData", "supplierData")
          .where("DATE(order.created_at) BETWEEN :dateFrom AND :dateTo", {
            dateFrom,
            dateTo,
          })
          .andWhere("order.status != :status", { status: "cancelled" })
          .andWhere("purchaseOrderData.status IN (:...statuses)", {
            statuses: ["on progress", "pending"],
          })
          .andWhere(
            "purchaseOrderData.date_time BETWEEN :dateFrom AND :dateTo",
            { dateFrom, dateTo }
          )
          .andWhere(
            "(purchaseOrderData.real_image IS NULL OR purchaseOrderData.real_image = '')"
          )
          .andWhere(
            `DATE_SUB(orderItemsData.date_time, INTERVAL 180 MINUTE) < :now`,
            { now }
          );

        return queryBuilder.getMany();
      },

      production_subdomain: async () => {
        const queryBuilder = dataSource
          .getRepository(OrderSelection)
          .createQueryBuilder("orderSelection")
          .leftJoinAndSelect("orderSelection.orderItemsData", "orderItemsData")
          .innerJoinAndSelect("orderItemsData.orderData", "orderData")
          .leftJoinAndSelect("orderData.customerData", "customerData")
          .innerJoinAndSelect(
            "orderData.purchaseOrderData",
            "purchaseOrderData"
          )
          .leftJoinAndSelect("purchaseOrderData.supplierData", "supplierData")
          .where("orderSelection.status = :status", { status: "ready" })
          .andWhere(
            "DATE(orderSelection.created_at) BETWEEN :dateFrom AND :dateTo",
            { dateFrom, dateTo }
          )
          .andWhere("orderSelection.confirm_time IS NOT NULL")
          .andWhere(
            `DATE_SUB(orderSelection.confirm_time, INTERVAL 180 MINUTE) < :now`,
            { now }
          );

        return queryBuilder.getMany();
      },

      real_image: async () => {
        const queryBuilder = dataSource
          .getRepository(Order)
          .createQueryBuilder("order")
          .leftJoinAndSelect("order.ownerData", "ownerData")
          .leftJoinAndSelect("order.customerData", "customerData")
          .leftJoinAndSelect("order.orderItemsData", "orderItemsData")
          .leftJoinAndSelect("order.orderPaymentsData", "orderPaymentsData")
          .innerJoinAndSelect("order.purchaseOrderData", "purchaseOrderData")
          .leftJoinAndSelect("purchaseOrderData.supplierData", "supplierData")
          .where("DATE(order.created_at) BETWEEN :dateFrom AND :dateTo", {
            dateFrom,
            dateTo,
          })
          .andWhere("order.status != :status", { status: "cancelled" })
          .andWhere("purchaseOrderData.status = :poStatus", {
            poStatus: "on progress",
          })
          .andWhere("purchaseOrderData.status != :cancelled", {
            cancelled: "cancelled",
          })
          .andWhere(
            "purchaseOrderData.date_time BETWEEN :dateFrom AND :dateTo",
            { dateFrom, dateTo }
          )
          .andWhere(
            "(purchaseOrderData.real_image IS NULL OR purchaseOrderData.real_image = '')"
          )
          .andWhere(
            `DATE_SUB(orderItemsData.date_time, INTERVAL 60 MINUTE) < :now`,
            { now }
          );

        return queryBuilder.getMany();
      },

      delivery_location: async () => {
        const queryBuilder = dataSource
          .getRepository(Order)
          .createQueryBuilder("order")
          .leftJoinAndSelect("order.ownerData", "ownerData")
          .leftJoinAndSelect("order.customerData", "customerData")
          .leftJoinAndSelect("order.orderItemsData", "orderItemsData")
          .leftJoinAndSelect("order.orderPaymentsData", "orderPaymentsData")
          .innerJoinAndSelect("order.purchaseOrderData", "purchaseOrderData")
          .leftJoinAndSelect("purchaseOrderData.supplierData", "supplierData")
          .where("DATE(order.created_at) BETWEEN :dateFrom AND :dateTo", {
            dateFrom,
            dateTo,
          })
          .andWhere("order.status != :status", { status: "cancelled" })
          .andWhere("purchaseOrderData.status = :poStatus", {
            poStatus: "on shipping",
          })
          .andWhere(
            "purchaseOrderData.date_time BETWEEN :dateFrom AND :dateTo",
            { dateFrom, dateTo }
          )
          .andWhere(
            "(purchaseOrderData.real_image IS NOT NULL AND purchaseOrderData.real_image != '')"
          )
          .andWhere(
            "DATE(orderItemsData.created_at) BETWEEN :dateFrom AND :dateTo",
            { dateFrom, dateTo }
          )
          .andWhere(
            `DATE_ADD(orderItemsData.date_time, INTERVAL 1 MINUTE) < :now`,
            { now }
          );

        return queryBuilder.getMany();
      },
    };

    // Count queries: light-weight versions
    const countQueries = {
      waiting_payment: async () => {
        const result = await dataSource
          .getRepository(Order)
          .createQueryBuilder("order")
          .leftJoin("order.orderPaymentsData", "orderPaymentsData")
          .where("order.payment_type = :paymentType", { paymentType: "cash" })
          .andWhere("DATE(order.created_at) BETWEEN :dateFrom AND :dateTo", {
            dateFrom,
            dateTo,
          })
          .andWhere("order.status != :status", { status: "cancelled" })
          .andWhere("orderPaymentsData.id IS NULL")
          .andWhere(`DATE_ADD(order.created_at, INTERVAL 30 MINUTE) < :now`, {
            now,
          })
          .getCount();

        return result;
      },

      payment_approval: async () => {
        const result = await dataSource
          .getRepository(Order)
          .createQueryBuilder("order")
          .innerJoin("order.orderPaymentsData", "orderPaymentsData")
          .where("order.payment_type = :paymentType", { paymentType: "cash" })
          .andWhere("DATE(order.created_at) BETWEEN :dateFrom AND :dateTo", {
            dateFrom,
            dateTo,
          })
          .andWhere("order.status != :status", { status: "cancelled" })
          .andWhere("orderPaymentsData.approved = :approved", { approved: 0 })
          .andWhere(`DATE_ADD(order.created_at, INTERVAL 34 MINUTE) < :now`, {
            now,
          })
          .getCount();

        return result;
      },

      order_approval_cash: async () => {
        const result = await dataSource
          .getRepository(Order)
          .createQueryBuilder("order")
          .where("order.payment_type = :paymentType", { paymentType: "cash" })
          .andWhere("order.payment_status = :paymentStatus", {
            paymentStatus: "paid",
          })
          .andWhere("order.status = :status", { status: "unapproved" })
          .andWhere("DATE(order.created_at) BETWEEN :dateFrom AND :dateTo", {
            dateFrom,
            dateTo,
          })
          .andWhere(`DATE_ADD(order.created_at, INTERVAL 35 MINUTE) < :now`, {
            now,
          })
          .getCount();

        return result;
      },

      order_approval_piutang: async () => {
        const result = await dataSource
          .getRepository(Order)
          .createQueryBuilder("order")
          .where("order.payment_type = :paymentType", {
            paymentType: "piutang",
          })
          .andWhere("order.verify = :verify", { verify: 1 })
          .andWhere("order.status = :status", { status: "unapproved" })
          .andWhere("DATE(order.created_at) BETWEEN :dateFrom AND :dateTo", {
            dateFrom,
            dateTo,
          })
          .andWhere(`DATE_ADD(order.created_at, INTERVAL 35 MINUTE) < :now`, {
            now,
          })
          .getCount();

        return result;
      },

      purchase_request: async () => {
        const result = await dataSource
          .getRepository(OrderItems)
          .createQueryBuilder("orderItems")
          .innerJoin("orderItems.orderData", "orderData")
          .where("orderData.status = :status", { status: "approved" })
          .andWhere(
            "DATE(orderData.created_at) BETWEEN :dateFrom AND :dateTo",
            { dateFrom, dateTo }
          )
          .andWhere(
            `DATE_ADD(orderData.created_at, INTERVAL 65 MINUTE) < :now`,
            { now }
          )
          .andWhere("orderItems.assignment IS NULL")
          .andWhere("orderItems.bought < orderItems.qty")
          .getCount();

        return result;
      },

      production_normal: async () => {
        const result = await dataSource
          .getRepository(Order)
          .createQueryBuilder("order")
          .innerJoin("order.purchaseOrderData", "purchaseOrderData")
          .innerJoin("order.orderItemsData", "orderItemsData")
          .where("DATE(order.created_at) BETWEEN :dateFrom AND :dateTo", {
            dateFrom,
            dateTo,
          })
          .andWhere("order.status != :status", { status: "cancelled" })
          .andWhere("purchaseOrderData.status IN (:...statuses)", {
            statuses: ["on progress", "pending"],
          })
          .andWhere(
            "purchaseOrderData.date_time BETWEEN :dateFrom AND :dateTo",
            { dateFrom, dateTo }
          )
          .andWhere(
            "(purchaseOrderData.real_image IS NULL OR purchaseOrderData.real_image = '')"
          )
          .andWhere(
            `DATE_SUB(orderItemsData.date_time, INTERVAL 180 MINUTE) < :now`,
            { now }
          )
          .getCount();

        return result;
      },

      production_subdomain: async () => {
        const result = await dataSource
          .getRepository(OrderSelection)
          .createQueryBuilder("orderSelection")
          .innerJoin("orderSelection.orderItemsData", "orderItemsData")
          .innerJoin("orderItemsData.orderData", "orderData")
          .innerJoin("orderData.purchaseOrderData", "purchaseOrderData")
          .where("orderSelection.status = :status", { status: "ready" })
          .andWhere(
            "DATE(orderSelection.created_at) BETWEEN :dateFrom AND :dateTo",
            { dateFrom, dateTo }
          )
          .andWhere("orderSelection.confirm_time IS NOT NULL")
          .andWhere(
            `DATE_SUB(orderSelection.confirm_time, INTERVAL 180 MINUTE) < :now`,
            { now }
          )
          .getCount();

        return result;
      },

      real_image: async () => {
        const result = await dataSource
          .getRepository(Order)
          .createQueryBuilder("order")
          .innerJoin("order.purchaseOrderData", "purchaseOrderData")
          .innerJoin("order.orderItemsData", "orderItemsData")
          .where("DATE(order.created_at) BETWEEN :dateFrom AND :dateTo", {
            dateFrom,
            dateTo,
          })
          .andWhere("order.status != :status", { status: "cancelled" })
          .andWhere("purchaseOrderData.status = :poStatus", {
            poStatus: "on progress",
          })
          .andWhere("purchaseOrderData.status != :cancelled", {
            cancelled: "cancelled",
          })
          .andWhere(
            "purchaseOrderData.date_time BETWEEN :dateFrom AND :dateTo",
            { dateFrom, dateTo }
          )
          .andWhere(
            "(purchaseOrderData.real_image IS NULL OR purchaseOrderData.real_image = '')"
          )
          .andWhere(
            `DATE_SUB(orderItemsData.date_time, INTERVAL 60 MINUTE) < :now`,
            { now }
          )
          .getCount();

        return result;
      },

      delivery_location: async () => {
        const result = await dataSource
          .getRepository(Order)
          .createQueryBuilder("order")
          .innerJoin("order.purchaseOrderData", "purchaseOrderData")
          .innerJoin("order.orderItemsData", "orderItemsData")
          .where("DATE(order.created_at) BETWEEN :dateFrom AND :dateTo", {
            dateFrom,
            dateTo,
          })
          .andWhere("order.status != :status", { status: "cancelled" })
          .andWhere("purchaseOrderData.status = :poStatus", {
            poStatus: "on shipping",
          })
          .andWhere(
            "purchaseOrderData.date_time BETWEEN :dateFrom AND :dateTo",
            { dateFrom, dateTo }
          )
          .andWhere(
            "(purchaseOrderData.real_image IS NOT NULL AND purchaseOrderData.real_image != '')"
          )
          .andWhere(
            "DATE(orderItemsData.created_at) BETWEEN :dateFrom AND :dateTo",
            { dateFrom, dateTo }
          )
          .andWhere(
            `DATE_ADD(orderItemsData.date_time, INTERVAL 1 MINUTE) < :now`,
            { now }
          )
          .getCount();

        return result;
      },
    };

    let data: any;

    // Execute either counts (fast) or requested full dataset(s)
    if (type === "count") {
      const results = await Promise.all(
        Object.entries(countQueries).map(async ([key, queryFn]) => {
          const count = await queryFn();
          return [key, count];
        })
      );

      const map = Object.fromEntries(results);

      data = [
        {
          name: "Foto Lokasi",
          count: map.delivery_location,
          slug: "delivery_location",
        },
        { name: "Foto Hasil", count: map.real_image, slug: "real_image" },
        {
          name: "Terima Order",
          count: map.production_normal + map.production_subdomain,
          slug: "production",
        },
        {
          name: "Purchasing Request",
          count: map.purchase_request,
          slug: "purchase_request",
        },
        {
          name: "Approval Order",
          count: map.order_approval_cash + map.order_approval_piutang,
          slug: "order_approval",
        },
        {
          name: "Approval Payment",
          count: map.payment_approval,
          slug: "payment_approval",
        },
        {
          name: "Menunggu Pembayaran",
          count: map.waiting_payment,
          slug: "waiting_payment",
        },
      ];
    } else if (type && queries[type as keyof typeof queries]) {
      const result = await queries[type as keyof typeof queries]();
      data = maskOrder(result);
    } else if (type === "production") {
      const result = await queries.production_normal();
      const result2 = await queries.production_subdomain();
      data = maskOrder([...result, ...result2]);
    } else if (type === "order_approval") {
      const result = await queries.order_approval_cash();
      const result2 = await queries.order_approval_piutang();
      data = maskOrder([...result, ...result2]);
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const detail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;

    const orderRepo = dataSource.getRepository(Order);
    const order = await orderRepo.findOne({
      where: { order_number: id },
      relations: {
        orderItemsData: {
          productsData: true,
          geoProvinceData: true,
          geoCityData: true,
          geoCountryData: true,
        },
        orderCustomerData: true,
        orderPaymentsData: {
          usersData: true,
          bankData: true,
        },
        websiteData: true,
        ownerData: true,
        orderProblemsData: true,
        customerData: {
          customerBanksData: true,
        },
      },
    });

    if (!order) {
      return res.json({ success: false, message: "order not found" });
    }

    const status =
      order.orderProblemsData?.length >= order.orderItemsData?.length;

    const roleuser = await dataSource.getRepository(RoleUser).findOne({
      where: { user_id: order.owner },
      select: ["role_id"],
    });

    const stat = [14, 1].includes(roleuser?.role_id ?? 0) ? 0 : 0;

    const default_order_problem = order.orderItemsData?.some(
      (c) => c.problem > 0
    )
      ? 1
      : 0;

    const salesUser = await getSettings("general-settings", "sales_users");
    const issales = salesUser.includes(order.owner);

    const problems_payment = await dataSource
      .getRepository(OrderProblems)
      .find({
        where: { order_number: id },
        relations: {
          orderProblemsPaymentsData: {
            orderProblemsData: true,
          },
        },
        select: ["payment_status"],
      });

    const pr_problems = await dataSource.getRepository(PrProblems).find({
      where: { order_id: order.id },
      relations: { ownerData: true },
      order: { id: "DESC" },
    });

    const last3 = await orderRepo.find({
      where: { customer_id: order.customer_id },
      relations: {
        orderItemsData: {
          geoProvinceData: true,
          geoCityData: true,
          geoCountryData: true,
        },
        customerData: true,
        orderPaymentsData: {
          usersData: true,
          bankData: true,
        },
        websiteData: true,
      },
      order: { created_at: "DESC" },
      take: 3,
    });

    const purchaseOrders = await dataSource.getRepository(PurchaseOrder).find({
      where: { order_id: order.id },
    });

    return res.json({
      success: true,
      data: {
        problem: status,
        order: {
          ...order,
          problems_payment: problems_payment,
          problem: default_order_problem,
          purchaseOrderData: purchaseOrders,
          orderCustomerData: {
            ...order.orderCustomerData,
            email: obscureData(order.orderCustomerData?.email, "email"),
            phone: obscureData(order.orderCustomerData?.phone, "phone"),
            company_email: obscureData(
              order.orderCustomerData?.company_email,
              "email"
            ),
            company_phone: obscureData(
              order.orderCustomerData?.company_phone,
              "phone"
            ),
          },
          customerData: {
            ...order.customerData,
            email: obscureData(order.customerData?.email, "email"),
            phone: obscureData(order.customerData?.phone, "phone"),
          },
        },
        role: roleuser?.role_id,
        ae: stat,
        pr: order.orderItemsData,
        issales,
        pr_problems,
        last_order: last3,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DANGER ! dont remove the comments
// exports.detail = async (req, res, next) => {
//   try {
//     const id = req.params.id;

//     let cT = await Order.findOne({
//       include: [
//         // { association: "purchaseOrderData" },
//         {
//           association: "orderItemsData",
//           attributes: { exclude: [] },
//           include: [
//             "productsData",
//             "geoProvinceData",
//             "geoCityData",
//             "geoCountryData",
//             // "purchaseOrderData",
//           ],
//         },
//         {
//           association: "orderCustomerData",
//         },
//         {
//           association: "orderPaymentsData",
//           include: ["usersData", "bankData"],
//         },
//         { association: "websiteData" },
//         { association: "ownerData" },
//         { association: "orderProblemsData" },
//         {
//           association: "customerData",
//           include: ["customerBanksData"],
//         },
//       ],
//       where: { order_number: id },
//     });

//     if (!cT) {
//       return res.json({ success: false, message: "order not found" });
//     }

//     // // === problem check ===
//     let status = cT.orderProblemsData?.length >= cT.orderItemsData?.length;

//     // === role check ===
//     const roleuser = await RoleUser.findOne({
//       where: { user_id: cT.owner },
//       attributes: ["role_id"],
//     });

//     let stat = 0;
//     if (roleuser?.role_id === 14) stat = 0;
//     else if (roleuser?.role_id === 1) stat = 0;
//     else stat = 0;

//     // // === check cart problems ===
//     let default_order_problem = cT.orderItemsData?.some((c) => c?.problem > 0)
//       ? 1
//       : 0;
//     cT.setDataValue("problem", default_order_problem);

//     // === sales user check ===
//     const salesUser = await getSettings("general-settings", "sales_users");
//     const issales = salesUser.includes(cT.owner);

//     // // === order customer ===
//     // // const orderCustomer = await OrderCustomer.findOne({
//     // //   where: { order_id: cT.id },
//     // // });

//     // const orderIds = await Order.findAll({
//     //   where: { customer_id: cT.customer_id },
//     //   attributes: ["id"],
//     // }).then((rows) => rows.map((r) => r.id));

//     // let order_customer_list = await OrderCustomer.findAll({
//     //   where: {
//     //     order_id: { [Op.in]: orderIds },
//     //     npwp_number: { [Op.ne]: null },
//     //   },
//     //   attributes: ["npwp_number", "npwp_name", "npwp_address", "npwp_file"],
//     // });

//     // order_customer_list = order_customer_list?.length
//     //   ? [
//     //       ...new Map(
//     //         order_customer_list.map((item) => [item.npwp_number, item])
//     //       ).values(),
//     //     ]
//     //   : [];

//     // === problems payment join ===
//     const problems_payment = await OrderProblems.findAll({
//       include: [
//         {
//           model: OrderProblemsPayments,
//           as: "orderProblemsPaymentsData",
//           include: [{ model: OrderProblems, as: "orderProblemsData" }],
//           // where: { order_id: sequelize.col("order_problems.order_id") },
//           required: true,
//           attributes: ["receipt", "amount"],
//         },
//       ],
//       where: { order_number: id },
//       attributes: ["payment_status"],
//     });
//     cT.setDataValue("problems_payment", problems_payment);

//     // === pr_problems ===
//     const pr_problems = await PrProblems.findAll({
//       include: {
//         model: Users,
//         as: "ownerData",
//         // where: { order_id: db.sequelize.col("order_problems.order_id") },
//         // required: true,
//         // attributes: ["receipt", "amount"],
//       },
//       where: { order_id: cT.id },
//       order: [["id", "desc"]],
//     });

//     // === check user roles (ae) ===
//     // const authRoles = ["account-executive"];
//     // const userRole = await Roles.findByPk(req.user.roleId); // assuming req.user is injected and roleId exists
//     // const userRoleSlug = userRole?.slug || null;

//     // const is_ae = authRoles.includes(userRoleSlug);

//     // === faktur ===
//     // const faktur = await TaxInvoices.findAll({
//     //   where: { order_number: cT.order_number },
//     // });

//     // === purchase order faktur expiration ===
//     // const po = cT.purchaseOrderData[0] || null;
//     // let expirationDate = 0;
//     // let po_faktur_expired = false;
//     // if (po?.shipped_date) {
//     //   expirationDate = moment(po.shipped_date)
//     //     .add(1, "month")
//     //     .startOf("month")
//     //     .add(11, "days");
//     //   po_faktur_expired = moment().isSameOrAfter(expirationDate);
//     // }

//     const plainOrder = cT.toJSON();

//     const last3 = await Order.findAll({
//       where: { customer_id: cT.customer_id },
//       include: [
//         {
//           association: "orderItemsData",
//           include: ["geoProvinceData", "geoCityData", "geoCountryData"],
//         },
//         {
//           association: "customerData",
//           attributes: ["id", "name", "email", "phone"],
//         },
//         {
//           association: "orderPaymentsData",
//           include: [{ association: "usersData" }, { association: "bankData" }],
//         },
//         { association: "websiteData" },
//       ],
//       order: [["created_at", "DESC"]],
//       limit: 3,
//     });

//     // manually find po
//     const purchaseOrders = await PurchaseOrder.findAll({
//       where: { order_id: cT.id },
//     });

//     return res.json({
//       success: true,
//       data: {
//         problem: status,
//         order: {
//           ...plainOrder,
//           purchaseOrderData: purchaseOrders,
//           orderCustomerData: {
//             ...plainOrder.orderCustomerData,
//             email: obscureData(plainOrder.orderCustomerData.email, "email"),
//             phone: obscureData(plainOrder.orderCustomerData.phone, "phone"),
//             company_email: obscureData(
//               plainOrder.orderCustomerData.company_email,
//               "email"
//             ),
//             company_phone: obscureData(
//               plainOrder.orderCustomerData.company_phone,
//               "phone"
//             ),
//           },
//           customerData: {
//             ...plainOrder.customerData,
//             email: obscureData(plainOrder.customerData.email, "email"),
//             phone: obscureData(plainOrder.customerData.phone, "phone"),
//           },
//         },
//         role: roleuser?.role_id,
//         ae: stat,
//         // list_data_faktur: order_customer_list,
//         pr: cT.orderItemsData,
//         issales,
//         pr_problems,
//         // is_ae,
//         // faktur,
//         // po_faktur_expired,
//         // expiration_date: expirationDate,
//         last_order: last3,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const detailUnmasked = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const OrdersRepository = dataSource.getRepository(Order);

    const order = await OrdersRepository.findOne({
      where: { order_number: id },
      relations: {
        orderItemsData: true,
        orderCustomerData: true,
        customerData: true,
        purchaseOrderData: true,
        orderPaymentsData: {
          usersData: true,
          bankData: true,
        },
        websiteData: true,
      },
    });

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    const last3 = await OrdersRepository.find({
      where: { customer_id: order.customer_id },
      relations: {
        orderItemsData: {
          geoProvinceData: true,
          geoCityData: true,
          geoCountryData: true,
        },
        customerData: true,
        orderPaymentsData: {
          usersData: true,
          bankData: true,
        },
        websiteData: true,
      },
      order: { created_at: "DESC" },
      take: 3,
    });

    const lastOrders = last3.map((o) => {
      const totalPaid =
        o.orderPaymentsData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const paymentLeft = o.total - totalPaid;

      return {
        id: o.id,
        order_number: o.order_number,
        total: o.total,
        payment_status: o.payment_status,
        status: o.status,
        payment_left: paymentLeft,
        owner_name: o.owner || null,
        created_at: dayjs(o.created_at).format("YYYY-MM-DD HH:mm:ss"),
      };
    });

    return res.json({
      success: true,
      data: {
        order,
        last_order: lastOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const list = async (req: any, res: Response, next: NextFunction) => {
  try {
    const {
      date_from = "",
      date_to = "",
      status = "",
      payment_status = "",
      user = "",
      search = "",
      page = "1",
      per_page = "10",
      sort_by = "created_at",
      sort_dir = "ASC",
    } = req.query;

    const userId = req.user.userId;
    const salesUser = await getSettings("general-settings", "sales_users");
    const issales = salesUser.includes(userId);

    const where: any = {};

    // Date range
    if (date_from && date_to) {
      where.created_at = Between(
        new Date(`${date_from}T00:00:00`),
        new Date(`${date_to}T23:59:59`)
      );
    }

    if (status) where.status = Equal(status);
    if (payment_status) where.payment_status = Equal(payment_status);
    if (user) where.owner = Equal(parseInt(user as string));
    if (issales) where.owner = Equal(userId);

    // Flexible search
    const searchFilters: any[] = [];
    if (search) {
      const s = search.toString();
      searchFilters.push({ order_number: ILike(`%${s}%`) });
      searchFilters.push({ customer_id: ILike(`%${s}%`) });
    }

    const limit = parseInt(per_page as string, 10);
    const offset = (parseInt(page as string, 10) - 1) * limit;

    const allowedSortFields = [
      "id",
      "created_at",
      "updated_at",
      "customer_id",
      "status",
      "payment_status",
      "payment_method",
      "total",
      "payment_revision",
      "verify",
      "payment_duedate",
      "order_number",
      "owner",
      "real_invoice",
      "customerData.name",
      "customerData.email",
      "customerData.phone",
    ];

    const sortField = allowedSortFields.includes(sort_by as string)
      ? sort_by
      : "created_at";
    const sortDirection = sort_dir.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const order: any[] = [];
    if (sortField.startsWith("customerData.")) {
      const field = sortField.split(".")[1];
      order.push({ customerData: { [field]: sortDirection } });
    } else {
      order.push({ [sortField]: sortDirection });
    }

    const [orders, total] = await dataSource.getRepository(Order).findAndCount({
      where: searchFilters.length ? [where, ...searchFilters] : where,
      relations: {
        customerData: true,
        orderPaymentsData: false,
        prProblemsData: false,
      },
      order: order[0],
      take: limit,
      skip: offset,
    });

    const data = orders.map((order) => {
      const totalPaid =
        order.orderPaymentsData?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const paymentLeft = order.total - totalPaid;

      return {
        ...order,
        customerData: {
          name: order.customerData?.name || "",
          email: obscureData(order.customerData?.email || "", "email"),
          phone: obscureData(order.customerData?.phone || ""),
        },
        payment_left: paymentLeft,
      };
    });

    return res.json({
      success: true,
      data,
      meta: {
        total,
        page: parseInt(page as string),
        per_page: limit,
        total_pages: Math.ceil(total / limit),
        sort_by: sortField,
        sort_dir: sortDirection,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const unratedOrders = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const retentionRolesId = [82, 14, 33, 13, 42];
    const acquisitionRolesId = [3, 35, 80, 28];
    const excludeIds = [1, 28];

    const [retention, acquisition, exclude] = await Promise.all([
      getUserByRole(retentionRolesId),
      getUserByRole(acquisitionRolesId),
      getUserByRole(excludeIds),
    ]);

    const userId = req.user.userId;
    const start = new Date("2025-05-01T00:00:00");
    const end = new Date(moment().format("YYYY-MM-DD") + "T23:59:59");

    const PurchaseOrderRatingRepository =
      dataSource.getRepository(PurchaseOrderRating);

    // Build base filter
    const baseWhere: any = {
      flower_rating: IsNull(),
      rating_location_image: Not(IsNull()),
      created_at: Between(start, end),
    };

    // Apply division/owner filters
    if (!exclude.includes(userId)) {
      baseWhere.purchaseOrderData = {
        orderData: { owner: userId },
      };
    }
    if (req.query.division === "acquisition") {
      baseWhere.purchaseOrderData = {
        orderData: { owner: In(acquisition) },
      };
    } else if (req.query.division === "retention") {
      baseWhere.purchaseOrderData = {
        orderData: { owner: In(retention) },
      };
    }

    // Query ratings with nested relations
    const ratings = await PurchaseOrderRatingRepository.find({
      where: baseWhere,
      relations: {
        purchaseOrderData: {
          orderData: true,
          customerData: true,
        },
      },
      order: { created_at: "ASC" },
    });

    // Enrich with sales name and division
    const result = await Promise.all(
      ratings.map(async (r) => {
        const ownerId = r.purchaseOrderData?.orderData?.owner;
        const owner = ownerId
          ? await dataSource.getRepository(Users).findOne({
              where: { id: ownerId },
              select: ["id", "name"],
            })
          : null;

        const division = retention.includes(ownerId)
          ? "Retention"
          : acquisition.includes(ownerId)
          ? "Acquisition"
          : null;

        return {
          id: r.id,
          created_at: r.created_at,
          flower_rating: r.flower_rating,
          rating_location_image: r.rating_location_image,
          po_id: r.purchaseOrderData?.id,
          order_number: r.purchaseOrderData?.orderData?.order_number,
          customer_name: r.purchaseOrderData?.customerData?.name,
          sales_name: owner?.name || null,
          division_name: division,
        };
      })
    );

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const last = async (req: any, res: Response, next: NextFunction) => {
  const {
    keyword,
    min_price,
    max_price,
    category_id,
    variant_id,
    product_type,
    occasion,
    province,
    city,
  } = req.query;

  try {
    const owner = req.user.userId;
    const OrdersRepository = dataSource.getRepository(Order);

    // Build nested filters
    const orderItemWhere: any = {};
    const productWhere: any = {};

    if (min_price || max_price) {
      if (min_price && max_price) {
        orderItemWhere.price = Between(+min_price, +max_price);
      } else if (min_price) {
        orderItemWhere.price = MoreThanOrEqual(+min_price);
      } else if (max_price) {
        orderItemWhere.price = LessThanOrEqual(+max_price);
      }
    }

    if (occasion) {
      orderItemWhere.occasion = ILike(`%${occasion}%`);
    }
    if (province) orderItemWhere.province = Equal(province);
    if (city) orderItemWhere.city = Equal(city);

    if (keyword) {
      productWhere.name = ILike(`%${keyword}%`);
      productWhere.product_code = ILike(`%${keyword}%`);
    }
    if (product_type) productWhere.product_type = Equal(product_type);
    if (category_id) productWhere.category_id = Equal(category_id);

    const result = await OrdersRepository.findOne({
      where: {
        owner,
        status: "approved",
      },
      relations: {
        orderItemsData: true,
        purchaseOrderData: {
          supplierData: true,
        },
      },
      order: { created_at: "DESC" },
    });

    // Optional: filter orderItemsData manually if needed
    if (result?.orderItemsData?.length) {
      result.orderItemsData = result.orderItemsData.filter((item) => {
        if (min_price && item.price < +min_price) return false;
        if (max_price && item.price > +max_price) return false;
        if (
          occasion &&
          !item.occasion?.toLowerCase().includes(occasion.toLowerCase())
        )
          return false;
        if (province && item.province !== province) return false;
        if (city && item.city !== city) return false;
        return true;
      });
    }

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const generateGreetingsCard = (req: any, res: Response) => {
  const { website, sender_name, receiver_name, greetings } = req.query;

  let logo = "/assets/images/gc_rb.png";
  if (website === "1") logo = "/assets/images/gc_prestisa.png";
  else if (website === "5") logo = "/assets/images/gc_parselia.png";
  else if (website === "17") logo = "/assets/images/gc_rb.png";

  res.render("greetings-card", {
    logo,
    sender_name,
    receiver_name,
    greetings,
  });
};

export const updateVip = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const { order_id, vip } = req.body;
  const OrderRepository = dataSource.getRepository(Order);

  try {
    const order = await OrderRepository.findOne({ where: { id: order_id } });

    if (order) {
      // Update
      order.vip = vip;
      await OrderRepository.save(order);
    }
    // else {
    //   // Create
    //   savedOrder = await Order.create({ vip: obj.vip });
    // }

    return res.json({
      success: true,
      message: "Successfully change VIP status",
    });
  } catch (error) {
    next(error);
  }
};

export const lock = async (req: any, res: Response, next: NextFunction) => {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  const orderNumber = req.body.order_number;
  const user = req.user;
  const now = new Date();

  try {
    const OrdersRepository = queryRunner.manager.getRepository(Order);
    const CustomersRepository = queryRunner.manager.getRepository(Customer);

    const order = await OrdersRepository.findOne({
      where: { order_number: orderNumber },
    });
    if (!order) throw new Error("Order not found");

    // Update verify flag
    order.verify = 1;
    await OrdersRepository.save(order);

    // --- Approve logs update ---
    let approveLogs: any[] = [];
    try {
      approveLogs = JSON.parse(order.approve_logs || "[]");
      if (!Array.isArray(approveLogs)) approveLogs = [];
    } catch {
      approveLogs = [];
    }

    approveLogs.push({
      status: "Verified",
      notes: `Order Verify, Verified by ${user.userName}`,
      date: moment().format("YYYY-MM-DD HH:mm:ss"),
      user: user.userName,
    });

    order.approve_logs = JSON.stringify(approveLogs);
    await OrdersRepository.save(order);

    // --- Save general log ---
    await createLog(
      "order verify",
      JSON.stringify({
        order_number: orderNumber,
        verify: "1",
        user_id: user.userId,
        user_name: user.userName,
      })
    );

    // --- Extra piutang logic ---
    if (order.payment_type === "piutang") {
      let verifyLogs: any[] = [];
      try {
        verifyLogs = JSON.parse(order.approve_logs || "[]");
        if (!Array.isArray(verifyLogs)) verifyLogs = [];
      } catch {
        verifyLogs = [];
      }

      verifyLogs.push({
        date: moment().format("YYYY-MM-DD HH:mm:ss"),
        notes: "lock order or verify",
        owner: user.userId,
      });

      order.approve_logs = JSON.stringify(verifyLogs);
      await OrdersRepository.save(order);

      const customer = await CustomersRepository.findOne({
        where: { id: order.customer_id },
        relations: { customerArData: true },
      });

      if (customer?.customerArData) {
        const creditLimit = customer.customerArData.credit_limit;

        const overdueCount = await OrdersRepository.createQueryBuilder("order")
          .where("order.customer_id = :cid", { cid: order.customer_id })
          .andWhere("order.payment_type = 'piutang'")
          .andWhere("order.payment_status = 'unpaid'")
          .andWhere("order.status != 'cancelled'")
          .andWhere("order.payment_duedate <= :now", { now })
          .getCount();

        if (overdueCount === 0 && order.total <= creditLimit) {
          let logs: any[] = [];
          try {
            logs = JSON.parse(order.approve_logs || "[]");
            if (!Array.isArray(logs)) logs = [];
          } catch {
            logs = [];
          }

          logs.push({
            date: moment().format("YYYY-MM-DD HH:mm:ss"),
            notes: `Auto approved piutang, customer credit limit decreased by ${order.total}`,
            owner: user.userId,
          });

          order.status = "approved";
          order.approved_at = new Date();
          order.approve_logs = JSON.stringify(logs);
          await OrdersRepository.save(order);

          await autoCreateDocumentInvoice(order);
          await autoCreateFakturPajak(order.customer_id, order.order_number);
        }
      }
    }

    await queryRunner.commitTransaction();
    return res.json({
      success: true,
      message: "Successfully requested order to verify",
    });
  } catch (error) {
    await queryRunner.rollbackTransaction();
    logError(
      "order verify failed",
      JSON.stringify({
        order_number: orderNumber,
        msg: error.message,
        user_id: req.user?.userId,
        user_name: req.user?.userName,
      })
    );

    next(error);
  } finally {
    await queryRunner.release();
  }
};

export const addInvoiceUpdate = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const { approval_type, name, email, phone, customer_id, order_id, notes } =
    req.body;

  try {
    const ApprovalInvoiceUpdatesRepository = dataSource.getRepository(
      ApprovalInvoiceUpdate
    );

    await saveEntity(ApprovalInvoiceUpdatesRepository, ApprovalInvoiceUpdate, {
      user_id: req.user?.userId,
      type: approval_type,
      name,
      email,
      phone,
      customer_id,
      order_id,
      notes,
      approval_retention: 0,
      approval_finance: 0,
    });

    return res.json({
      success: true,
      message: "Successfully add request invoice update",
    });
  } catch (error) {
    next(error);
  }
};

export const submitFaktur = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const {
      order_number,
      nomor,
      nama,
      alamat,
      kirim_customer,
      invoice_address,
      npwp_img_name,
    } = req.body;

    const npwp_img = req.file;
    const OrdersRepository = queryRunner.manager.getRepository(Order);
    const TaxInvoicesRepository =
      queryRunner.manager.getRepository(TaxInvoices);

    const order = await OrdersRepository.findOne({ where: { order_number } });
    if (!order) {
      await queryRunner.rollbackTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const customer_id = `${order.customer_id}_${Date.now()}`;
    let img_n = "";

    if (npwp_img && npwp_img.path) {
      // Case: image is uploaded
      if (!npwp_img.path) {
        const isPdf = npwp_img_name === "pdf";
        const fileName =
          process.env.NODE_ENV === "production"
            ? `npwp_${customer_id}.${isPdf ? "pdf" : "png"}`
            : `staging_npwp_${customer_id}.${isPdf ? "pdf" : "png"}`;

        const localPath = path.join(
          process.cwd(),
          "storage",
          "app",
          "images",
          "faktur",
          fileName
        );

        fs.mkdirSync(path.dirname(localPath), { recursive: true });

        const base64Prefix = isPdf
          ? "data:application/pdf;base64,"
          : /^data:image\/\w+;base64,/;

        const data = isPdf
          ? npwp_img.src.replace(base64Prefix, "")
          : npwp_img.src.replace(base64Prefix, "");

        fs.writeFileSync(localPath, Buffer.from(data, "base64"));

        img_n = `/api/images/faktur/${fileName}`;

        await sendToLavenderFtp(localPath, `/assets/images/faktur/${fileName}`);
      } else {
        const isPdf = npwp_img_name === "pdf";
        img_n =
          process.env.NODE_ENV === "production"
            ? `/api/images/faktur/npwp_${customer_id}.${isPdf ? "pdf" : "png"}`
            : `/api/images/faktur/staging_npwp_${customer_id}.${
                isPdf ? "pdf" : "png"
              }`;
      }
    }

    await saveEntity(TaxInvoicesRepository, TaxInvoices, {
      request_date: moment().format("YYYY-MM-DD"),
      order_number: order.order_number,
      npwp_number: nomor,
      npwp_name: nama,
      npwp_address: alamat,
      physical_document_delivery: kirim_customer,
      physical_document_address: invoice_address,
      npwp_file: img_n,
    });

    await queryRunner.commitTransaction();
    return res.json({
      success: true,
      message: "Successfully saved request faktur",
    });
  } catch (error) {
    await queryRunner.rollbackTransaction();
    next(error);
  } finally {
    await queryRunner.release();
  }
};

export const submitProblem = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      customer_id,
      id: order_id,
      order_number,
      reason,
      payment_method,
      account_number,
      account_holder,
      item_references,
      amount_customer_debit,
      amount_customer_kredit,
      payment_method_problem,
      va_bank,
      bank_name,
      refund_reason,
      complaint_category,
    } = req.body;

    const CustomerBanksRepository = dataSource.getRepository(CustomerBanks);
    const OrderProblemsRepository = dataSource.getRepository(OrderProblems);

    let va_account_number = "";
    let va_external_id = "";
    let va_id = "";

    const dt = new Date().toISOString().slice(0, 19).replace("T", " ");
    const po_status_log = JSON.stringify([
      {
        status: "created",
        date: dt,
        user: req.user?.userName || "system",
      },
    ]);

    // Check if customer bank exists
    const customerBank = await CustomerBanksRepository.findOne({
      where: { account_number, account_holder },
    });

    if (!customerBank) {
      await saveEntity(CustomerBanksRepository, CustomerBanks, {
        account_number,
        account_holder,
        bank_name,
        customer_id,
      });
    }

    // Create VA via Xendit if needed
    if (payment_method_problem === "va" && Number(amount_customer_kredit) > 0) {
      try {
        const createVaEndpoint = `${process.env.XENDIT_BASE_URL}/callback_virtual_accounts`;
        const vaName = "Prestisa Order Problem";

        const params = {
          external_id: `VA-${order_id}-${Date.now()}`,
          bank_code: va_bank,
          name: vaName,
          expected_amount: amount_customer_kredit,
          is_closed: true,
          is_single_use: true,
        };

        const key =
          payment_method == 33
            ? process.env.XENDIT_KEY
            : process.env.XENDIT_KEY_UBB;

        const response = await axios.post(createVaEndpoint, params, {
          auth: { username: key, password: "" },
        });

        va_account_number = response.data.account_number;
        va_external_id = response.data.external_id;
        va_id = response.data.id;
      } catch (e: any) {
        const responseBody = e.response?.data || null;
        await logError(
          "Error Create Virtual Account Xendit",
          JSON.stringify(responseBody || e.message)
        );

        return res.status(responseBody ? 400 : 500).json({
          success: false,
          message: responseBody
            ? "Failed when creating Virtual Account"
            : "Something wrong when creating Virtual Account",
          debug: e.message,
          errors: responseBody || undefined,
        });
      }
    }

    await saveEntity(OrderProblemsRepository, OrderProblems, {
      order_id,
      notes: reason,
      status_log: po_status_log,
      order_number,
      payment_method,
      account_number,
      account_holder,
      owner: req.user?.userId || null,
      amount_customer_debit: amount_customer_debit || 0,
      amount_customer_kredit: amount_customer_kredit || 0,
      item_references,
      complaint_category,
      payment_method_problem,
      va_bank,
      bank_name,
      va_account_number,
      va_external_id,
      va_id,
      payment_status: "",
    });

    await createLog(
      "bank_data_update",
      JSON.stringify({
        user: req.user?.userId,
        action: "create",
        new: {
          order_number,
          payment_method,
          account_number,
          account_holder,
        },
        old: "",
      })
    );

    return res.status(201).json({
      success: true,
      message: "Successfully created order problem",
    });
  } catch (error) {
    next(error);
  }
};

export const reactiveOrder = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const OrdersRepository = queryRunner.manager.getRepository(Order);
    const OrderItemsRepository = queryRunner.manager.getRepository(OrderItems);
    const OrderPaymentsRepository =
      queryRunner.manager.getRepository(OrderPayments);
    const ProductsRepository = queryRunner.manager.getRepository(Products);
    const ProductStockRepository =
      queryRunner.manager.getRepository(ProductStock);
    const UsersRepository = queryRunner.manager.getRepository(Users);

    const id = req.body.order_id;
    const userName = req.user?.userName || "system";

    const order = await OrdersRepository.findOneBy({ id });
    if (!order) {
      await queryRunner.rollbackTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    order.status = "unapproved";
    order.auto_cancel_time = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h
    await OrdersRepository.save(order);

    const orderPayment = await OrderPaymentsRepository.findOne({
      where: { order_id: id },
      order: { id: "DESC" },
    });

    if (orderPayment?.approved === 1) {
      order.payment_status = "paid";
      await OrdersRepository.save(order);
    }

    const updateStock = true;
    if (updateStock) {
      const orderItems = await OrderItemsRepository.find({
        where: { order_id: id, shipping_method: Not(null) },
        relations: { productsData: true },
      });

      for (const item of orderItems) {
        const stok = item.productsData.qty;
        if (stok >= item.qty || item.productsData.is_pre_order) {
          const product = await ProductsRepository.findOneBy({
            id: item.product_id,
          });
          if (!product) continue;

          product.qty -= item.qty;
          await ProductsRepository.save(product);

          await saveEntity(ProductStockRepository, ProductStock, {
            product_id: product.id,
            qty: item.qty,
            type: "minus",
            category: 0,
            user_id: req.user?.userId || 1,
            remarks: `reactive order = ${item.order_id}`,
          });
        } else {
          await queryRunner.rollbackTransaction();
          return res.json({ success: false, message: "Stock Unavailable" });
        }
      }
    }

    const loggedUserId = req.user?.userId;
    const ownerUser = loggedUserId
      ? await UsersRepository.findOneBy({ id: loggedUserId })
      : null;
    const owner = ownerUser?.name || "system";

    let logs: any[] = [];
    try {
      logs = JSON.parse(order.approve_logs || "[]");
      if (!Array.isArray(logs)) logs = [];
    } catch {
      logs = [];
    }

    const dt = new Date().toISOString().slice(0, 19).replace("T", " ");
    logs.push({
      status: "unapproved",
      notes: `reactive order ${order.order_number}`,
      date: dt,
      user: owner,
    });

    order.approve_logs = JSON.stringify(logs);
    await saveEntity(OrdersRepository, Order, order);
    await createLog(
      "reactiver order trigger",
      `order id = ${id}, by user = ${userName}`
    );

    await queryRunner.commitTransaction();
    return res.json({
      success: true,
      message: "Successfully reactivated the current order",
    });
  } catch (error) {
    await logError("reactiver order error", error.message);
    next(error);
  } finally {
    await queryRunner.release();
  }
};

export const approveOrder = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const OrdersRepository = queryRunner.manager.getRepository(Order);
    const OrderItemsRepository = queryRunner.manager.getRepository(OrderItems);
    const UsersRepository = queryRunner.manager.getRepository(Users);

    const id = req.body.order_id;
    const userName = req.user?.userName || "system";

    const order = await OrdersRepository.findOneBy({ id });
    if (!order) {
      await queryRunner.rollbackTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    order.status = "approved";
    await OrdersRepository.save(order);

    const orderItems = await OrderItemsRepository.find({
      where: { order_id: id },
    });
    for (const item of orderItems) {
      item.problem = 2;
      await OrderItemsRepository.save(item);
    }

    const loggedUserId = req.user?.userId;
    const ownerUser = loggedUserId
      ? await UsersRepository.findOneBy({ id: loggedUserId })
      : null;
    const owner = ownerUser?.name || "system";

    let logs: any[] = [];
    try {
      logs = JSON.parse(order.approve_logs || "[]");
      if (!Array.isArray(logs)) logs = [];
    } catch {
      logs = [];
    }

    const dt = new Date().toISOString().slice(0, 19).replace("T", " ");
    logs.push({
      status: "approved",
      notes: `reapprove order ${order.order_number}`,
      date: dt,
      user: owner,
    });

    order.approve_logs = JSON.stringify(logs);
    await OrdersRepository.save(order);

    await createLog(
      "approve order trigger",
      `order id = ${id}, by user = ${userName}`
    );

    await queryRunner.commitTransaction();
    return res.json({
      success: true,
      message: "Successfully approved the current order",
    });
  } catch (error) {
    await queryRunner.rollbackTransaction();
    next(error);
  } finally {
    await queryRunner.release();
  }
};

export const importBulkOrder = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const file = req.file;

  try {
    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "File not received." });
    }

    const generateCartId = () => Math.random().toString(36).slice(2, 11);

    const workbook = XLSX.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet);

    if (!rows.length) {
      return res.json({
        success: false,
        message: "The uploaded file is empty",
      });
    }

    const ProductRepository = dataSource.getRepository(Products);
    const maskedResult = [];

    for (const row of rows) {
      const {
        ["Shipping Address"]: shipping_address,
        ["SKU"]: sku,
        ["Quantity"]: quantity,
        ["Sender Name"]: sender_name,
        ["Note Mitra"]: note_mitra,
        ["Note Purchasing"]: note_purchasing,
        ["Greetings"]: greetings,
        ["Occasion"]: occasion,
        ["Receiver Name"]: receiver_name,
        ["Receiver Phone"]: receiver_phone,
      }: any = row;

      if (!sku) continue;

      const product = await ProductRepository.findOne({
        where: { product_code: sku },
      });
      if (!product) continue;

      maskedResult.push({
        product_id: product.id,
        id: product.id,
        name: product.name,
        price: product.price,
        capital_price: product.capital_price,
        qty: quantity,
        image: product.image,
        product_code: product.product_code,
        subtotal: product.price,
        shipping_cost: 0,
        shipping_expedition: "",
        shipping_address,
        sender_name,
        notes: note_mitra,
        notes_internal: note_purchasing,
        greetings,
        city: "",
        province: "",
        country: "",
        date_time: "",
        occasion,
        receiver_name,
        receiver_phone: phone62(receiver_phone),
        category_id: product.category_id,
        cart_id: generateCartId(),
        supplier_id: product.supplier_id,
        is_pre_order: null,
        product_qty: product.qty,
      });
    }

    return res.json({
      success: true,
      data: maskedResult,
    });
  } catch (error) {
    next(error);
  }
};

export const rateSales = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { po_id, flower_rating, flower_comment, complaint_category } = req.body;
  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const PurchaseOrderRepository =
      queryRunner.manager.getRepository(PurchaseOrder);
    const PurchaseOrderRatingRepository =
      queryRunner.manager.getRepository(PurchaseOrderRating);

    const po = await PurchaseOrderRepository.findOneBy({ id: po_id });
    if (!po) throw new Error("Purchase Order not found");

    let rating = await PurchaseOrderRatingRepository.findOne({
      where: { po_id },
    });

    if (rating) {
      rating.rating_location_image = rating?.rating_location_image || 0;
      rating.flower_rating = flower_rating;
      rating.flower_comment = flower_comment;
      rating.rating_by = 2;
      rating.customer_id = po.customer_id || null;
      rating.complaint_category = complaint_category;

      await PurchaseOrderRatingRepository.save(rating);
    } else {
      saveEntity(PurchaseOrderRatingRepository, PurchaseOrderRating, {
        po_id,
        flower_rating,
        flower_comment,
        customer_id: po.customer_id || null,
        rating_by: 2,
        complaint_category,
      });
    }

    await supplierRateAvg(po.supplier_id, queryRunner);

    const poWithRelations = await PurchaseOrderRepository.findOne({
      where: { id: po_id },
      relations: { orderData: true, supplierData: true },
    });

    const to = poWithRelations?.supplierData?.phone;
    const websiteid = poWithRelations?.orderData?.website;
    const po_number = `PO ${po_id}`;

    if (websiteid === 1) {
      const templatename = "tamplate_review_mitra_03062025";
      const placeholder = [po_number, flower_rating, ","];
      await waNotifHsm(to, templatename, placeholder);
    } else if (websiteid === 8) {
      // ftw logic here
    }

    await photoApproval(po_id, flower_rating, queryRunner);

    await queryRunner.commitTransaction();
    return res.json({
      success: true,
      message: "Successfully updated rating and photo approval",
    });
  } catch (error) {
    await queryRunner.rollbackTransaction();
    next(error);
  } finally {
    await queryRunner.release();
  }
};

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Parse request data
    let obj = req.body;

    // Process cart items and validate
    for (const [index, cart] of obj.cart.entries()) {
      obj.cart[index].price = cart.price + 5000;
      obj.cart[index].subtotal = cart.subtotal + 5000 * cart.qty;

      if (obj.cart[index].subtotal <= 5000) {
        await queryRunner.rollbackTransaction();
        res.json({
          success: false,
          message: "Failed to create Order check Subtotal",
        });
        return;
      }
    }

    const or_id = obj.id;

    // Find order using helper
    const order = await queryRunner.manager.findOne(Order, {
      where: { id: or_id },
    });

    if (!order) {
      await queryRunner.rollbackTransaction();
      res.json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    const un = order.unique_code;
    const real_total = obj.total;
    let tax_result = 0;

    // Tax calculation
    if (obj.tax_type === "tax") {
      const tax_percentage = await getSettings(
        "general-settings",
        "productTaxPercentage"
      );
      tax_result = Math.round(real_total) * (tax_percentage / 100);
    }

    const total_after_tax = Math.round(real_total) + Math.round(tax_result);
    const total =
      obj.payment_method === "va" ? total_after_tax : total_after_tax + un;

    // Warehouse stock validation
    const wh_cart = obj.cart
      .filter((item) => item.shipping_method && item.shipping_method !== null)
      .reduce((groups: any, item: any) => {
        const key = item.product_id;
        if (!groups[key]) {
          groups[key] = {
            id: key,
            name: item.name,
            qty: 0,
          };
        }
        groups[key].qty += item.qty;
        return groups;
      }, {});

    const wh_cart_array = Object.values(wh_cart) as any[];

    for (const item of wh_cart_array) {
      const product = await queryRunner.manager.findOne(Products, {
        where: { id: item.product_id },
      });

      if (product) {
        // Sum existing product quantity using query builder
        const sumResult = await queryRunner.manager
          .createQueryBuilder(OrderItems, "orderItems")
          .select("SUM(orderItems.qty)", "sum")
          .where("orderItems.order_id = :orderId", { orderId: order.id })
          .andWhere("orderItems.product_id = :productId", {
            productId: item.id,
          })
          .getRawOne();

        const sum_existing_product = parseFloat(sumResult?.sum || 0);
        const now_qty = product.qty + sum_existing_product;

        if (now_qty < item.qty && product.is_pre_order !== 1) {
          await queryRunner.rollbackTransaction();
          res.json({
            success: false,
            message: `Stock is not enough for ${item.name}. You can only order ${now_qty} at this moment`,
          });
          return;
        }
      }
    }

    // Update Virtual Account if needed
    if (order.payment_method === "va" && order.payment_type === "cash") {
      try {
        const isTaxTypeChanged = order.tax_type !== obj.tax_type;

        if (isTaxTypeChanged) {
          await expireVaXendit(order.va_id, order.tax_type);

          const vaData = await createVaXendit(obj, order.order_number, total);
          Object.assign(obj, vaData);
        } else {
          try {
            const updatedVa = await updateVaXendit(
              order.va_id,
              total,
              order.tax_type
            );

            obj.va_account_number = updatedVa.account_number;
            obj.va_external_id = updatedVa.external_id;
            obj.va_id = updatedVa.id;
          } catch (err: any) {
            if (
              err.response?.data?.error_code ===
              "CALLBACK_VIRTUAL_ACCOUNT_NOT_FOUND_ERROR"
            ) {
              await expireVaXendit(order.va_id, order.tax_type);
              const vaData = await createVaXendit(
                obj,
                order.order_number,
                total
              );
              Object.assign(obj, vaData);
            } else {
              // Create log using helper
              await logError(
                `order_update_va_error_${order.id}`,
                JSON.stringify({
                  type: "error",
                  message: err.message,
                  line: err.stack?.split("\n")[1]?.trim(),
                  file: err.stack?.split("\n")[0]?.trim(),
                })
              );
            }
          }
        }
      } catch (err: any) {
        // Create log using helper
        logError(
          `order_update_va_error_${order.id}`,
          JSON.stringify({
            type: "error",
            message: err.message,
            line: err.stack?.split("\n")[1]?.trim(),
            file: err.stack?.split("\n")[0]?.trim(),
          })
        );
      }
    }

    // Update order using helper
    const updateData = {
      id: obj.id,
      website: obj.website,
      vip: obj.vip,
      real_invoice: obj.real_invoice,
      order_number: obj.order_number,
      customer_id: obj.customer_id,
      tax_type: obj.tax_type || null,
      tax_result: tax_result,
      total: Math.round(total),
      payment_type: obj.payment_type || "piutang",
      owner: obj.owner,
      status: obj.status,
      payment_status: obj.payment_status,
      payment_duedate: obj.payment_duedate || null,
      inquiry_id: obj.inquiry_id,
      unique_code: un,
      cashback: obj.cashback,
      invoice_address: obj.invoice_address,
      sales_from: obj.sales_from,
    };

    await saveEntity(queryRunner.manager, Order, updateData);

    // Refresh order data
    const cD = obj.customer_data;
    const freshOrder = await queryRunner.manager.findOne(Order, {
      where: { id: obj.id },
    });

    if (freshOrder) {
      try {
        await updateOrderCustomerJob(freshOrder.id, cD, obj);
        await updateOrderItemsJob(freshOrder.id, obj.cart);
        await queryRunner.commitTransaction();
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      }

      res.json({
        success: true,
        message: "Successfully update Order",
      });
    } else {
      res.json({
        success: false,
        message: "Failed to update Order",
      });
    }
  } catch (error) {
    await queryRunner.rollbackTransaction();
    next(error);
  } finally {
    await queryRunner.release();
  }
};

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const queryRunner = dataSource.createQueryRunner();
  let customer_name = req.body.customer_data.name;

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Parse request data
    let obj = req.body;
    const cD = obj.customer_data;
    obj.status = "deal";
    let referral = cD.my_referral_code || null;

    // Process cart items
    obj.cart.forEach((cart: any, index: number) => {
      obj.cart[index].price = cart.price + 5000;
      obj.cart[index].subtotal = cart.subtotal + 5000 * cart.qty;
      if (obj.cart[index].receiver_phone) {
        obj.cart[index].receiver_phone = phone62(
          obj.cart[index].receiver_phone
        );
      }
    });

    // Warehouse stock validation
    const wh_cart = obj.cart
      .filter(
        (item: any) => item.shipping_method && item.shipping_method !== null
      )
      .reduce((groups: any, item: any) => {
        if (!groups[item.product_id]) {
          groups[item.id] = {
            id: item.id,
            name: item.name,
            qty: 0,
          };
        }
        groups[item.id].qty += item.qty;
        return groups;
      }, {});

    const wh_cart_array = Object.values(wh_cart) as any[];

    for (const item of wh_cart_array) {
      const product = await queryRunner.manager.findOne(Products, {
        where: { id: item.product_id },
      });

      if (product && product.qty < item.qty && product.is_pre_order !== 1) {
        await queryRunner.rollbackTransaction();
        res.json({
          success: false,
          message: `Stok tidak tersedia untuk ${item.name}. Stok yang tersedia: ${product.qty}`,
        });
        return;
      }
    }

    let customer_id: number;

    if (cD.id) {
      // Handle existing customer
      customer_id = cD.id;

      const existingCustomer = await Customer.findOneBy({ id: cD.id });

      if (!existingCustomer) {
        res.json({ success: false, message: "Customer not found" });
        return;
      } else {
        cD.email = existingCustomer.email;
        cD.phone = existingCustomer.phone;
        cD.company_email = existingCustomer.company_email;
        cD.company_phone = existingCustomer.company_phone;
      }

      if (!referral) {
        referral = await referralCodeGenerator(cD.name);
      }

      const imagePath = await uploadImageKtpNpwp(cD, customer_id);

      await saveEntity(queryRunner.manager, Customer, {
        id: customer_id,
        gender: cD.gender || "null",
        npwp_img: imagePath.img_n,
        ktp_img: imagePath.img_k,
        invoice_address: obj.invoice_address,
        my_referral_code: referral,
      });
    } else {
      // Handle new customer
      const has_potential = await queryRunner.manager.findOne(
        EpPotentialReferrals,
        {
          where: {
            phone: phone62(cD.phone),
            join_date: null,
          },
        }
      );

      const check_number_phone = await queryRunner.manager.count(Customer, {
        where: { phone: phone62(cD.phone) },
      });

      if (check_number_phone > 0) {
        await queryRunner.rollbackTransaction();
        res.json({
          success: false,
          message: "Phone Number Duplicated",
        });
        return;
      }

      let upline_referral = "";
      if (has_potential) {
        const upline = await queryRunner.manager.findOne(Customer, {
          where: { id: has_potential.upline_id },
          select: ["my_referral_code"],
        });

        if (upline) {
          upline_referral = upline.my_referral_code;
        }

        await saveEntity(queryRunner.manager, EpPotentialReferrals, {
          id: has_potential.id,
          join_date: new Date(),
        });
      }

      let customerData: any = {
        name: cD.name,
        email: cD.email,
        phone: phone62(cD.phone),
        type: cD.type,
        gender: cD.gender || "null",
        is_member: cD.is_member || 0,
        member_since: cD.member_since || null,
        points: 0,
        my_referral_code: await referralCodeGenerator(cD.name),
        upline_referral_code: upline_referral,
        password: "",
        cust_status: "",
        mou_status: "",
        status_log: "null",
        npwp: "",
        nik: "",
        ktp_img: "",
        npwp_img: "",
        notes: "",
        address: "",
        refcode: "",
        device_type: "",
        device_os: "",
        credits: 0,
        no_finance: "",
        no_finance_2: "",
        invoice_address: "",
        is_ba: 0,
        company_type: 0,
        company_name: "",
        company_address: "",
        company_email: "",
        company_phone: "",
        customer_settings: "",
        label: "",
        owner: 0,
        google_id: "",
        avatar: "",
        avatar_original: "",
        application_letter: "",
        login: 0,
        fbasekey: "",
        google_sso: "",
        reset_password: "",
        verified: 0,
        invoice_tax_status: 0,
        is_staging: 0,
        ep_join_date: null,
        avatar_image: "",
        verified_token: "",
        bank: "",
        account_number: 0,
        account_name: "",
        notif_status_pemesanan_produk: 0,
        notif_status_pembayaran: 0,
        notif_penggunaan_point: 0,
        notif_downline_baru: 0,
        notif_point_downline: 0,
        sso: 0,
        verify_email_expired_date: null,
        layer: 0,
        program: 0,
        mgm: 0,
        finance_phone_mou: "",
        mou_docs: "",
        mou_type: 0,
        mgm_downline_id: 0,
        finance_phone_mgm: "",
        approval_mou_operation: 0,
        approval_mou_finance: 0,
        approval_mgm_operation: 0,
        approval_mgm_finance: 0,
        log_program: "",
        log_mou: "",
        mou_end_date: null,
        mgm_upline_id: 0,
        uuid: "",
        level: 0,
        redeemed_points: 0,
        _lft: 0,
        _rgt: 0,
        parent_id: 0,
        wp_id: 0,
      };

      if (cD.type === 1) {
        // Corporation
        customerData = {
          ...customerData,
          company_type: cD.company_type ?? null,
          company_name: cD.company_name || "",
          company_address: cD.company_address || "",
          company_email: cD.company_email || "",
          company_phone: cD.company_phone || "",
        };
      }

      const cT = await saveEntity(queryRunner.manager, Customer, customerData);

      customer_id = cT.id;
      const imagePath = await uploadImageKtpNpwp(cD, customer_id);
      const refcode = "RF" + customer_id;

      saveEntity(queryRunner.manager, Customer, {
        id: customer_id,
        refcode: refcode,
        npwp_img: imagePath.img_n,
        ktp_img: imagePath.img_k,
      });
    }

    // Order counting and unique code generation
    const cekjumlahdata = await queryRunner.manager.count(Order);
    const cekincrement = await queryRunner.manager
      .createQueryBuilder(Order, "order")
      .orderBy("order.created_at", "DESC")
      .getOne();

    let un: number, total: number;
    if (cekjumlahdata < 1) {
      un = 101;
      total = obj.total + un;
    } else if (cekincrement && cekincrement.unique_code % 999 === 0) {
      un = 101;
      total = obj.total + un;
    } else {
      un = (cekincrement?.unique_code || 0) + 1;
      total = obj.total + un;
    }

    // Order number generation
    const maxOrder = await queryRunner.manager
      .createQueryBuilder(Order, "order")
      .select("MAX(order.id)", "max")
      .getRawOne();

    const order_number_base = (maxOrder?.max || 0) + 1;
    const now = new Date();
    const dt =
      now.getFullYear().toString().slice(-2) +
      (now.getMonth() + 1).toString().padStart(2, "0") +
      now.getDate().toString().padStart(2, "0");

    const todayOrderCount =
      (await queryRunner.manager
        .createQueryBuilder(Order, "order")
        .where("DATE(order.created_at) = CURDATE()")
        .getCount()) + 1;

    const todayOrderCountStr = todayOrderCount.toString().padStart(3, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const milliseconds = Math.floor(now.getMilliseconds() / 10)
      .toString()
      .padStart(2, "0");
    const timePrefix = (seconds + milliseconds).padStart(4, "0");

    const order_number =
      order_number_base + dt + timePrefix + todayOrderCountStr;

    // Tax calculation
    let tax_result = 0;
    if (obj.tax_type === "tax") {
      const totaltemp = obj.total;
      const tax_percentage = await getSettings(
        "general-settings",
        "productTaxPercentage"
      );
      tax_result = Math.round(obj.total) * (tax_percentage / 100);
      const total_after_tax = Math.round(totaltemp) + Math.round(tax_result);

      console.log("ggggafaga", tax_result, obj.tax_type, tax_percentage);

      if (obj.payment_method === "va") {
        total = total_after_tax;
      } else {
        total = total_after_tax + un;
      }
    } else {
      if (obj.payment_method === "va") {
        total = obj.total;
      } else {
        total = obj.total + un;
      }
    }

    // Xendit Virtual Account
    await createVaXendit(obj, order_number, total);

    // Prepare order data
    const orderData: any = {
      ...obj,
      verify: 0,
      payment_revision: "",
      payment_notes: "",
      invoice_receipt: "",
      moota_stat: "",
      sales_from: obj.sales_from,
      order_number: order_number,
      customer_id: customer_id,
      refcode: obj.my_referral_code || "null",
      website: obj.website,
      status: "unapproved",
      tax_type: obj.tax_type || null,
      tax_result: tax_result,
      payment_status: "unpaid",
      payment_duedate: obj.payment_duedate || null,
      payment_type: obj.payment_type || "piutang",
      total: total,
      cashback: obj.cashback,
      real_invoice: obj.real_invoice,
      inquiry_id: 0,
      unique_code: obj.payment_method === "va" ? 0 : un,
      invoice_address: obj.invoice_address,
      tax_invoice: obj.tax_invoice,
      receipt: obj.receipt || null,
      payment_method: obj.payment_method,
      auto_cancel_time: new Date(),
      total_gross: obj.total,
    };

    // Determine owner
    const customer = await queryRunner.manager.findOne(Customer, {
      where: { id: customer_id },
    });

    const owner = await queryRunner.manager.findOne(Users, {
      relations: ["roleUserData"],
      where: { id: (req as any).user.userId }, // Assuming you have auth middleware
    });

    const roleAdminTele =
      owner?.roleUserData?.some((ru: any) => ru.role_id === 42) || false;
    orderData.owner = roleAdminTele
      ? customer?.owner || (req as any).user.userId
      : (req as any).user.userId;
    orderData.owner = orderData.owner || 271;

    try {
      const order = await saveEntity(queryRunner.manager, Order, orderData);

      await createOrderCustomerJob(order, cD, queryRunner);
      await createOrderItemsJob(
        order,
        obj,
        (req as any).user.userId,
        queryRunner
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    }

    // Update stock
    for (const cart of obj.cart) {
      const p = await queryRunner.manager.findOne(MetaValues, {
        where: { product_id: cart.product_id },
      });

      if (p) {
        const stocks = ["online_stock", "offline_stock", "reseller_stock"];
        for (const stock of stocks) {
          if ((p as any)[stock] > 0) {
            (p as any)[stock] = Math.max(0, (p as any)[stock] - cart.qty);
            await queryRunner.manager.save(MetaValues, p);
            break;
          }
        }
      }
    }

    res.json({
      success: true,
      message: "Successfully create new order",
    });
  } catch (error) {
    await queryRunner.rollbackTransaction();
    await logError(`create order for ${customer_name}`, error);

    next(error);
  } finally {
    await queryRunner.release();
  }
};
