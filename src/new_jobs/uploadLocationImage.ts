import { getRepository } from "typeorm";
import { PurchaseOrder } from "../entities/PurchaseOrder";
import { PoImageLogs } from "../entities/PoImageLogs";
import { WaWebhook } from "../entities/WaWebhook";
import dayjs from "dayjs";
import dataSource from "../config/dataSource";
import axios from "axios";
import * as fs from "fs";

import {
  createLog,
  logError,
  saveEntity,
  sendNotifOutside,
  sendToLavenderFtp,
  waNotifHsmImage,
  waNotifHsmImageRb,
} from "../utils";
import path from "path";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";

// === Save Receipt to Lavender ===
// Mirrors Laravel helper: always sends the API endpoint string in both POST URL and body["url"]
export async function saveImageReceiptLavender(
  id: string | number
): Promise<boolean> {
  try {
    const endpoint =
      "https://lavender.prestisa.id/api/service/16c98d4e-cd0f-11ed-afa1-0ff223a/save-delivery-receipt";

    const body = {
      url: `https://lavender.prestisa.id/delivery-receipt/view/${id}`, // view URL
      path: id.toString(), // plain id
    };

    const response = await axios.post(endpoint, body, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    return response.status === 200;
  } catch (err: any) {
    console.error(
      "Lavender receipt save failed:",
      err.response?.data || err.message
    );
    return false;
  }
}

// === Helpers ===
function logsFormatter(existingLog: string, newLog: any): string {
  return JSON.stringify([existingLog, newLog]);
}

// === Main Service ===
export async function uploadLocationImage(payload: {
  po_id: number;
  courier: "BLUE BIRD" | "GOJEK";
  img_location?: string;
}) {
  const poRepo = dataSource.getRepository(PurchaseOrder);
  const poImageLogsRepo = dataSource.getRepository(PoImageLogs);
  const whatsappRepo = dataSource.getRepository(WaWebhook);
  const id = payload.po_id;
  let imgpath = "";

  try {
    // Delivery Location Image (fallback to PO real_image)
    if (payload.courier === "BLUE BIRD" && payload.img_location) {
      imgpath = await handleBlueBirdProof(payload.img_location, payload.po_id);
    } else if (payload.courier === "GOJEK") {
      imgpath = await handleGojekProof(payload.img_location, payload.po_id);
    }

    if (!imgpath) {
      const poData = await PurchaseOrder.findOne({
        where: { id },
        select: ["real_image"],
      });
      poData?.real_image;

      imgpath = poData?.real_image;
    }

    // === Delivery Receipt ===
    const deliveryReceiptPath = `/assets/images/delivery_receipt/po.${id}.jpg`;
    const okReceipt = await saveImageReceiptLavender(id);

    if (!okReceipt) {
      // throw new Error("Failed to save receipt image");
      await createLog("Failed to save receipt image", `po_id_${id}`);
    }

    // === Update PurchaseOrder ===
    const poLog = await PurchaseOrder.findOne({ where: { id } });
    const newLog = {
      date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      status: "on location",
      platform: "subdomain",
      desc: "upload location image",
    };
    const statusLog = logsFormatter(poLog?.status_log || "", newLog);

    await saveEntity(poRepo, PurchaseOrder, {
      id,
      delivery_location: imgpath,
      delivery_receipt: deliveryReceiptPath,
      status_log: statusLog,
      status: "on location",
    });

    // === PoImageLogs ===
    const time = { status: "ok", desc: "on-time" }; // stub for gen_std_time
    await poImageLogsRepo.save({
      po_id: id,
      tipe: "foto lokasi",
      status_late: time.status,
      desc: time.desc,
      supplier_owner_photo: poLog?.supplier_id,
    });

    // === WhatsApp HSM Notification ===
    const po = await PurchaseOrder.findOne({
      where: { id },
      relations: ["orderData", "orderData.customerData"],
    });

    if (po) {
      const websiteid = po.orderData.website;
      const to = po.orderData.customerData.phone;
      const customer = po.orderData.customerData.name;
      const orderNumber = po.orderData.order_number;
      const placeholders = [customer, orderNumber];
      const imageUrl = `https://lavender.prestisa.id${po.delivery_location}`;
      const buttonUrl = "https://notif.prestisa.com/";

      let templatename = "";
      let sendNotif: any;

      if (websiteid === 1) {
        templatename = "template_foto_lokasi_prestisa_terbaru_v2_230724";
        sendNotif = await waNotifHsmImage(
          to,
          templatename,
          placeholders,
          imageUrl,
          buttonUrl
        );
      } else if (websiteid === 8) {
        templatename = "template_foto_lokasi_terbaru_310124";
        sendNotif = {}; // ftw_hsm_image equivalent
      } else if (websiteid === 17) {
        templatename = "konfirmasi_lokasi_rangkaianbunga_24062025";
        sendNotif = await waNotifHsmImageRb(to, templatename, [], imageUrl);
      }

      await saveEntity(whatsappRepo, WaWebhook, {
        msgfrom: "cs",
        number: to,
        body: `send from MITRA ${templatename} to ${to} | response : ${JSON.stringify(
          sendNotif
        )}`,
        token: "foto_lokasi_hsm",
        expired_at: dayjs().add(10, "minute").toDate(),
        po_id: po?.id,
      });

      const hsmRespon = sendNotif;
      const json = {
        from: websiteid === 17 ? "62895416016478" : "6281231828249",
        to,
        messageId: hsmRespon?.message_uuid,
        messageText: `Foto Lokasi untuk PO ${po?.id}`,
        contactName: customer,
        fileName: `${po?.id}.png`,
        token: "07d0b91e771752005d94ceb5c5efdc0a",
        hsmName: templatename,
        fileUrl: imageUrl,
      };

      await sendNotifOutside(json);
    }

    return { success: true };
  } catch (err: any) {
    await createLog(
      `error_upload_location_image_po_${id}`,
      JSON.stringify(err.message)
    );
    return { success: false, msg2: err.message };
  }
}

async function handleBlueBirdProof(url: string, po_id: number) {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });

    const fileName =
      process.env.NODE_ENV === "production"
        ? `po.${po_id}.png`
        : `staging_po.${po_id}.png`;
    let imgpath = `/assets/images/delivery_location/${fileName}`;

    const savePath = path.resolve("uploads", fileName);
    fs.writeFileSync(savePath, response.data);

    await sendToLavenderFtp(savePath, imgpath);
    return imgpath;
  } catch (error) {
    logError("gojek_location_image_error", error);
    return null;
  }
}

