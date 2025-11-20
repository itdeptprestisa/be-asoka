import { createLog, logError, saveEntity } from "..";
import dataSource from "../../config/dataSource";
import { PurchaseOrder } from "../../entities/PurchaseOrder";

export async function photoApproval(
  po_id,
  rating,
  transaction = null,
  userId = null
) {
  try {
    const ratings = Math.floor(rating);
    const approval_notes = "lavender rating approval";
    const PurchaseOrderRepository = dataSource.getRepository(PurchaseOrder);

    const po = await PurchaseOrder.findOneBy({ id: po_id });
    if (!po) throw new Error("Purchase Order not found");

    let logs = [];
    try {
      logs = JSON.parse(po.photo_approval_logs);
      if (!Array.isArray(logs)) logs = [];
    } catch {
      logs = [];
    }

    const newStatus = {
      photo_approval: "approved",
      date: new Date().toISOString().slice(0, 19).replace("T", " "),
      user: userId || "system",
      rating: ratings,
    };

    logs.push(newStatus);
    const updatedLogs = JSON.stringify(logs);

    if ([5, 4, 3].includes(ratings)) {
      await saveEntity(PurchaseOrderRepository, PurchaseOrder, {
        id: po_id,
        photo_approval: "approved",
        photo_approval_notes: approval_notes,
        photo_approval_logs: updatedLogs,
      });
    }
  } catch (error) {
    await logError(
      "error_photo_approval_lavender",
      JSON.stringify({
        po_id,
        msg: error.message,
        line: error.lineNumber || error.stack,
      })
    );
  }
}
