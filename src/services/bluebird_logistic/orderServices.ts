import axios, { AxiosInstance } from "axios";
import {
  BLUEBIRD_LOGISTIC_API_ORDER_URL,
  BLUEBIRD_LOGISTIC_API_ORDER_V2_URL,
  BLUEBIRD_LOGISTIC_API_ORDER_V3_URL,
} from "../../utils/constants";

interface OrderItem {
  quantity: number;
  product_name: string;
  length: number;
  width: number;
  height: number;
  weight: number;
}

export interface CreateOrderPayload {
  reference_no: string;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_address: string;
  pickup_instruction: string;
  dropoff_latitude: number;
  dropoff_longitude: number;
  dropoff_address: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  weight: number;
  height: number;
  width: number;
  length: number;
  service_type: string;
  contact_phone: string;
  callback_url: string;
  order_date: string;
  contact_name: string;
  order_items: OrderItem[];
}

export interface CancelOrderPayload {
  order_id: string;
  reason_text: string;
  reference_no: string;
}

interface CreateOrderResponse {
  order_id?: string;
  status?: string;
  message?: string;
}

interface OrderDetailsResponse {
  order_id: string;
  reference_no: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  customer_name: string;
  customer_phone: string;
  tracking_url?: string;
}

export const createOrderService = async (
  orderData: CreateOrderPayload,
  accessToken: string,
  httpClient: AxiosInstance = axios
): Promise<CreateOrderResponse> => {
  const response = await httpClient.post<CreateOrderResponse>(
    BLUEBIRD_LOGISTIC_API_ORDER_V3_URL,
    orderData,
    {
      headers: {
        "Content-Type": "text/plain",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  console.log(response, "response");

  return response.data;
};

export const cancelOrderService = async (
  orderData: CancelOrderPayload,
  accessToken: string,
  httpClient: AxiosInstance = axios
): Promise<CreateOrderResponse> => {
  const rawData = JSON.stringify(orderData);

  const response = await httpClient.put<CreateOrderResponse>(
    `${BLUEBIRD_LOGISTIC_API_ORDER_V2_URL}/cancel`,
    rawData,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.data;
};

export const getOrderDetailsService = async (
  orderId: string,
  accessToken: string,
  httpClient: AxiosInstance = axios
): Promise<OrderDetailsResponse> => {
  const response = await httpClient.get<OrderDetailsResponse>(
    BLUEBIRD_LOGISTIC_API_ORDER_URL,
    {
      params: {
        order_id: orderId,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data;
};

export const getOrderDetailsByReferenceService = async (
  referenceNo: string,
  accessToken: string,
  httpClient: AxiosInstance = axios
): Promise<OrderDetailsResponse> => {
  const response = await httpClient.get<OrderDetailsResponse>(
    `${BLUEBIRD_LOGISTIC_API_ORDER_URL}/byReferenceNo`,
    {
      params: {
        reference_no: referenceNo,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data;
};

export const getOrderTrackingService = async (
  orderId: string,
  accessToken: string,
  httpClient: AxiosInstance = axios
): Promise<OrderDetailsResponse> => {
  const response = await httpClient.get<OrderDetailsResponse>(
    `${BLUEBIRD_LOGISTIC_API_ORDER_URL}/tracking`,
    {
      params: {
        order_id: orderId,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data;
};
