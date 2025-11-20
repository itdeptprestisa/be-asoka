import { Request, Response, NextFunction } from "express";
import { Order } from "../entities/Order";
import { ILike, Not } from "typeorm";
import dataSource from "../config/dataSource";
import { Customer } from "../entities/Customer";
import { OrderItems } from "../entities/OrderItems";
import { obscureData } from "../utils";

export const search = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { keyword } = req.query;

  try {
    const normalized = keyword?.toString().trim();
    const CustomersRepository = dataSource.getRepository(Customer);
    const OrderItemsRepository = dataSource.getRepository(OrderItems);

    let whereClause = {};

    if (/^\d+$/.test(normalized)) {
      whereClause = { phone: normalized };
    } else if (normalized?.includes("@")) {
      whereClause = { email: normalized };
    } else {
      whereClause = [
        { name: ILike(`%${normalized}%`) },
        { email: ILike(`%${normalized}%`) },
        { phone: ILike(`%${normalized}%`) },
      ];
    }

    // Step 1: Fetch customers
    const customers = await CustomersRepository.find({
      where: Array.isArray(whereClause) ? whereClause : whereClause,
      relations: { customerArData: true },
      take: 50,
      order: { id: "DESC" },
    });

    const customerIds = customers.map((c) => c.id);
    if (customerIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Step 2: Fetch last order items with logos
    const orderItems = await OrderItemsRepository.find({
      where: {
        special_request_logo: ILike("%"),
        orderData: {
          customer_id: customerIds.length === 1 ? customerIds[0] : undefined,
        },
      },
      relations: { orderData: true },
      order: { id: "DESC" },
      take: 500,
    });

    // Step 3: Group order items by customer_id
    const groupedItems: Record<number, OrderItems[]> = {};
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
      ...customer,
      phone: obscureData(customer.phone),
      email: obscureData(customer.email, "email"),
      last_order_items: groupedItems[customer.id] || [],
    }));

    return res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

export const detail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = parseInt(req.params.id);
    const CustomersRepository = dataSource.getRepository(Customer);
    const OrderItemsRepository = dataSource.getRepository(OrderItems);

    // Fetch customer
    const customer = await CustomersRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    // Fetch last 5 order items with special_request_logo
    const lastOrderItems = await OrderItemsRepository.find({
      where: {
        special_request_logo: Not(""),
        orderData: { customer_id: customerId },
      },
      relations: { orderData: true },
      order: { id: "DESC" },
      take: 5,
    });

    return res.json({
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
