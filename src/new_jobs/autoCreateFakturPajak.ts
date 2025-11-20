import moment from "moment";
import { CustomerAr } from "../entities/CustomerAr";
import { Order } from "../entities/Order";
import { TaxInvoices } from "../entities/TaxInvoices";
import { createLog, logError } from "../utils";

export async function autoCreateFakturPajak(customerId, orderNumber) {
  try {
    const order = await Order.findOne({ where: { order_number: orderNumber } });
    if (!order) {
      await logError(
        "auto create faktur pajak error",
        `Order ID = ${orderNumber} not found`
      );
      return;
    }

    const customerAr = await CustomerAr.findOne({
      where: { customer_id: customerId },
    });
    if (!customerAr) {
      await logError(
        "auto create faktur pajak error",
        `Customer ID = ${customerId} not found in CustomerAr`
      );
      return;
    }

    if (customerAr.tax_invoice === 0) {
      await logError(
        "auto create faktur pajak warning",
        `Customer ID = ${customerId} not set tax_invoice = 1`
      );
      return;
    }

    const existing = await TaxInvoices.findOne({
      where: { order_number: order.order_number },
    });
    if (existing) {
      await logError(
        "auto create faktur pajak warning",
        `Order number = ${order.order_number} already has a tax invoice`
      );
      return;
    }

    const requiredFields = {
      npwp_number_1: customerAr.npwp_number_1,
      npwp_name_1: customerAr.npwp_name_1,
      npwp_address_1: customerAr.npwp_address_1,
      send_physical_invoice: customerAr.send_physical_invoice,
      send_physical_invoice_address: customerAr.send_physical_invoice_address,
    };

    const nullFields = Object.keys(requiredFields).filter(
      (k) => requiredFields[k] == null
    );

    if (nullFields.length > 0) {
      await logError(
        "auto create faktur pajak error",
        `Missing required fields in CustomerAr for customer ID = ${customerId}: ${nullFields.join(
          ", "
        )}`
      );
      return;
    }

    await TaxInvoices.create({
      request_date: moment().format("YYYY-MM-DD"),
      order_number: order.order_number,
      npwp_number: customerAr.npwp_number_1,
      npwp_name: customerAr.npwp_name_1,
      npwp_address: customerAr.npwp_address_1,
      physical_document_delivery: customerAr.send_physical_invoice,
      physical_document_address: customerAr.send_physical_invoice_address,
    });

    await createLog(
      "auto create faktur pajak success",
      `Tax invoice created for order number = ${order.order_number}, customer ID = ${customerId}`
    );
  } catch (error) {
    await logError("auto create faktur pajak error", error.message);
  }
}
