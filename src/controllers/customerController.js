const { Op } = require("sequelize");
const { Customer } = require("../models");
const OrderItems = require("../models/orderItems");
const Order = require("../models/order");
const { obscureData } = require("../utils/helpers");
const CustomerAr = require("../models/customerAr");

exports.detail = async (req, res, next) => {
  try {
    const customerId = req.params.id;

    // Fetch customer
    const customer = await Customer.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    // Fetch last 5 order items with special_request_logo
    const lastOrderItems = await OrderItems.findAll({
      where: {
        special_request_logo: {
          [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }],
        },
      },
      include: [
        {
          model: Order,
          as: "order",
          where: { customer_id: customerId },
        },
      ],
      order: [["id", "DESC"]],
      limit: 5,
    });

    res.json({
      success: true,
      data: {
        customer,
        last_order_items: lastOrderItems,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.search = async (req, res, next) => {
  const { keyword } = req.query;

  try {
    const normalized = keyword?.toString().trim();
    let whereClause = {};

    if (/^\d+$/.test(normalized)) {
      // numeric → search phone
      whereClause = {
        [Op.or]: { phone: normalized },
      };
    } else if (normalized?.includes("@")) {
      // email-like → fuzzy match
      whereClause = {
        email: `${normalized}`,
      };
    } else {
      // default fuzzy search
      whereClause = {
        [Op.or]: [
          { name: { [Op.like]: `%${normalized}%` } },
          { email: { [Op.like]: `%${normalized}%` } },
          { phone: { [Op.like]: `%${normalized}%` } },
        ],
      };
    }

    // Step 1: Fetch customers (limit to 50, raw: false)
    const customers = await Customer.findAll({
      where: whereClause,
      attributes: [
        "id",
        "name",
        "email",
        "phone",
        "gender",
        "cust_status",
        "status_log",
        "mou_status",
        "notes",
        "npwp",
        "nik",
        "ktp_img",
        "npwp_img",
        "address",
        "type",
        "company_type",
        "company_name",
        "company_address",
        "company_email",
        "company_phone",
        "is_member",
        "member_since",
        "my_referral_code",
        "no_finance",
        "no_finance_2",
      ],
      include: [
        {
          model: CustomerAr,
          as: "customerArData",
        },
      ],
      limit: 50,
      order: [["id", "DESC"]],
    });

    const customerIds = customers.map((c) => c.id);
    if (customerIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Step 2: Fetch all last order items in one query
    const orderItems = await OrderItems.findAll({
      where: {
        special_request_logo: {
          [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }],
        },
      },
      include: [
        {
          model: Order,
          as: "orderData",
          where: { customer_id: { [Op.in]: customerIds } },
          attributes: ["customer_id"],
        },
      ],
      order: [["id", "DESC"]],
      limit: 500,
    });

    // Step 3: Group order items by customer_id
    const groupedItems = {};
    for (const item of orderItems) {
      const customerId = item.orderData?.customer_id;
      if (!customerId) continue;
      if (!groupedItems[customerId]) groupedItems[customerId] = [];
      if (groupedItems[customerId].length < 5) {
        groupedItems[customerId].push(item);
      }
    }

    // Step 4: Merge and mask
    const enriched = customers.map((customer) => ({
      ...customer.toJSON(),
      phone: obscureData(customer.phone),
      email: obscureData(customer.email, "email"),
      last_order_items: groupedItems[customer.id] || [],
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};
