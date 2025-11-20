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
  autoCreateDocumentInvoice,
  autoCreateFakturPajak,
  sendToLavenderFtp,
  getUserByRole,
  phone62,
  referralCodeGenerator,
  maskOrder,
  waNotifHsm,
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
const RoleUser = require("../models/roleUser");
const path = require("path");
const sequelize = require("../config/db");
const Logs = require("../models/logs");
const TaxInvoices = require("../models/taxInvoices");
const ApprovalInvoiceUpdate = require("../models/approvalInvoiceUpdate");
const CustomerBanks = require("../models/customerBanks");
const ProductStock = require("../models/productStock");
const Products = require("../models/products");
const { default: axios } = require("axios");
const Roles = require("../models/roles");
const EpPotentialReferrals = require("../models/epPotentialReferrals");
const MetaValues = require("../models/metaValues");
const PurchaseOrderRating = require("../models/purchaseOrderRating");
const createOrderCustomerJob = require("../jobs/createOrderCustomerJob");
const createOrderItemsJob = require("../jobs/createOrderItemsJob");
const updateOrderCustomerJob = require("../jobs/updateOrderCustomerJob");
const updateOrderItemsJob = require("../jobs/updateOrderItemsJob");
const createImageJob = require("../jobs/createImageJob");
const uploadImageKtpNpwp = require("../utils/orders/uploadImageKtpNpwp");
const createVaXendit = require("../jobs/createVaXendit");
const expireVaXendit = require("../jobs/expireVaXendit");
const updateVaXendit = require("../jobs/updateVaXendit");
const XLSX = require("xlsx");
const supplierRateAvg = require("../utils/orders/supplierRateAvg");
const photoApproval = require("../utils/orders/photoApproval");
const ProductCategoryNew = require("../models/productCategoryNew");

