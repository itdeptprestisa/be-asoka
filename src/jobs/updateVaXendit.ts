import axios from "axios";
export async function updateVaXendit(vaId, total, taxType) {
  const endpoint = `https://api.xendit.co/callback_virtual_accounts/${vaId}`;
  const apiKey =
    taxType === "tax" ? process.env.XENDIT_KEY : process.env.XENDIT_KEY_UBB;

  const response = await axios.patch(
    endpoint,
    {
      expected_amount: Math.round(total),
      is_closed: true,
    },
    {
      auth: {
        username: apiKey,
        password: "",
      },
    }
  );

  return response.data;
}
