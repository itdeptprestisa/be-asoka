import { logError, saveEntity } from "..";
import dataSource from "../../config/dataSource";
import { ShippingCostEstimation } from "../../entities/ShippingCostEstimation";

export async function addShippingCostEstimation(data) {
  const ShippingCostEstimationRepository = dataSource.getRepository(
    ShippingCostEstimation
  );

  const { id, city_id, distance, shipping_cost, courier_name, error_log } =
    data;

  try {
    let message = "data already exist";
    let cost_per_km = 0;

    const calculate_cost_per_km = Math.ceil(
      shipping_cost / Math.ceil(distance || 1)
    );
    cost_per_km = calculate_cost_per_km > 4000 ? 4000 : calculate_cost_per_km;

    const payload: any = {
      order_items_id: id,
      city_id,
      distance:
        distance && distance !== 0 ? Math.round(distance * 100) / 100 : 0,
      cost_per_km: distance && shipping_cost ? cost_per_km : 0,
      courier_name,
      shipping_cost: distance && shipping_cost ? shipping_cost : 0,
      error_log,
    };

    message =
      distance && shipping_cost
        ? "successfully save shipping cost estimation data"
        : "successfully save shipping cost estimation data with zero values";

    await saveEntity(
      ShippingCostEstimationRepository,
      ShippingCostEstimation,
      payload
    );

    return {
      success: true,
      message,
    };
  } catch (error) {
    await logError(
      `shipping_cost_estimation_error_on_id_${id}`,
      JSON.stringify(data)
    );

    return {
      success: false,
      message: error.message,
    };
  }
}
