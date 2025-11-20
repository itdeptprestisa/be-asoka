import axios from "axios";

export async function expireVaXendit(vaId, taxType) {
  const endpoint = `https://api.xendit.co/callback_virtual_accounts/${vaId}`;
  const expirationDate = new Date(Date.now() - 86400000)
    .toISOString()
    .split("T")[0]; // yesterday

  const apiKey =
    taxType === "tax" ? process.env.XENDIT_KEY : process.env.XENDIT_KEY_UBB;

  await axios.patch(
    endpoint,
    {
      expiration_date: expirationDate,
    },
    {
      auth: {
        username: apiKey,
        password: "",
      },
    }
  );
}