export async function handleGojekProof(url: string, po_id: number) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // Collect all proof image src attributes (no waitForSelector)
    const imgSrcs = await page.$$eval('img[alt="Proof"]', (imgs) =>
      imgs.map((el) => el.getAttribute("src"))
    );

    const fileName =
      process.env.NODE_ENV === "production"
        ? `po.${po_id}.png`
        : `staging_po.${po_id}.png`;

    const savePath = path.resolve("uploads", fileName);
    const imgpath = `/assets/images/delivery_location/${fileName}`;

    let proofImgSrc = null;

    // Prefer the second image if it exists, otherwise use the first
    if (imgSrcs.length >= 2) {
      proofImgSrc = imgSrcs[1];
    }

    if (proofImgSrc) {
      const absoluteImgSrc = proofImgSrc.startsWith("http")
        ? proofImgSrc
        : new URL(proofImgSrc, url).href;

      const response = await axios.get(absoluteImgSrc, {
        responseType: "arraybuffer",
      });
      fs.writeFileSync(savePath, response.data);
    } else {
      // No proof images at all → fallback screenshot
      await page.screenshot({ path: savePath, fullPage: true });
    }

    await browser.close();
    await sendToLavenderFtp(savePath, imgpath);
    return imgpath;
  } catch (error: any) {
    console.error("gojek_location_image_error:", {
      message: error?.message,
      stack: error?.stack,
    });
    return null;
  }
}
