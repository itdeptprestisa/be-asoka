import { Request, Response, NextFunction } from "express";
import { getSettings, hasPermission } from "../utils";
import { Users } from "../entities/Users";

export const users = async (req, res, next) => {
  try {
    const users = await Users.find();

    res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

export const permissions = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId ?? null;

    const sales = (await getSettings("general-settings", "sales_users")) ?? [];
    const isSales = Array.isArray(sales) && sales.includes(userId);

    const result = {
      has_permission_acquisition: await hasPermission(
        userId,
        "view-acquisition-rank"
      ),
      has_permission_telemarketing: await hasPermission(
        userId,
        "view-telemarketing-rank"
      ),
      has_permission_visibility: await hasPermission(userId, "view-visibility"),
      has_permission_dashboard_po: await hasPermission(
        userId,
        "view-dashboard-po"
      ),
      is_sales: isSales,
      has_permission_dashboard_review_customer: await hasPermission(
        userId,
        "view-dashboard-review-customer"
      ),
    };

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
