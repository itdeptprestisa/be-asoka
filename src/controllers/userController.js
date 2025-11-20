const Users = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getSettings, hasPermission } = require("../utils/helpers");

exports.permissions = async (req, res, next) => {
  try {
    const userId = req.user?.userId ?? null;

    const sales = (await getSettings("general-settings", "sales_users")) ?? [];
    const isSales = Array.isArray(sales) && sales.includes(userId);

    return res.json({
      success: true,
      data: {
        has_permission_acquisition: await hasPermission(
          userId,
          "view-acquisition-rank"
        ),
        has_permission_telemarketing: await hasPermission(
          userId,
          "view-telemarketing-rank"
        ),
        has_permission_visibility: await hasPermission(
          userId,
          "view-visibility"
        ),
        has_permission_dashboard_po: await hasPermission(
          userId,
          "view-dashboard-po"
        ),
        is_sales: isSales,
        has_permission_dashboard_review_customer: await hasPermission(
          userId,
          "view-dashboard-review-customer"
        ),
      },
    });
  } catch (error) {
    next(error);
  }
};
