import dataSource from "../config/dataSource";
import { Customer } from "../entities/Customer";
import { Order } from "../entities/Order";
import { OrderCustomer } from "../entities/OrderCustomer";
import { saveEntity, saveEntityBy } from "../utils";

export async function updateOrderCustomerJob(orderId, customerData, extraData) {
  try {
    const CustomerRepository = dataSource.getRepository(Customer);
    const OrderCustomerRepository = dataSource.getRepository(OrderCustomer);

    // Update Customers table
    await saveEntity(CustomerRepository, Customer, {
      id: customerData.id,
      gender: customerData.gender ?? "null",
      npwp: customerData.npwp ?? null,
      nik: customerData.nik ?? null,
      address: customerData.address ?? null,
      invoice_address: extraData.invoice_address,
    });

    // Update OrderCustomer relation
    const order = await Order.findOneBy({ id: orderId });
    let orderCustomer = await OrderCustomer.findOneBy({ order_id: order.id });

    if (orderCustomer) {
      orderCustomer.name = customerData.name;
      orderCustomer.email = customerData.email;
      orderCustomer.phone = customerData.phone;
      orderCustomer.type = customerData.type;
      orderCustomer.company_type = customerData.company_type ?? null;
      orderCustomer.company_name = customerData.company_name ?? null;
      orderCustomer.company_email = customerData.company_email ?? null;
      orderCustomer.company_phone = customerData.company_phone ?? null;
      orderCustomer.company_address = customerData.company_address ?? null;

      await OrderCustomerRepository.save(orderCustomer);
    }
  } catch (error) {
    console.error("Error in updateOrderCustomerJob:", error);
    throw error;
  }
}
