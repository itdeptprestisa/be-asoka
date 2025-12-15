import axios, { AxiosInstance } from "axios";
import { BLUEBIRD_LOGISTIC_API_FARE_URL } from "../../utils/constants";

export interface FareEstimationParams {
  pickup_lat: number;
  pickup_lon: number;
  dropoff_lat: number;
  dropoff_lon: number;
  service_type: string;
  weight?: number;
}

interface FareEstimationResponse {
  code?: number;
  result?: {
    distance?: number;
    price?: number;
  };
}

export const getFarePriceEstimationService = async (
  params: FareEstimationParams,
  accessToken: string,
  httpClient: AxiosInstance = axios
): Promise<FareEstimationResponse> => {
  const response = await httpClient.get<FareEstimationResponse>(
    BLUEBIRD_LOGISTIC_API_FARE_URL,
    {
      params: params,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.data;
};
