const { Customer, Orders } = require("../models");
const Logs = require("../models/logs");

async function createOrderCustomerJob(order, customerData, transaction) {
  // const transaction = await Orders.sequelize.transaction();

  try {
    const freshOrder = await Orders.findByPk(order.id, { transaction });

    // Update customer and create relation
    if (customerData.no_finance || customerData.no_finance_2) {
      await Customer.update(
        {
          no_finance: customerData.no_finance || null,
          no_finance_2: customerData.no_finance_2 || null,
        },
        {
          where: { email: customerData.email },
          transaction,
        }
      );
    }

    try {
      const { id, created_at, updated_at, ...safeCustomerData } = customerData;
      await freshOrder.createOrderCustomerData(safeCustomerData, {
        transaction,
      });
    } catch (err) {
      console.error("Failed to create OrderCustomer:", err);
    }
  } catch (error) {
    await transaction.rollback();
    console.error("Error in createOrderJob:", error);
    throw error;
  }
}

module.exports = createOrderCustomerJob;