exports.last = async (req, res, next) => {
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

    // Build nested filters
    const orderItemWhere = {};
    const productWhere = {};

    if (min_price || max_price) {
      orderItemWhere.price = {};
      if (min_price) orderItemWhere.price[Op.gte] = parseInt(min_price);
      if (max_price) orderItemWhere.price[Op.lte] = parseInt(max_price);
    }
    if (occasion) {
      orderItemWhere.occasion = { [Op.like]: `%${occasion}%` };
    }
    if (province) orderItemWhere.province = province;
    if (city) orderItemWhere.city = city;

    if (keyword) {
      productWhere[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { product_code: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (product_type) {
      productWhere.product_type = product_type;
    }
    if (category_id) {
      productWhere.category_id = category_id;
    }

    const result = await Order.findOne({
      where: {
        owner,
        status: "approved",
      },
      include: [
        {
          model: OrderItems,
          as: "orderItemsData",
          required: true,
          where: {
            ...(Object.keys(orderItemWhere).length ? orderItemWhere : {}),
            ...(occasion ? { occasion: { [Op.like]: `%${occasion}%` } } : {}),
          },
          // ✅ REMOVE nested include of Products to avoid alias confusion
        },
        {
          model: PurchaseOrder,
          as: "purchaseOrderData",
          include: [
            {
              model: Supplier,
              as: "supplierData",
              attributes: ["id", "name", "phone"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: 1,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.rateSales = async (req, res, next) => {
  const po_id = req.body.po_id;

  const t = await sequelize.transaction();

  try {
    const po = await PurchaseOrder.findByPk(po_id, { transaction: t });
    if (!po) throw new Error("Purchase Order not found");

    let rating = await PurchaseOrderRating.findOne({
      where: { po_id },
      transaction: t,
    });

    let flower_rating = req.body.flower_rating;
    let flower_comment = req.body.flower_comment;
    let complaint_category = req.body.complaint_category;
    let rating_location_image = 0;

    if (rating) {
      rating_location_image = rating.rating_location_image || 0;
      rating.flower_rating = flower_rating;
      rating.flower_comment = flower_comment;
      rating.rating_by = 2; // by sales
      rating.customer_id = po.customer_id || null;
      rating.complaint_category = complaint_category;
      await rating.save({ transaction: t });
    } else {
      rating = await PurchaseOrderRating.create(
        {
          po_id,
          flower_rating,
          flower_comment: flower_comment,
          customer_id: po.customer_id || null,
          rating_by: 2,
          complaint_category: complaint_category,
        },
        { transaction: t }
      );
    }

    await supplierRateAvg(po.supplier_id, t);

    const poWithRelations = await PurchaseOrder.findByPk(po_id, {
      include: [
        {
          model: Order,
          as: "orderData",
        },
        { model: Supplier, as: "supplierData" },
      ],
      transaction: t,
    });

    const to = poWithRelations.supplierData?.phone;
    const websiteid = poWithRelations.orderData?.website;
    const po_number = `PO ${po_id}`;
    const sp = await Supplier.findByPk(po.supplier_id, { transaction: t });
    // const avg_rating = sp?.avg_rating || 0;
    // const total_rating = (flower_rating + rating_location_image) / 2;

    if (websiteid === 1) {
      const templatename = "tamplate_review_mitra_03062025";
      const placeholder = [po_number, flower_rating, ","];
      await waNotifHsm(to, templatename, placeholder);
    } else if (websiteid === 8) {
      // ftw logic here
    }

    await photoApproval(po_id, flower_rating, t);

    await t.commit();
    return res.json({
      success: true,
      message: "Successfully updated rating  and photo approval",
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.importBulkOrder = async (req, res, next) => {
  const file = req.file;

  try {
    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "File not received." });
    }

    const generateCartId = () => Math.random().toString(36).slice(2, 11);

    // parse Excel/CSV
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

    let maskedResult = [];

    for (const row of rows) {
      const shipping_address = row["Shipping Address"];
      const sku = row["SKU"];
      const quantity = row["Quantity"];
      const sender_name = row["Sender Name"];
      const note_mitra = row["Note Mitra"];
      const note_purchasing = row["Note Purchasing"];
      const greetings = row["Greetings"];
      const occasion = row["Occasion"];
      const receiver_name = row["Receiver Name"];
      const receiver_phone = row["Receiver Phone"];

      if (!sku) continue;

      const product = await Products.findOne({ where: { product_code: sku } });

      const cartItem = {
        product_id: product.id, // for edit order
        id: product.id, // for create order
        name: product.name,
        price: product.price,
        capital_price: product.capital_price,
        qty: quantity,
        image: product.image,
        product_code: product.product_code,
        subtotal: product.price,
        shipping_cost: 0,
        shipping_expedition: "",
        shipping_address: shipping_address,
        sender_name: sender_name,
        notes: note_mitra,
        notes_internal: note_purchasing,
        greetings: greetings,
        city: "",
        province: "",
        country: "",
        date_time: "",
        occasion: occasion,
        receiver_name: receiver_name,
        receiver_phone: phone62(receiver_phone),
        category_id: product.category_id,
        cart_id: generateCartId(),
        supplier_id: product.supplier_id,
        is_pre_order: null,
        product_qty: product.qty,
      };

      maskedResult.push(cartItem);
    }

    return res.json({
      success: true,
      data: maskedResult,
    });
  } catch (error) {
    next(error);
  }
};

exports.generateGreetingsCard = (req, res) => {
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

exports.update = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    // Parse request data
    let obj = req.body;

    // Process cart items and validate
    for (const [index, cart] of obj.cart.entries()) {
      obj.cart[index].price = cart.price + 5000;
      obj.cart[index].subtotal = cart.subtotal + 5000 * cart.qty;

      if (obj.cart[index].subtotal <= 5000) {
        await transaction.rollback();
        return res.json({
          success: false,
          message: "Failed to create Order check Subtotal",
        });
      }
    }

    const or_id = obj.id;
    const order = await Order.findOne({
      where: { id: or_id },
      transaction,
    });

    if (!order) {
      await transaction.rollback();
      return res.json({
        success: false,
        message: "Order not found",
      });
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
      .reduce((groups, item) => {
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

    const wh_cart_array = Object.values(wh_cart);

    for (const item of wh_cart_array) {
      const product = await Products.findByPk(item.product_id, { transaction });

      if (product) {
        const sum_existing_product = await OrderItems.sum("qty", {
          where: {
            order_id: order.id,
            product_id: item.id,
          },
          transaction,
        });

        const now_qty = product.qty + (sum_existing_product || 0);

        if (now_qty < item.qty && product.is_pre_order !== 1) {
          await transaction.rollback();
          return res.json({
            success: false,
            message: `Stock is not enough for ${item.name}. You can only order ${now_qty} at this moment`,
          });
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
          } catch (err) {
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
              await Logs.create({
                name: `order_update_va_error_${order.id}`,
                data: JSON.stringify({
                  type: "error",
                  message: err.message,
                  line: err.stack?.split("\n")[1]?.trim(),
                  file: err.stack?.split("\n")[0]?.trim(),
                }),
              });
            }
          }
        }
      } catch (err) {
        await Logs.create({
          name: `order_update_va_error_${order.id}`,
          data: JSON.stringify({
            type: "error",
            message: err.message,
            line: err.stack?.split("\n")[1]?.trim(),
            file: err.stack?.split("\n")[0]?.trim(),
          }),
        });
      }
    }

    // Update order
    const updateData = {
      ...obj,
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

    await Order.update(updateData, {
      where: { id: obj.id },
      returning: true,
      transaction,
    });

    // Refresh order data
    const cD = obj.customer_data;
    const freshOrder = await Order.findByPk(obj.id, { transaction });

    try {
      await updateOrderCustomerJob(freshOrder.id, cD, obj);
      await updateOrderItemsJob(freshOrder.id, obj.cart);
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    // Create PDF
    // const pdfLoc = path.join(process.cwd(), 'public', 'pdf', `${freshOrder.order_number}.pdf`);
    // CreatePdfJob.dispatch(freshOrder, pdfLoc);

    if (freshOrder) {
      return res.json({
        success: true,
        message: "Successfully update Order",
      });
    } else {
      return res.json({
        success: false,
        message: "Failed to update Order",
      });
    }
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.create = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  let customer_name = req.body.customer_data.name;

  try {
    // Parse request data
    let obj = req.body;

    const cD = obj.customer_data;
    obj.status = "deal";
    const referral = cD.my_referral_code || null;

    // Process cart items
    obj.cart.forEach((cart, index) => {
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
      .filter((item) => item.shipping_method && item.shipping_method !== null)
      .reduce((groups, item) => {
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

    const wh_cart_array = Object.values(wh_cart);

    for (const item of wh_cart_array) {
      const product = await Products.findByPk(item.product_id);
      if (product && product.qty < item.qty && product.is_pre_order !== 1) {
        await transaction.rollback();
        return res.json({
          success: false,
          message: `Stok tidak tersedia untuk ${item.name}. Stok yang tersedia: ${product.qty}`,
        });
      }
    }

    let customer_id;

    // Handle existing customer
    if (cD.id) {
      customer_id = cD.id;

      if (!referral) {
        referral = await referralCodeGenerator(cD.name);
      }

      const imagePath = await uploadImageKtpNpwp(cD, customer_id);

      await Customer.update(
        {
          gender: cD.gender || "null",
          npwp_img: imagePath.img_n,
          ktp_img: imagePath.img_k,
          invoice_address: obj.invoice_address,
          my_referral_code: referral,
        },
        {
          where: { id: customer_id },
          transaction,
        }
      );
    } else {
      // Handle new customer
      const has_potential = await EpPotentialReferrals.findOne({
        where: {
          phone: phone62(cD.phone),
          join_date: null,
        },
      });

      const check_number_phone = await Customer.count({
        where: { phone: phone62(cD.phone) },
      });

      if (check_number_phone > 0) {
        await transaction.rollback();
        return res.json({
          success: false,
          message: "Phone Number Duplicated",
        });
      }

      let upline_referral = "";
      if (has_potential) {
        const upline = await Customer.findByPk(has_potential.upline_id, {
          attributes: ["my_referral_code"],
        });

        if (upline) {
          upline_referral = upline.my_referral_code;
        }

        await has_potential.update(
          {
            join_date: new Date(),
          },
          { transaction }
        );
      }

      let customerData = {
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

      const cT = await Customer.create(customerData, { transaction });
      customer_id = cT.id;

      const imagePath = await uploadImageKtpNpwp(cD, customer_id);

      const refcode = "RF" + customer_id;
      await Customer.update(
        {
          refcode: refcode,
          npwp_img: imagePath.img_n,
          ktp_img: imagePath.img_k,
        },
        {
          where: { id: customer_id },
          transaction,
        }
      );
    }

    // Order counting and unique code generation
    const cekjumlahdata = await Order.count({ transaction });
    const cekincrement = await Order.findOne({
      order: [["created_at", "DESC"]],
      transaction,
    });

    let un, total;
    if (cekjumlahdata < 1) {
      un = 101;
      total = obj.total + un;
    } else if (cekincrement.unique_code % 999 === 0) {
      un = 101;
      total = obj.total + un;
    } else {
      un = parseInt(cekincrement.unique_code) + 1;
      total = obj.total + un;
    }

    // Order number generation
    const maxOrder = await Order.max("id", { transaction });
    const order_number_base = (maxOrder || 0) + 1;
    const now = new Date();
    const dt =
      now.getFullYear().toString().slice(-2) +
      (now.getMonth() + 1).toString().padStart(2, "0") +
      now.getDate().toString().padStart(2, "0");

    const todayOrderCount =
      (await Order.count({
        where: sequelize.where(
          sequelize.fn("DATE", sequelize.col("created_at")),
          sequelize.fn("CURDATE")
        ),
        transaction,
      })) + 1;

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
    let va_data = (await createVaXendit(obj, order_number, total)) || {};

    // Prepare order data
    const orderData = {
      ...obj,
      verify: 0,
      payment_revision: "",
      // TODO: UNUSED
      payment_notes: "",
      invoice_receipt: "",
      moota_stat: "",
      // TODO: UNUSED
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
    const customer = await Customer.findByPk(customer_id, { transaction });
    const owner = await Users.findOne({
      include: [
        {
          model: RoleUser,
          as: "roleUserData",
        },
      ],
      where: { id: req.user.userId }, // Assuming you have auth middleware
      transaction,
    });

    const roleAdminTele = owner.roleUserData.some((ru) => ru.role_id === 42);
    orderData.owner = roleAdminTele
      ? customer.owner || req.user.userId
      : req.user.userId;
    orderData.owner = orderData.owner || 271;

    try {
      const order = await Order.create(orderData, { transaction });
      await createOrderCustomerJob(order, cD, transaction);
      await createOrderItemsJob(order, obj, req.user.userId, transaction);
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    // Dispatch PDF job
    // const pdfLoc = `/pdf/${order.order_number}.pdf`;
    // await createPdfJob({ order, pdfLoc });

    // Update stock
    for (const cart of obj.cart) {
      const p = await MetaValues.findOne({
        where: { product_id: cart.product_id },
      });

      if (p) {
        const stocks = ["online_stock", "offline_stock", "reseller_stock"];
        for (const stock of stocks) {
          if (p[stock] > 0) {
            p[stock] = Math.max(0, p[stock] - cart.qty);
            await p.save();
            break;
          }
        }
      }
    }

    return res.json({
      success: true,
      message: "Successfully create new order",
    });
  } catch (error) {
    await Logs.create({
      name: `create order error ${customer_name}`,
      data: error.toString(),
    });

    if (!transaction.finished) {
      await transaction.rollback();
    }

    next(error);
  }
};

exports.unratedOrders = async (req, res, next) => {
  try {
    const retentionRolesId = [82, 14, 33, 13, 42];
    const acquisitionRolesId = [3, 35, 80, 28];
    const excludeIds = [1, 28]; // admin, op manager

    const retention = [...new Set(await getUserByRole(retentionRolesId))];
    const acquisition = [...new Set(await getUserByRole(acquisitionRolesId))];
    const exclude = [...new Set(await getUserByRole(excludeIds))];

    const userId = req.user.userId;
    const start = "2025-05-01";
    const end = moment().format("YYYY-MM-DD");

    const whereConditions = {
      flower_rating: null,
      rating_location_image: { [Op.ne]: null },
      created_at: {
        [Op.between]: [`${start} 00:00:00`, `${end} 23:59:59`],
      },
    };

    // Apply division/owner filters
    if (!exclude.includes(userId)) {
      whereConditions["$purchaseOrderData.orderData.owner$"] = userId;
    }
    if (req.query.division === "acquisition") {
      whereConditions["$purchaseOrderData.orderData.owner$"] = {
        [Op.in]: acquisition,
      };
    } else if (req.query.division === "retention") {
      whereConditions["$purchaseOrderData.orderData.owner$"] = {
        [Op.in]: retention,
      };
    }

    // Main query WITHOUT joining ownerData (to avoid duplicates)
    const ratings = await PurchaseOrderRating.findAll({
      where: whereConditions,
      include: [
        {
          model: PurchaseOrder,
          as: "purchaseOrderData",
          where: { status: "shipped" },
          attributes: ["id", "order_id", "customer_id"],
          include: [
            {
              model: Order,
              as: "orderData",
              attributes: ["id", "order_number", "owner"], // just owner id
            },
            {
              model: Customer,
              as: "customerData",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      order: [["created_at", "ASC"]],
      subQuery: false,
      distinct: true,
    });

    // Resolve sales_name separately to avoid duplication
    const result = await Promise.all(
      ratings.map(async (r) => {
        const ownerId = r.purchaseOrderData?.orderData?.owner;
        const owner = ownerId
          ? await Users.findByPk(ownerId, { attributes: ["id", "name"] })
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

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.approveOrder = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const id = req.body.order_id;
    const userName = req.user?.userName || "system";
    const order = await Order.findByPk(id, { transaction: t });

    if (!order) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    order.status = "approved";
    await order.save({ transaction: t });

    const orderItems = await OrderItems.findAll({
      where: { order_id: id },
      transaction: t,
    });

    for (const item of orderItems) {
      item.problem = 2;
      await item.save({ transaction: t });
    }

    const logeduser = req.user?.userId;
    const ownerUser = await Users.findByPk(logeduser);
    const owner = ownerUser?.name || "system";

    let logs = [];
    try {
      logs = JSON.parse(order.approve_logs);
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
    await order.save({ transaction: t });

    await Logs.create(
      {
        name: "approve order trigger",
        data: `order id = ${id}, by user = ${userName}`,
      },
      { transaction: t }
    );

    await t.commit();
    return res.json({
      success: true,
      mesage: "Successfully approved the current order",
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Reactive Order
 */
exports.reactiveOrder = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const id = req.body.order_id;
    const userName = req.user?.userName || "system";
    const order = await Order.findByPk(id, { transaction: t });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ success: false, msg: "Order not found" });
    }

    order.status = "unapproved";
    order.auto_cancel_time = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h
    await order.save({ transaction: t });

    // check latest payment
    const orderPayment = await OrderPayments.findOne({
      where: { order_id: id },
      order: [["id", "DESC"]],
      transaction: t,
    });

    if (orderPayment && orderPayment.approved === "1") {
      order.payment_status = "paid";
      await order.save({ transaction: t });
    }

    let updateStock = true; // simplified, same as your PHP
    if (updateStock) {
      const orderItems = await OrderItems.findAll({
        where: { order_id: id, shipping_method: { [Op.ne]: null } },
        include: ["productsData"],
        transaction: t,
      });

      // let hasOutOfStock = false;
      for (const item of orderItems) {
        const stok = item.product.qty;
        if (stok >= item.qty || item.product.is_pre_order) {
          const product = await Products.findByPk(item.product_id, {
            transaction: t,
          });
          product.qty = product.qty - item.qty;
          await product.save({ transaction: t });

          await ProductStock.create(
            {
              product_id: product.id,
              qty: item.qty,
              type: "minus",
              category: 0,
              user_id: req.user?.userId || 1,
              remarks: `reactive order = ${item.order_id}`,
            },
            { transaction: t }
          );
        } else {
          await t.rollback();
          return res.json({ success: false, message: "Stock Unavailable" });
        }
      }
    }

    // log
    const logeduser = req.user?.userId;
    const ownerUser = await Users.findByPk(logeduser);
    const owner = ownerUser?.name || "system";

    let logs = [];
    try {
      logs = JSON.parse(order.approve_logs);
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
    await order.save({ transaction: t });

    await Logs.create(
      {
        name: "reactiver order trigger",
        data: `order id = ${id}, by user = ${userName}`,
      },
      { transaction: t }
    );

    await t.commit();
    return res.json({
      success: true,
      message: "Successfully reactivated the current order",
    });
  } catch (error) {
    await Logs.create({
      name: "reactiver order error",
      data: error.message,
    });
    next(error);
  }
};

exports.submitProblem = async (req, res, next) => {
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

    let va_account_number = "";
    let va_external_id = "";
    let va_id = "";

    // prepare status log
    const dt = new Date().toISOString().slice(0, 19).replace("T", " ");
    const po_status_log = JSON.stringify([
      {
        status: "created",
        date: dt,
        user: req.user?.userName || "system",
      },
    ]);

    // check if customer bank exists
    const customerBank = await CustomerBanks.findOne({
      where: { account_number, account_holder },
    });
    if (!customerBank) {
      await CustomerBanks.create({
        account_number,
        account_holder,
        bank_name,
        customer_id,
      });
    }

    // create VA via Xendit if needed
    if (payment_method_problem === "va" && Number(amount_customer_kredit) > 0) {
      try {
        const createVaEndpoint = `${process.env.XENDIT_BASE_URL}/callback_virtual_accounts`;
        const vaName =
          va_bank === "BSI"
            ? "Prestisa Order Problem"
            : "Prestisa Order Problem";

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
      } catch (e) {
        let responseBody = null;
        if (e.response) {
          responseBody = e.response.data;
          await Logs.create({
            name: "Error Create Virtual Account Xendit",
            data: JSON.stringify(responseBody),
          });

          return res.status(400).json({
            success: false,
            message: "Failed when creating Virtual Account",
            debug: e.message,
            errors: responseBody,
          });
        } else {
          await Logs.create({
            name: "Error Create Virtual Account Xendit",
            data: e.message,
          });

          return res.status(500).json({
            success: false,
            message: "Something wrong when creating Virtual Account",
            debug: e.message,
          });
        }
      }
    }

    // create OrderProblem
    await OrderProblems.create({
      order_id,
      notes: reason,
      status_log: po_status_log,
      order_number,
      payment_method,
      account_number,
      account_holder,
      owner: req.user.userId || null,
      amount_customer_debit: amount_customer_debit || 0,
      amount_customer_kredit: amount_customer_kredit || 0,
      item_references,
      refund_reason,
      complaint_category,
      payment_method_problem,
      va_bank,
      bank_name,
      va_account_number,
      va_external_id,
      va_id,
      payment_status: "",
    });

    // log to bank
    await Logs.create({
      name: "bank_data_update",
      data: JSON.stringify({
        user: req.user.userId,
        action: "create",
        new: {
          order_number,
          payment_method,
          account_number,
          account_holder,
        },
        old: "",
      }),
    });

    return res.status(201).json({
      success: true,
      message: "Successfully created order problem",
    });
  } catch (error) {
    next(error);
  }
};

exports.submitFaktur = async (req, res, next) => {
  const t = await Order.sequelize.transaction();

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

    // find order
    const order = await Order.findOne({
      where: { order_number },
      transaction: t,
    });

    if (!order) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const customer_id = `${order.customer_id}_${Date.now()}`;
    let img_n = "";

    if (npwp_img && npwp_img.path) {
      // Case: image is uploaded
      if (!npwp_img.path) {
        if (npwp_img_name === "pdf") {
          const fileName =
            process.env.NODE_ENV === "production"
              ? `npwp_${customer_id}.pdf`
              : `staging_npwp_${customer_id}.pdf`;

          const localPath = path.join(
            process.cwd(),
            "storage",
            "app",
            "images",
            "faktur",
            fileName
          );

          // ensure dir exists
          fs.mkdirSync(path.dirname(localPath), { recursive: true });

          // save PDF (base64 decode)
          const data = npwp_img.src.replace("data:application/pdf;base64,", "");
          fs.writeFileSync(localPath, Buffer.from(data, "base64"));

          // remote path (for API access)
          img_n = `/api/images/faktur/${fileName}`;

          // optional FTP upload
          await sendToLavenderFtp(
            localPath,
            `/assets/images/faktur/${fileName}`
          );
        } else {
          const fileName =
            process.env.NODE_ENV === "production"
              ? `npwp_${customer_id}.png`
              : `staging_npwp_${customer_id}.png`;

          const localPath = path.join(
            process.cwd(),
            "storage",
            "app",
            "images",
            "faktur",
            fileName
          );

          fs.mkdirSync(path.dirname(localPath), { recursive: true });

          // save image (base64 decode)
          const data = npwp_img.src.replace(/^data:image\/\w+;base64,/, "");
          fs.writeFileSync(localPath, Buffer.from(data, "base64"));

          img_n = `/api/images/faktur/${fileName}`;

          // optional FTP upload
          await sendToLavenderFtp(
            localPath,
            `/assets/images/faktur/${fileName}`
          );
        }
      } else {
        // Case: image already exists on path
        if (npwp_img_name === "pdf") {
          img_n =
            process.env.NODE_ENV === "production"
              ? `/api/images/faktur/npwp_${customer_id}.pdf`
              : `/api/images/faktur/staging_npwp_${customer_id}.pdf`;
        } else {
          img_n =
            process.env.NODE_ENV === "production"
              ? `/api/images/faktur/npwp_${customer_id}.png`
              : `/api/images/faktur/staging_npwp_${customer_id}.png`;
        }
      }
    }

    // create tax invoice
    await TaxInvoices.create(
      {
        request_date: new Date(),
        order_number: order.order_number,
        npwp_number: nomor,
        npwp_name: nama,
        npwp_address: alamat,
        physical_document_delivery: kirim_customer,
        physical_document_address: invoice_address,
        npwp_file: img_n,
      },
      { transaction: t }
    );

    await t.commit();
    return res.json({
      success: true,
      message: "Successfully saved request faktur",
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.addInvoiceUpdate = async (req, res, next) => {
  const { approval_type, name, email, phone, customer_id, order_id, notes } =
    req.body;

  try {
    await ApprovalInvoiceUpdate.create({
      user_id: req.user.userId,
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

exports.lock = async (req, res, next) => {
  const t = await sequelize.transaction();
  const orderNumber = req.body.order_number; // adjust as needed

  try {
    const user = req.user; // assuming Auth middleware sets req.user
    const now = nowDbDateTime();

    // Reload order
    const order = await Order.findOne({
      where: { order_number: orderNumber },
      transaction: t,
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Update verify flag
    await Order.update(
      { verify: 1 },
      { where: { order_number: orderNumber }, transaction: t }
    );

    // --- Approve logs update ---
    let approveLogs = [];
    try {
      approveLogs = JSON.parse(order.approve_logs) || [];
    } catch {
      approveLogs = [];
    }

    approveLogs.push({
      status: "Verified",
      notes: `Order Verify, Verified by ${user.userName}`,
      date: moment().format("YYYY-MM-DD HH:mm:ss"),
      user: user.userName,
    });

    await Order.update(
      { approve_logs: JSON.stringify(approveLogs) },
      { where: { order_number: orderNumber }, transaction: t }
    );

    // --- Save general log ---
    await Logs.create(
      {
        name: "order verify",
        data: JSON.stringify({
          order_number: orderNumber,
          verify: "1",
          user_id: user.userId,
          user_name: user.userName,
        }),
      },
      { transaction: t }
    );

    // --- Extra piutang logic ---
    if (order.payment_type === "piutang") {
      let verifyLogs = [];

      try {
        verifyLogs = JSON.parse(order.approve_logs) || [];
      } catch {
        verifyLogs = [];
      }

      verifyLogs.push({
        date: moment().format("YYYY-MM-DD HH:mm:ss"),
        notes: "lock order or verify",
        owner: user.userId,
      });

      order.approve_logs = JSON.stringify(verifyLogs);
      await order.save({ transaction: t });

      // Auto approve piutang if within credit limit & no overdue
      const customer = await Customer.findOne({
        where: { id: order.customer_id },
        attributes: ["id", "name", "email", "phone"],
        include: ["customerArData"], // assuming relation name is 'customerArData'
        transaction: t,
      });

      if (customer && customer.customerArData) {
        const creditLimit = customer.customerArData.credit_limit;
        const ordersOverDue = await Order.count({
          where: {
            customer_id: order.customer_id,
            // payment_duedate: { [Op.lte]: new Date() },
            payment_type: "piutang",
            payment_status: "unpaid",
            status: { [Op.ne]: "cancelled" },
            [Op.and]: [literal(`${Order.name}.payment_duedate <= '${now}'`)],
          },
          transaction: t,
        });

        if (ordersOverDue === 0 && order.total <= creditLimit) {
          let logs = [];

          try {
            logs = JSON.parse(order.approve_logs) || [];
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
          await order.save({ transaction: t });

          // Auto document creation
          await autoCreateDocumentInvoice(order);
          await autoCreateFakturPajak(order.customer_id, order.order_number);
        }
      }
    }

    await t.commit();

    // Broadcast
    // BroadcastNotification(
    //   ["order-management"],
    //   `Request Verify an Order : #${orderNumber}`
    // );
    // BroadcastNotification(
    //   ["purchase-request-management"],
    //   `There is new Purchase Request from Order #${orderNumber}`
    // );

    return res.json({
      success: true,
      message: "Successfully requested order to verify",
    });
  } catch (error) {
    await t.rollback();
    await Logs.create({
      name: "order verify failed",
      data: JSON.stringify({
        order_number: orderNumber,
        msg: error.message,
        user_id: req.user?.userId,
        user_name: req.user?.userName,
      }),
    });

    next(error);
  }
};

exports.updateVip = async (req, res, next) => {
  const { order_id, vip } = req.body;

  try {
    const order = await Order.findOne({ where: { id: order_id } });
    let savedOrder;

    if (order) {
      // Update
      await order.update({ vip: vip });
      savedOrder = await order.reload(); // like fresh()
    } else {
      // Create
      savedOrder = await Order.create({ id: obj.id, vip: obj.vip });
    }

    return res.json({
      success: true,
      message: "Successfully change VIP status",
    });
  } catch (error) {
    next(error);
  }
};

exports.detailUnmasked = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cT = await Order.findOne({
      where: { order_number: id },
      include: [
        { association: "orderItemsData" },
        { association: "orderCustomerData" },
        {
          association: "customerData",
          // attributes: ["id", "name", "email", "phone"],
        },
        { association: "purchaseOrderData" },
        {
          association: "orderPaymentsData",
          include: [{ association: "usersData" }, { association: "bankData" }],
        },
        { association: "websiteData" },
      ],
    });

    if (!cT) {
      return res.json({ success: false, message: "Order not found" });
    }

    // last 3 orders for the same customer
    const last3 = await Order.findAll({
      where: { customer_id: cT.customer_id },
      include: [
        {
          association: "orderItemsData",
          include: ["geoProvinceData", "geoCityData", "geoCountryData"],
        },
        {
          association: "customerData",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          association: "orderPaymentsData",
          include: [{ association: "usersData" }, { association: "bankData" }],
        },
        { association: "websiteData" },
      ],
      order: [["created_at", "DESC"]],
      limit: 3,
    });

    const lastOrders = last3.map((order) => {
      const totalPaid = order.orderPaymentsData.reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      );
      const paymentLeft = order.total - totalPaid;

      return {
        id: order.id,
        order_number: order.order_number,
        total: order.total,
        payment_status: order.payment_status,
        status: order.status,
        payment_left: paymentLeft,
        owner_name: order.owner ? order.owner : null,
        created_at: dayjs(order.created_at).format("YYYY-MM-DD HH:mm:ss"),
      };
    });

    return res.json({
      success: true,
      data: {
        order: cT,
        last_order: lastOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DANGER ! dont remove the comments
exports.detail = async (req, res, next) => {
  try {
    const id = req.params.id;

    let cT = await Order.findOne({
      include: [
        // { association: "purchaseOrderData" },
        {
          association: "orderItemsData",
          attributes: { exclude: [] },
          include: [
            "productsData",
            "geoProvinceData",
            "geoCityData",
            "geoCountryData",
            // "purchaseOrderData",
          ],
        },
        {
          association: "orderCustomerData",
        },
        {
          association: "orderPaymentsData",
          include: ["usersData", "bankData"],
        },
        { association: "websiteData" },
        { association: "ownerData" },
        { association: "orderProblemsData" },
        {
          association: "customerData",
          include: ["customerBanksData"],
        },
      ],
      where: { order_number: id },
    });

    if (!cT) {
      return res.json({ success: false, message: "order not found" });
    }

    // // === problem check ===
    let status = cT.orderProblemsData?.length >= cT.orderItemsData?.length;

    // === role check ===
    const roleuser = await RoleUser.findOne({
      where: { user_id: cT.owner },
      attributes: ["role_id"],
    });

    let stat = 0;
    if (roleuser?.role_id === 14) stat = 0;
    else if (roleuser?.role_id === 1) stat = 0;
    else stat = 0;

    // // === check cart problems ===
    let default_order_problem = cT.orderItemsData?.some((c) => c?.problem > 0)
      ? 1
      : 0;
    cT.setDataValue("problem", default_order_problem);

    // === sales user check ===
    const salesUser = await getSettings("general-settings", "sales_users");
    const issales = salesUser.includes(cT.owner);

    // // === order customer ===
    // // const orderCustomer = await OrderCustomer.findOne({
    // //   where: { order_id: cT.id },
    // // });

    // const orderIds = await Order.findAll({
    //   where: { customer_id: cT.customer_id },
    //   attributes: ["id"],
    // }).then((rows) => rows.map((r) => r.id));

    // let order_customer_list = await OrderCustomer.findAll({
    //   where: {
    //     order_id: { [Op.in]: orderIds },
    //     npwp_number: { [Op.ne]: null },
    //   },
    //   attributes: ["npwp_number", "npwp_name", "npwp_address", "npwp_file"],
    // });

    // order_customer_list = order_customer_list?.length
    //   ? [
    //       ...new Map(
    //         order_customer_list.map((item) => [item.npwp_number, item])
    //       ).values(),
    //     ]
    //   : [];

    // === problems payment join ===
    const problems_payment = await OrderProblems.findAll({
      include: [
        {
          model: OrderProblemsPayments,
          as: "orderProblemsPaymentsData",
          include: [{ model: OrderProblems, as: "orderProblemsData" }],
          // where: { order_id: sequelize.col("order_problems.order_id") },
          required: true,
          attributes: ["receipt", "amount"],
        },
      ],
      where: { order_number: id },
      attributes: ["payment_status"],
    });
    cT.setDataValue("problems_payment", problems_payment);

    // === pr_problems ===
    const pr_problems = await PrProblems.findAll({
      include: {
        model: Users,
        as: "ownerData",
        // where: { order_id: db.sequelize.col("order_problems.order_id") },
        // required: true,
        // attributes: ["receipt", "amount"],
      },
      where: { order_id: cT.id },
      order: [["id", "desc"]],
    });

    // === check user roles (ae) ===
    // const authRoles = ["account-executive"];
    // const userRole = await Roles.findByPk(req.user.roleId); // assuming req.user is injected and roleId exists
    // const userRoleSlug = userRole?.slug || null;

    // const is_ae = authRoles.includes(userRoleSlug);

    // === faktur ===
    // const faktur = await TaxInvoices.findAll({
    //   where: { order_number: cT.order_number },
    // });

    // === purchase order faktur expiration ===
    // const po = cT.purchaseOrderData[0] || null;
    // let expirationDate = 0;
    // let po_faktur_expired = false;
    // if (po?.shipped_date) {
    //   expirationDate = moment(po.shipped_date)
    //     .add(1, "month")
    //     .startOf("month")
    //     .add(11, "days");
    //   po_faktur_expired = moment().isSameOrAfter(expirationDate);
    // }

    const plainOrder = cT.toJSON();

    const last3 = await Order.findAll({
      where: { customer_id: cT.customer_id },
      include: [
        {
          association: "orderItemsData",
          include: ["geoProvinceData", "geoCityData", "geoCountryData"],
        },
        {
          association: "customerData",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          association: "orderPaymentsData",
          include: [{ association: "usersData" }, { association: "bankData" }],
        },
        { association: "websiteData" },
      ],
      order: [["created_at", "DESC"]],
      limit: 3,
    });

    // manually find po
    const purchaseOrders = await PurchaseOrder.findAll({
      where: { order_id: cT.id },
    });

    return res.json({
      success: true,
      data: {
        problem: status,
        order: {
          ...plainOrder,
          purchaseOrderData: purchaseOrders,
          orderCustomerData: {
            ...plainOrder.orderCustomerData,
            email: obscureData(plainOrder.orderCustomerData.email, "email"),
            phone: obscureData(plainOrder.orderCustomerData.phone, "phone"),
            company_email: obscureData(
              plainOrder.orderCustomerData.company_email,
              "email"
            ),
            company_phone: obscureData(
              plainOrder.orderCustomerData.company_phone,
              "phone"
            ),
          },
          customerData: {
            ...plainOrder.customerData,
            email: obscureData(plainOrder.customerData.email, "email"),
            phone: obscureData(plainOrder.customerData.phone, "phone"),
          },
        },
        role: roleuser?.role_id,
        ae: stat,
        // list_data_faktur: order_customer_list,
        pr: cT.orderItemsData,
        issales,
        pr_problems,
        // is_ae,
        // faktur,
        // po_faktur_expired,
        // expiration_date: expirationDate,
        last_order: last3,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.widgetStateOrder = async (req, res, next) => {
  try {
    const type = req?.query?.type;
    const betweenToday = todayDbRange();
    const date_from = betweenToday[0];
    const date_to = betweenToday[1];
    const now = nowDbDateTime();

    const baseOrderInclude = [
      { model: Users, as: "ownerData", attributes: ["id", "name"] },
      {
        model: Customer,
        as: "customerData",
        attributes: ["id", "name", "email", "phone"],
      },
      {
        model: OrderItems,
        as: "orderItemsData",
        attributes: ["id", "order_id", "date_time", "name", "product_code"],
      },
      {
        model: OrderPayments,
        as: "orderPaymentsData",
        attributes: [
          "id",
          "order_id",
          "transaction_date",
          "approved",
          "amount",
          "payment_method",
          "status",
          "notes",
          "receipt",
        ],
        include: [
          {
            model: Banks,
            as: "bankData",
            attributes: ["id", "name", "description", "hook_account_id"],
          },
        ],
      },
    ];

    // Base order where = today's orders and not cancelled
    const baseOrderWhere = [
      literal(
        `DATE(${Order.name}.created_at) BETWEEN '${date_from}' AND '${date_to}'`
      ),
      { status: { [Op.ne]: "cancelled" } },
    ];

    // Lazy full-data queries (only executed when requested)
    const queries = {
      // Waiting payments: today's orders that have no payments
      waiting_payment: async () =>
        Order.findAll({
          include: [
            ...baseOrderInclude,
            {
              model: OrderPayments,
              as: "orderPaymentsData",
              required: false,
            },
          ],
          where: {
            payment_type: "cash",
            [Op.and]: [
              ...baseOrderWhere,
              literal("`orderPaymentsData`.`id` IS NULL"),
              literal(
                `DATE_ADD(${Order.name}.created_at, INTERVAL 30 MINUTE) < '${now}'`
              ),
            ],
          },
        }),

      payment_approval: async () =>
        Order.findAll({
          include: [
            {
              ...baseOrderInclude,
              model: OrderPayments,
              as: "orderPaymentsData",
              required: true,
              include: [
                {
                  model: Banks,
                  as: "bankData",
                  attributes: ["id", "name", "description", "hook_account_id"],
                },
              ],
              where: {
                approved: 0,
              },
            },
          ],
          where: {
            payment_type: "cash",
            [Op.and]: [
              ...baseOrderWhere,
              literal(
                `DATE_ADD(${Order.name}.created_at, INTERVAL 34 MINUTE) < '${now}'`
              ),
            ],
          },
        }),

      order_approval_cash: async () =>
        Order.findAll({
          include: baseOrderInclude,
          where: {
            payment_type: "cash",
            payment_status: "paid",
            status: "unapproved",
            [Op.and]: [
              ...baseOrderWhere,
              literal(
                `DATE_ADD(${Order.name}.created_at, INTERVAL 35 MINUTE) < '${now}'` // make sure alias matches
              ),
            ],
          },
        }),

      order_approval_piutang: async () =>
        Order.findAll({
          include: baseOrderInclude,
          where: {
            payment_type: "piutang",
            verify: 1,
            status: "unapproved",
            [Op.and]: [
              ...baseOrderWhere,
              literal(
                `DATE_ADD(${Order.name}.created_at, INTERVAL 35 MINUTE) < '${now}'` // make sure alias matches
              ),
            ],
          },
        }),

      purchase_request: async () =>
        OrderItems.findAll({
          include: [
            {
              model: Order,
              as: "orderData",
              required: true,
              where: {
                status: "approved",
                [Op.and]: [
                  literal(
                    `DATE(orderData.created_at) BETWEEN '${date_from}' AND '${date_to}'`
                  ),
                  literal(
                    `DATE_ADD(orderData.created_at, INTERVAL 65 MINUTE) < '${now}'`
                  ),
                ],
              },
              include: [
                {
                  model: Customer,
                  as: "customerData",
                  attributes: ["id", "name", "email", "phone"],
                },
              ],
            },
          ],
          where: {
            assignment: null,
            bought: { [Op.lt]: literal("qty") },
          },
        }),

      production_normal: async () =>
        Order.findAll({
          include: [
            ...baseOrderInclude,
            {
              model: PurchaseOrder,
              as: "purchaseOrderData",
              required: true,
              where: {
                status: { [Op.in]: ["on progress", "pending"] },
                date_time: { [Op.between]: betweenToday }, // your PO uses date_time for day check in Laravel
                [Op.or]: [
                  { real_image: { [Op.is]: null } },
                  { real_image: "" },
                ],
              },
              include: [
                {
                  model: Supplier,
                  as: "supplierData",
                  attributes: ["id", "name", "phone"],
                },
              ],
            },
            {
              model: OrderItems,
              as: "orderItemsData",
              required: true,
              where: {
                [Op.and]: literal(
                  `DATE_SUB(date_time, INTERVAL 180 MINUTE) < '${now}'`
                ),
              },
            },
          ],
          where: {
            [Op.and]: [...baseOrderWhere],
          },
        }),

      // production_subdomain must also honor created_at between today
      production_subdomain: async () =>
        OrderSelection.findAll({
          include: [
            {
              model: OrderItems,
              as: "orderItemsData",
              include: [
                {
                  model: Order,
                  as: "orderData",
                  required: true,
                  attributes: [
                    "id",
                    "created_at",
                    "order_number",
                    "status",
                    "payment_status",
                    "payment_type",
                    "verify",
                    "owner",
                    "total",
                    "payment_duedate",
                  ],
                  include: [
                    {
                      model: Customer,
                      as: "customerData",
                      required: true,
                      attributes: ["id", "name", "email", "phone"],
                    },
                    {
                      model: PurchaseOrder,
                      as: "purchaseOrderData",
                      required: true,
                      attributes: [
                        "id",
                        "order_id",
                        "supplier_id",
                        "product_name",
                        "owner",
                      ],
                      include: [
                        {
                          model: Supplier,
                          as: "supplierData",
                          required: true,
                          attributes: ["id", "name", "email", "phone"],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
          where: {
            status: "ready",
            [Op.and]: [
              literal(
                `DATE(${OrderSelection.name}.created_at) BETWEEN '${date_from}' AND '${date_to}'`
              ),
              { confirm_time: { [Op.ne]: null } },
              literal(`DATE_SUB(confirm_time, INTERVAL 180 MINUTE) < '${now}'`),
            ],
          },
        }),

      real_image: async () =>
        Order.findAll({
          include: [
            ...baseOrderInclude,
            {
              model: PurchaseOrder,
              as: "purchaseOrderData",
              include: [
                {
                  model: Supplier,
                  as: "supplierData",
                  attributes: ["id", "name", "phone"],
                },
              ],
              required: true,
              where: {
                status: {
                  [Op.and]: [
                    { [Op.eq]: "on progress" },
                    { [Op.ne]: "cancelled" },
                  ],
                },
                date_time: { [Op.between]: betweenToday },
                [Op.or]: [
                  { real_image: { [Op.is]: null } },
                  { real_image: "" },
                ],
              },
            },
            {
              model: OrderItems,
              as: "orderItemsData",
              attributes: [
                "id",
                "order_id",
                "date_time",
                "name",
                "product_code",
              ],
              where: {
                [Op.and]: literal(
                  `DATE_SUB(date_time, INTERVAL 60 MINUTE) < '${now}'`
                ),
              },
            },
          ],
          where: {
            [Op.and]: [...baseOrderWhere],
          },
        }),

      delivery_location: async () =>
        Order.findAll({
          include: [
            ...baseOrderInclude,
            {
              model: PurchaseOrder,
              as: "purchaseOrderData",
              include: [
                {
                  model: Supplier,
                  as: "supplierData",
                  attributes: ["id", "name", "phone"],
                },
              ],
              required: true,
              where: {
                status: "on shipping",
                date_time: { [Op.between]: betweenToday },
                [Op.or]: [
                  { real_image: { [Op.not]: null } },
                  { real_image: { [Op.ne]: "" } },
                ],
              },
            },
            {
              model: OrderItems,
              as: "orderItemsData",
              attributes: [
                "id",
                "order_id",
                "date_time",
                "name",
                "product_code",
              ],
              where: {
                [Op.and]: [
                  literal(
                    `DATE(orderItemsData.created_at) BETWEEN '${date_from}' AND '${date_to}'`
                  ),
                  literal(
                    `DATE_ADD(orderItemsData.date_time, INTERVAL 1 MINUTE) < '${now}'`
                  ),
                ],
              },
            },
          ],
          where: {
            [Op.and]: [...baseOrderWhere],
          },
        }),
    };

    // Count queries: light-weight, use model.count() and same time filters
    const countQueries = {
      waiting_payment: () =>
        Order.count({
          distinct: true,
          include: [
            ...baseOrderInclude,
            {
              model: OrderPayments,
              as: "orderPaymentsData",
              required: false,
            },
          ],
          where: {
            payment_type: "cash",
            [Op.and]: [
              ...baseOrderWhere,
              literal("`orderPaymentsData`.`id` IS NULL"),
              literal(
                `DATE_ADD(${Order.name}.created_at, INTERVAL 30 MINUTE) < '${now}'`
              ),
            ],
          },
        }),

      payment_approval: () =>
        Order.count({
          distinct: true,
          include: [
            {
              ...baseOrderInclude,
              model: OrderPayments,
              as: "orderPaymentsData",
              required: true,
              include: [
                {
                  model: Banks,
                  as: "bankData",
                  attributes: ["id", "name", "description", "hook_account_id"],
                },
              ],
              where: {
                approved: 0,
              },
            },
          ],
          where: {
            payment_type: "cash",
            [Op.and]: [
              ...baseOrderWhere,
              literal(
                `DATE_ADD(${Order.name}.created_at, INTERVAL 34 MINUTE) < '${now}'`
              ),
            ],
          },
        }),

      order_approval_cash: () =>
        Order.count({
          distinct: true,
          include: baseOrderInclude,
          where: {
            payment_type: "cash",
            payment_status: "paid",
            status: "unapproved",
            [Op.and]: [
              ...baseOrderWhere,
              literal(
                `DATE_ADD(${Order.name}.created_at, INTERVAL 35 MINUTE) < '${now}'` // make sure alias matches
              ),
            ],
          },
        }),

      order_approval_piutang: () =>
        Order.count({
          distinct: true,
          include: baseOrderInclude,
          where: {
            payment_type: "piutang",
            verify: 1,
            status: "unapproved",
            [Op.and]: [
              ...baseOrderWhere,
              literal(
                `DATE_ADD(${Order.name}.created_at, INTERVAL 35 MINUTE) < '${now}'` // make sure alias matches
              ),
            ],
          },
        }),

      purchase_request: () =>
        OrderItems.count({
          distinct: true,
          include: [
            {
              model: Order,
              as: "orderData",
              required: true,
              where: {
                status: "approved",
                [Op.and]: [
                  literal(
                    `DATE(orderData.created_at) BETWEEN '${date_from}' AND '${date_to}'`
                  ),
                  literal(
                    `DATE_ADD(orderData.created_at, INTERVAL 65 MINUTE) < '${now}'`
                  ),
                ],
              },
              include: [
                {
                  model: Customer,
                  as: "customerData",
                  attributes: ["id", "name", "email", "phone"],
                },
              ],
            },
          ],
          where: {
            assignment: null,
            bought: { [Op.lt]: literal("qty") },
          },
        }),

      production_normal: () =>
        Order.count({
          distinct: true,
          include: [
            ...baseOrderInclude,
            {
              model: PurchaseOrder,
              as: "purchaseOrderData",
              required: true,
              where: {
                status: { [Op.in]: ["on progress", "pending"] },
                date_time: { [Op.between]: betweenToday }, // your PO uses date_time for day check in Laravel
                [Op.or]: [
                  { real_image: { [Op.is]: null } },
                  { real_image: "" },
                ],
              },
              include: [
                {
                  model: Supplier,
                  as: "supplierData",
                  attributes: ["id", "name", "phone"],
                },
              ],
            },
            {
              model: OrderItems,
              as: "orderItemsData",
              required: true,
              where: {
                [Op.and]: literal(
                  `DATE_SUB(date_time, INTERVAL 180 MINUTE) < '${now}'`
                ),
              },
            },
          ],
          where: {
            [Op.and]: [...baseOrderWhere],
          },
        }),

      production_subdomain: () =>
        OrderSelection.count({
          distinct: true,
          include: [
            {
              model: OrderItems,
              as: "orderItemsData",
              include: [
                {
                  model: Order,
                  as: "orderData",
                  required: true,
                  attributes: [
                    "id",
                    "created_at",
                    "order_number",
                    "status",
                    "payment_status",
                    "payment_type",
                    "verify",
                    "owner",
                    "total",
                    "payment_duedate",
                  ],
                  include: [
                    {
                      model: Customer,
                      as: "customerData",
                      required: true,
                      attributes: ["id", "name", "email", "phone"],
                    },
                    {
                      model: PurchaseOrder,
                      as: "purchaseOrderData",
                      required: true,
                      attributes: [
                        "id",
                        "order_id",
                        "supplier_id",
                        "product_name",
                        "owner",
                      ],
                      include: [
                        {
                          model: Supplier,
                          as: "supplierData",
                          required: true,
                          attributes: ["id", "name", "email", "phone"],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
          where: {
            status: "ready",
            [Op.and]: [
              literal(
                `DATE(${OrderSelection.name}.created_at) BETWEEN '${date_from}' AND '${date_to}'`
              ),
              { confirm_time: { [Op.ne]: null } },
              literal(`DATE_SUB(confirm_time, INTERVAL 180 MINUTE) < '${now}'`),
            ],
          },
        }),

      real_image: () =>
        Order.count({
          distinct: true,
          include: [
            ...baseOrderInclude,
            {
              model: PurchaseOrder,
              as: "purchaseOrderData",
              include: [
                {
                  model: Supplier,
                  as: "supplierData",
                  attributes: ["id", "name", "phone"],
                },
              ],
              required: true,
              where: {
                status: {
                  [Op.and]: [
                    { [Op.eq]: "on progress" },
                    { [Op.ne]: "cancelled" },
                  ],
                },
                date_time: { [Op.between]: betweenToday },
                [Op.or]: [
                  { real_image: { [Op.is]: null } },
                  { real_image: "" },
                ],
              },
            },
            {
              model: OrderItems,
              as: "orderItemsData",
              attributes: [
                "id",
                "order_id",
                "date_time",
                "name",
                "product_code",
              ],
              where: {
                [Op.and]: literal(
                  `DATE_SUB(date_time, INTERVAL 60 MINUTE) < '${now}'`
                ),
              },
            },
          ],
          where: {
            [Op.and]: [...baseOrderWhere],
          },
        }),

      delivery_location: () =>
        Order.count({
          distinct: true,
          include: [
            ...baseOrderInclude,
            {
              model: PurchaseOrder,
              as: "purchaseOrderData",
              include: [
                {
                  model: Supplier,
                  as: "supplierData",
                  attributes: ["id", "name", "phone"],
                },
              ],
              required: true,
              where: {
                status: "on shipping",
                date_time: { [Op.between]: betweenToday },
                [Op.or]: [
                  { real_image: { [Op.not]: null } },
                  { real_image: { [Op.ne]: "" } },
                ],
              },
            },
            {
              model: OrderItems,
              as: "orderItemsData",
              attributes: [
                "id",
                "order_id",
                "date_time",
                "name",
                "product_code",
              ],
              where: {
                [Op.and]: [
                  literal(
                    `DATE(orderItemsData.created_at) BETWEEN '${date_from}' AND '${date_to}'`
                  ),
                  literal(
                    `DATE_ADD(orderItemsData.date_time, INTERVAL 1 MINUTE) < '${now}'`
                  ),
                ],
              },
            },
          ],
          where: {
            [Op.and]: [...baseOrderWhere],
          },
        }),
    };

    // Execute either counts (fast) or requested full dataset(s)
    if (type === "count") {
      const results = await Promise.all(
        Object.entries(countQueries).map(([k, fn]) =>
          fn().then((count) => [k, count])
        )
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
    } else if (type && queries[type]) {
      const result = await queries[type]();
      data = typeof maskOrder === "function" ? maskOrder(result) : result;
    } else if (type === "production") {
      const result = await queries.production_normal();
      const result2 = await queries.production_subdomain();
      data =
        typeof maskOrder === "function"
          ? maskOrder([...result, ...result2])
          : [...result, ...result2];
    } else if (type === "order_approval") {
      const result = await queries.order_approval_cash();
      const result2 = await queries.order_approval_piutang();
      data =
        typeof maskOrder === "function"
          ? maskOrder([...result, ...result2])
          : [...result, ...result2];
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const {
      date_from = "",
      date_to = "",
      status = "",
      payment_status = "",
      user = "",
      search = "",
      page = 1,
      per_page = 10,
      sort_by = "created_at", // default sort field
      sort_dir = "ASC", // default sort direction
    } = req.query;

    const where = {};

    if (date_from && date_to) {
      where[Op.and] = [
        literal(
          `DATE(\`Order\`.\`created_at\`) BETWEEN '${date_from}' AND '${date_to}'`
        ),
      ];
    }

    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;

    // Flexible search across multiple fields
    if (search) {
      where[Op.or] = [
        { order_number: { [Op.like]: `%${search}%` } },
        { customer_id: { [Op.like]: `%${search}%` } },
        { "$customerData.name$": { [Op.like]: `%${search}%` } },
      ];
    }

    if (user) where.owner = parseInt(user);

    const userId = req.user.userId;
    const salesUser = await getSettings("general-settings", "sales_users");
    const issales = salesUser.includes(userId);

    if (issales) {
      where.owner = userId;
    }

    // Pagination
    const limit = parseInt(per_page);
    const offset = (parseInt(page) - 1) * limit;

    // Whitelist of allowed columns to prevent SQL injection
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

    let sortField = allowedSortFields.includes(sort_by)
      ? sort_by
      : "created_at";
    let sortDirection = sort_dir.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Handle nested includes sorting (e.g., customerData.name)
    let order = [];
    if (sortField.startsWith("customerData.")) {
      const field = sortField.split(".")[1];
      order.push([
        { model: Customer, as: "customerData" },
        field,
        sortDirection,
      ]);
    } else {
      order.push([sortField, sortDirection]);
    }

    const { rows: orders, count: total } = await Order.findAndCountAll({
      attributes: [
        "id",
        "created_at",
        "updated_at",
        "deleted_at",
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
      ],
      where,
      limit,
      offset,
      include: [
        {
          model: Customer,
          as: "customerData",
          attributes: ["name", "email", "phone"],
          required: !!search,
        },
        {
          model: OrderPayments,
          association: "orderPaymentsData",
          attributes: ["amount"],
        },
        {
          model: PrProblems,
          association: "prProblemsData",
          // attributes: ["amount"],
        },
      ],
      order,
      logging: console.log,
    });

    // Format response
    const data = orders.map((order) => {
      const plainOrder = order.toJSON();
      const totalPaid = plainOrder.orderPaymentsData.reduce(
        (sum, p) => sum + p.amount,
        0
      );
      const paymentLeft = plainOrder.total - totalPaid;

      return {
        ...plainOrder,
        customerData: {
          name: plainOrder.customerData?.name || "",
          email: obscureData(plainOrder.customerData?.email || "", "email"),
          phone: obscureData(plainOrder.customerData?.phone || ""),
        },
        payment_left: paymentLeft,
      };
    });

    res.json({
      success: true,
      data,
      meta: {
        total,
        page: parseInt(page),
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
