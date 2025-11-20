import { Between, Not } from "typeorm";
import dayjs from "dayjs";
import { PurchaseOrder } from "../../entities/PurchaseOrder";
import { PurchaseOrderRating } from "../../entities/PurchaseOrderRating";
import { Supplier } from "../../entities/Supplier";
import { createLog, logError, saveEntity } from "..";

export async function supplierRateAvg(supplier_id: number, queryRunner) {
  const PurchaseOrderRepository =
    queryRunner.manager.getRepository(PurchaseOrder);
  const PurchaseOrderRatingRepository =
    queryRunner.manager.getRepository(PurchaseOrderRating);
  const SupplierRepository = queryRunner.manager.getRepository(Supplier);

  // 1. Count valid POs with ratings
  const count_ids = await PurchaseOrderRepository.count({
    where: {
      supplier_id,
      status: Not("cancelled"),
      purchaseOrderRatingData: { flower_rating: Not(null) }, // assumes @OneToOne(() => PurchaseOrderRating, ...) as purchaseOrderRatingData
    },
    relations: { purchaseOrderRatingData: true },
  });

  // 2. Calculate average flower_rating
  const avgResult = await PurchaseOrderRatingRepository.createQueryBuilder(
    "rating"
  )
    .select("AVG(rating.flower_rating)", "avg_rating")
    .innerJoin(
      "rating.purchaseOrderData",
      "po",
      "po.supplier_id = :supplier_id AND po.status != :status",
      {
        supplier_id,
        status: "cancelled",
      }
    )
    .where("rating.flower_rating IS NOT NULL")
    .getRawOne();

  const avg_rating = parseFloat(avgResult?.avg_rating || "0");

  // 3. Update supplier if rating exists
  if (avg_rating) {
    const supplier = await SupplierRepository.findOneBy({ id: supplier_id });
    if (!supplier) return;

    supplier.avg_rating = avg_rating;

    if (count_ids >= 3) {
      supplier.freeze_until =
        avg_rating <= 2.5 ? dayjs().add(7, "day").toDate() : null;
    }

    await saveEntity(SupplierRepository, Supplier, supplier);
    await createLog(`freeze_supplier_${supplier_id}_by_`, "");
  } else {
    await logError(`freeze_supplier_${supplier_id}_not_valid`, "");
  }
}
