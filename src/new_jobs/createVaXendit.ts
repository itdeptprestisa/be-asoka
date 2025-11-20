import { logError } from "../utils";
import axios from "axios";
export async function createVaXendit(obj, orderNumber, total) {
  if (obj.payment_method !== "va") return;

  const createVaEndpoint = `${process.env.XENDIT_BASE_URL}/callback_virtual_accounts`;

  const vaName =
    obj.va_bank === "BSI"
      ? `Prestisa ${orderNumber.slice(0, 6)}`
      : `Prestisa PT Kaya Raya Turun Temurun ${orderNumber.slice(0, 6)}`;

  const externalId = `VA-${orderNumber}-${Date.now()}`;

  const payload = {
    external_id: externalId,
    bank_code: obj.va_bank,
    name: vaName,
    expected_amount: total,
    is_closed: true,
    is_single_use: true,
  };

  const apiKey =
    obj.tax_type === "tax"
      ? process.env.XENDIT_KEY
      : process.env.XENDIT_KEY_UBB;

  try {
    const response = await axios.post(createVaEndpoint, payload, {
      auth: {
        username: apiKey,
        password: "",
      },
    });

    const data = response.data;
    obj.va_account_number = data.account_number;
    obj.va_external_id = data.external_id;
    obj.va_id = data.id;

    return data;
  } catch (err) {
    const errorData = err.response?.data || err.message;
    await logError("Error Create Virtual Account Xendit", errorData);
    throw new Error("Terjadi kesalahan dalam membuat VA");
  }
}
