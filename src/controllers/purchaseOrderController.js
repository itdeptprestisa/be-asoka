// controllers/purchaseOrderController.js

const { Orders } = require("../models");
const OrderItems = require("../models/orderItems");
const PurchaseOrder = require("../models/purchaseOrder");
const PurchaseOrderRating = require("../models/purchaseOrderRating");

exports.detail = async (req, res, next) => {
  const { id } = req.params;

  try {
    const po = await PurchaseOrder.findOne({
      attributes: [
        "id",
        "pr_id",
        "order_id",
        "created_at",
        "real_image",
        "delivery_location",
        "notes",
      ],
      where: { id: id },
      include: [
        {
          model: Orders,
          as: "orderData",
          attributes: ["id", "order_number", "owner"],
        },
        {
          model: OrderItems,
          as: "orderItemsData",
          attributes: ["id", "image"],
        },
        {
          model: PurchaseOrderRating,
          as: "purchaseOrderRatingData",
        },
      ],
    });

    if (!po) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase Order not found" });
    }

    return res.json({
      success: true,
      data: po,
    });
  } catch (error) {
    next(error);
  }
};
