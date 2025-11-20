import { Request, Response, NextFunction } from "express";
import dataSource from "../config/dataSource";
import { PurchaseOrder } from "../entities/PurchaseOrder";

export const detail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const PurchaseOrderRepository = dataSource.getRepository(PurchaseOrder);

  try {
    const po = await PurchaseOrderRepository.findOne({
      where: { id: parseInt(id, 10) },
      relations: {
        orderData: true,
        orderItemsData: true,
        purchaseOrderRatingData: true,
      },
    });

    if (!po) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase Order not found" });
    }

    return res.json({
      success: true,
      data: {
        id: po.id,
        pr_id: po.pr_id,
        order_id: po.order_id,
        created_at: po.created_at,
        real_image: po.real_image,
        delivery_location: po.delivery_location,
        notes: po.notes,
        orderData: po.orderData
          ? {
              id: po.orderData.id,
              order_number: po.orderData.order_number,
              owner: po.orderData.owner,
            }
          : null,
        orderItemsData: po.orderItemsData,
        purchaseOrderRatingData: po.purchaseOrderRatingData ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
};
