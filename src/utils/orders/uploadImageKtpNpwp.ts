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
    "faktur",
    filename
  );

  fs.mkdirSync(path.dirname(localPath), { recursive: true });

  const base64Data = base64.replace(/^data:.*;base64,/, "");
  fs.writeFileSync(localPath, Buffer.from(base64Data, "base64"));

  await createImageJob({ src: localPath, dest: localPath });
  await sendToLavenderFtp(localPath, `/assets/images/customers/${filename}`);

  return `/api/images/customers/${filename}`;
}

export async function uploadImageKtpNpwp(cD: any, customer_id: any) {
  let img_n = cD.npwp_img;
  let img_k = cD.ktp_img;

  if (cD.npwp_img && cD.npwp_img.includes("data:")) {
    img_n = await processImage(
      cD.npwp_img,
      process.env.NODE_ENV === "production"
        ? `npwp_${customer_id}.png`
        : `staging_npwp_${customer_id}.png`
    );
  }

  if (cD.ktp_img && cD.ktp_img.includes("data:")) {
    img_k = await processImage(
      cD.ktp_img,
      process.env.NODE_ENV === "production"
        ? `ktp_${customer_id}.png`
        : `staging_ktp_${customer_id}.png`
    );
  }

  return { img_k, img_n };
}
