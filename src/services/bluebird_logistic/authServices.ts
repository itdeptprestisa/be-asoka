import axios, { AxiosInstance } from "axios";
import qs from "querystring";
import {
  BLUEBIRD_LOGISTIC_API_CLIENT_ID,
  BLUEBIRD_LOGISTIC_API_CLIENT_SECRET,
  BLUEBIRD_LOGISTIC_API_TOKEN_URL,
} from "../../utils/constants";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

interface AuthConfig {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
}

const createAuthConfig = (): AuthConfig => ({
  tokenUrl: BLUEBIRD_LOGISTIC_API_TOKEN_URL,
  clientId: BLUEBIRD_LOGISTIC_API_CLIENT_ID,
  clientSecret: BLUEBIRD_LOGISTIC_API_CLIENT_SECRET,
  scope: "LogisticAPI",
});

export const fetchAccessToken = async (
  config: AuthConfig = createAuthConfig(),
  httpClient: AxiosInstance = axios
): Promise<TokenResponse> => {
  const params = {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "client_credentials",
    scope: config.scope,
  };

  const response = await httpClient.post<TokenResponse>(
    config.tokenUrl,
    qs.stringify(params),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data;
};
