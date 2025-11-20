import dataSource from "../config/dataSource";
import { CustomerAr } from "../entities/CustomerAr";
import { DocumentInvoice } from "../entities/DocumentInvoice";
import { createLog, logError, saveEntity } from "../utils";

export async function autoCreateDocumentInvoice(order) {
  try {
    const customerAr = await CustomerAr.findOne({
      where: { customer_id: order.customer_id },
    });
    const DocumentInvoiceRepository = dataSource.getRepository(DocumentInvoice);

    if (!customerAr) {
      await logError(
        "document invoice error",
        JSON.stringify({
          message: "Customer not found in CustomerAr.",
          customer_id: order.customer_id,
          order_id: order.id,
        })
      );
      return;
    }

    if (
      customerAr.tax_invoice === 0 &&
      customerAr.send_physical_invoice === 1
    ) {
      const isExist = await DocumentInvoice.findOne({
        where: { order_number: order.order_number },
      });

      if (!isExist) {
        try {
          await saveEntity(DocumentInvoiceRepository, DocumentInvoice, {
            request_date: new Date(),
            complete_date: null,
            order_number: order.order_number,
            is_send_invoice: 1,
            send_invoice_address: customerAr.send_physical_invoice_address,
            send_document_status: "not send",
            receipt_number: null,
          });

          await createLog(
            "document invoice info",
            JSON.stringify({
              message: "Document invoice created successfully.",
              order_id: order.id,
              customer_id: order.customer_id,
            })
          );
        } catch (err) {
          await logError(
            "document invoice error",
            JSON.stringify({
              message: err.message,
              line: err.lineNumber || null,
              file: err.fileName || null,
              order_id: order.id,
            })
          );
        }
      }
    } else {
      await logError(
        "document invoice warning",
        JSON.stringify({
          message:
            "Document invoice not created because tax_invoice != 0 or send_physical_invoice != 1",
          customer_id: order.customer_id,
          order_id: order.id,
        })
      );
    }
  } catch (error) {
    await logError(
      "document invoice error",
      JSON.stringify({
        message: error.message,
        order_id: order.id,
      })
    );
  }
}
