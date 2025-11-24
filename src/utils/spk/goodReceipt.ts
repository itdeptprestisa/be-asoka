import { sendToLavenderFtp } from "..";
import { createImageJob } from "../../jobs/createImageJob";

const fs = require("fs");
const path = require("path");
// const { sendToLavenderFtp } = require("../helpers");

async function processImage(base64, filename) {
  const localPath = path.join(
    process.cwd(),
    "storage",
    "app",
    "images",
    "good-receipt",
    filename
  );

  fs.mkdirSync(path.dirname(localPath), { recursive: true });

  const base64Data = base64.replace(/^data:.*;base64,/, "");
  fs.writeFileSync(localPath, Buffer.from(base64Data, "base64"));

  await createImageJob({ src: localPath, dest: localPath });
  await sendToLavenderFtp(localPath, `/assets/images/good-receipt/${filename}`);

  return `/api/images/good-receipt/${filename}`;
}

export async function uploadGoodReceipt(receipt: string, spk_id: any) {
  let img = receipt;

  if (receipt && receipt.includes("data:")) {
    img = await processImage(
      receipt,
      process.env.NODE_ENV === "production"
        ? `spk_${spk_id}.png`
        : `staging_spk_${spk_id}.png`
    );
  }
  return { img };
}
