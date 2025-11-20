import { Customer } from "../entities/Customer";
import { Order } from "../entities/Order";
import dataSource from "../config/dataSource";
import { OrderCustomer } from "../entities/OrderCustomer";
import { saveEntity, saveEntityBy } from "../utils";

export async function createOrderCustomerJob(
  order: Order,
  customerData: any,
  queryRunner: any
) {
  try {
    // Get fresh order within transaction
    const freshOrder = await queryRunner.manager.findOne(Order, {
      where: { id: order.id },
    });

    if (!freshOrder) {
      throw new Error(`Order with ID ${order.id} not found`);
    }

    // Update customer if no_finance data exists
    if (customerData.no_finance || customerData.no_finance_2) {
      await saveEntityBy(queryRunner.manager, Customer, "email", {
        email: customerData.email,
        no_finance: customerData.no_finance || null,
        no_finance_2: customerData.no_finance_2 || null,
      });
    }

    // Create OrderCustomerData relation
    try {
      const { id, created_at, updated_at, ...safeCustomerData } = customerData;

      await saveEntity(queryRunner.manager, OrderCustomer, {
        ...safeCustomerData,
        order_id: freshOrder.id,
      });
    } catch (err) {
      console.error("Failed to create OrderCustomer:", err);
    }
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error("Error in createOrderCustomerJob:", error);
    throw error;
  }
}
