const { Customer, Orders } = require("../models");

async function updateOrderCustomerJob(orderId, customerData, extraData) {
  try {
    // Update Customers table
    await Customer.update(
      {
        gender: customerData.gender ?? "null",
        npwp: customerData.npwp ?? null,
        nik: customerData.nik ?? null,
        address: customerData.address ?? null,
        invoice_address: extraData.invoice_address,
      },
      {
        where: { id: customerData.id },
      }
    );

    // Update OrderCustomer relation
    const order = await Orders.findByPk(orderId);
    const orderCustomer = await order.getOrderCustomerData();

    if (orderCustomer) {
      await orderCustomer.update({
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        type: customerData.type,
        company_type: customerData.company_type ?? null,
        company_name: customerData.company_name ?? null,
        company_email: customerData.company_email ?? null,
        company_phone: customerData.company_phone ?? null,
        company_address: customerData.company_address ?? null,
      });
    }
  } catch (error) {
    console.error("Error in updateOrderCustomerJob:", error);
    throw error;
  }
}

module.exports = updateOrderCustomerJob;
