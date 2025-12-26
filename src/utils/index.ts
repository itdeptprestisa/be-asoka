import { DeepPartial, In, Like } from "typeorm";
import { Customer } from "../entities/Customer";
import { Settings } from "../entities/Settings";
import dataSource from "../config/dataSource";
import { Logs } from "../entities/Logs";
import path from "path";
import * as ftp from "basic-ftp";
import { promises as fs } from "fs";
import * as commonFs from "fs";
import axios from "axios";
import FormData from "form-data";

export const haversineGreatCircleDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  earthRadius: number = 6371
): number => {
  // Convert degrees to radians
  const latFrom = (lat1 * Math.PI) / 180;
  const lonFrom = (lon1 * Math.PI) / 180;
  const latTo = (lat2 * Math.PI) / 180;
  const lonTo = (lon2 * Math.PI) / 180;

  const latDelta = latTo - latFrom;
  const lonDelta = lonTo - lonFrom;

  // Haversine formula
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(latFrom) *
      Math.cos(latTo) *
      Math.sin(lonDelta / 2) *
      Math.sin(lonDelta / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
};

/**
 * Generate a random point near given coordinates within specified radius
 * @param lat Latitude of center point (in degrees)
 * @param lng Longitude of center point (in degrees)
 * @param radiusInMeters Radius in meters (default: 2000m = 2km)
 * @returns Object with lat and lng of random point
 */
export const generateRandomPointNear = (
  lat: number,
  lng: number,
  radiusInMeters: number = 2000
): { lat: number; lng: number } => {
  // Convert meters to degrees (approximate: 1° ≈ 111,320 meters at equator)
  const radiusInDegrees = radiusInMeters / 111320;

  // Generate random numbers between 0 and 1
  const u = Math.random();
  const v = Math.random();

  // Generate random point within circle
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;

  const x = w * Math.cos(t);
  const y = w * Math.sin(t);

  // Adjust x-coordinate for longitude (cosine of latitude)
  const new_x = x / Math.cos((lat * Math.PI) / 180);

  const newLat = lat + y;
  const newLng = lng + new_x;

  return { lat: newLat, lng: newLng };
};

// stub: implement your own whitelist check
function whitelistHsm(): string[] {
  return [
    "template_foto_lokasi_prestisa_terbaru_v2_230724",
    "template_foto_lokasi_terbaru_310124",
    "konfirmasi_lokasi_rangkaianbunga_24062025",
  ];
}

export async function gojekBookingRequest(
  po: PurchaseOrder,
  orderItem: OrderItems | null = null,
  cron = false
) {
  await createLog("gojek_requested", "");

  const webRangkaianBunga = 17;
  const webParselia = 5;
  const allowedWebsites = [webRangkaianBunga, webParselia];

  if (!orderItem) {
    orderItem = await OrderItems.findOne({ where: { id: po.pr_id } });
  }

  const data = {
    order_data: { po_id: po.id },
    origin: {
      contact_name: po.supplierData.name,
      note: po.notes,
      lat_lng: `${po.supplierData.latitude},${po.supplierData.longitude}`,
    },
    destination: {
      note: "",
      lat_lng: `${orderItem.pickup_lat},${orderItem.pickup_long}`,
      contact_name: po.receiver_name,
      phone: po.customerData.phone,
      address: po.shipping_address,
    },
  };

  if (orderItem.shipping_expedition === "GOJEK") {
    try {
      const res = await gojekRequestPickupHelper(data);
      return res;
    } catch (err: any) {
      await logError(`gojek_request_pickup_error_po_id_${po.id}`, err.message);
      return err.message;
    }
  } else if (orderItem.shipping_expedition === "GOCAR") {
    try {
      const res = await gojekRequestPickupHelper(data);
      return res;
    } catch (err: any) {
      await logError(`gocar_request_pickup_error_po_id_${po.id}`, err.message);
      return err.message;
    }
  }
}

export async function sendNotifOutside(json: any): Promise<any> {
  try {
    const response = await axios.post(
      "https://lotus.prestisa.id/lavenger-backend/public/api/save-hsm-message",
      // emulate multipart/form-data
      new URLSearchParams({ jsonData: JSON.stringify(json) }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data;
  } catch (err: any) {
    return {
      success: false,
      msg: err.message,
    };
  }
}

export async function waNotifHsmImageRb(
  to: string,
  templatename: string,
  parameters: string[] = [],
  imageUrl = "",
  button = ""
): Promise<any> {
  if (!whitelistHsm().includes(templatename)) {
    return false;
  }

  try {
    const url = "https://api.nexmo.com/v1/messages";
    const auth = "Bearer " + process.env.NEXMO_TOKEN;

    const params = parameters.map((v) => ({
      type: "text",
      text: v,
    }));

    const requestBody: any = {
      message_type: "custom",
      to: phone62(to),
      from: "62895416016478", // your WhatsApp business number
      channel: "whatsapp",
      custom: {
        type: "template",
        template: {
          namespace: "3c41bda0_1204_4c5e_981d_1d48cc023e3d",
          name: templatename,
          language: {
            policy: "deterministic",
            code: "id",
          },
          components: [
            {
              type: "header",
              parameters: [
                {
                  type: "image",
                  image: { link: imageUrl },
                },
              ],
            },
            {
              type: "body",
              parameters: params,
            },
          ],
        },
      },
    };

    if (button) {
      requestBody.custom.template.components.push({
        type: "button",
        sub_type: "url",
        index: 1,
        parameters: [
          {
            type: "text",
            text: button,
          },
        ],
      });
    }

    const response = await axios.post(url, requestBody, {
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // optional: increment counter
    // hsmCounter(templatename);

    return response.data;
  } catch (err: any) {
    return {
      success: false,
      msg: err.message,
    };
  }
}

export async function waNotifHsmImage(
  to: string,
  templatename: string,
  parameters: string[] = [],
  imageUrl = "",
  button = ""
): Promise<any> {
  if (!whitelistHsm().includes(templatename)) {
    return false;
  }

  try {
    const url = "https://api.nexmo.com/v1/messages";
    const auth = "Bearer " + process.env.NEXMO_TOKEN; // your JWT token here

    // format parameters
    const params = parameters.map((v) => ({
      type: "text",
      text: v,
    }));

    const requestBody: any = {
      message_type: "custom",
      to: phone62(to),
      from: "6281231828249", // your WhatsApp business number
      channel: "whatsapp",
      custom: {
        type: "template",
        template: {
          namespace: "3c41bda0_1204_4c5e_981d_1d48cc023e3d",
          name: templatename,
          language: {
            policy: "deterministic",
            code: "id",
          },
          components: [
            {
              type: "header",
              parameters: [
                {
                  type: "image",
                  image: {
                    link: imageUrl,
                  },
                },
              ],
            },
            {
              type: "body",
              parameters: params,
            },
          ],
        },
      },
    };

    if (button) {
      requestBody.custom.template.components.push({
        type: "button",
        sub_type: "url",
        index: 1,
        parameters: [
          {
            type: "text",
            text: button,
          },
        ],
      });
    }

    const response = await axios.post(url, requestBody, {
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // optional: increment counter
    // hsmCounter(templatename);

    return response.data;
  } catch (err: any) {
    return {
      success: false,
      msg: err.message,
    };
  }
}

export function jabodetabekIds() {
  const jabodetabek = [
    1642903, 1642904, 1642905, 1642908, 1642909, 9849799, 6751097, 1648470,
    1648471, 1649377, 6599302, 1625083, 9845480, 9849891,
  ];
  return jabodetabek;
}

export function maskOrder(orders) {
  return orders.map((order) => {
    if (order.customerData?.phone) {
      order.customerData.real_phone = order.customerData.phone;
      order.customerData.phone = obscureData(order.customerData.phone, "phone");
    }
    return order;
  });
}

export async function getUserByRole(ids) {
  const res = RoleUser.findBy({ role_id: In(ids) }).then((rows) =>
    rows.map((r) => r.user_id)
  );

  return res;
}

export function degToRad(deg) {
  return deg * (Math.PI / 180);
}

export function radToDeg(rad) {
  return rad * (180 / Math.PI);
}

export function countDistanceNearbyLocation(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371;
  lat1 = degToRad(lat1);
  lon1 = degToRad(lon1);
  lat2 = degToRad(lat2);
  lon2 = degToRad(lon2);

  return (
    earthRadius *
    Math.acos(
      Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1) +
        Math.sin(lat1) * Math.sin(lat2)
    )
  );
}

export function countDistance(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function jakartaIds() {
  const jabodetabek = [9849799, 1642909, 1642908, 1642905, 1642904, 1642903];
  return jabodetabek;
}

export function obscureData(value, type = "phone") {
  if (!value) return "";
  if (type === "email") {
    const [user, domain] = value.split("@");
    return `${user.slice(0, 2)}***@${domain}`;
  }
  return value.slice(0, 3) + "***" + value.slice(-2);
}

export async function hasPermission(
  userId: number,
  permissionName: string
): Promise<boolean> {
  if (!userId) return false;

  const UsersRepository = dataSource.getRepository(Users);

  const user = await UsersRepository.findOne({
    where: { id: userId },
    relations: {
      rolesData: {
        permissionsData: true,
      },
    },
  });

  if (!user) return false;

  const permissions = user.rolesData.flatMap((role) =>
    role.permissionsData.map((perm) => perm.slug)
  );

  return (
    permissions.includes(permissionName) || permissions.includes("god-mode")
  );
}

export async function waNotifHsm(to, templateName, parameters = []) {
  if (process.env.NODE_ENV !== "development") {
    // TODO: replace with your actual whitelist function
    const whitelistHsm = () => [
      "template_foto_hasil_prestisa_v2_230724",
      "toto_hasil_no_confirmation_2025",
      "foto_hasil_karangan_bunga_2025",
      "konfirmasi_hasil_rangkaianbunga_24062025",
      "template_foto_lokasi_prestisa_terbaru_v2_230724",
      "template_foto_lokasi_terbaru_310124",
      "konfirmasi_lokasi_rangkaianbunga_24062025",
      "tamplate_hasil_revisi_mitra_03062025",
      "tamplate_hasil_mitra_03062025",
    ];

    if (!whitelistHsm().includes(templateName)) {
      return false;
    }

    const url = "https://api.nexmo.com/v1/messages";
    const auth = "Bearer " + process.env.NEXMO_TOKEN;

    try {
      // Convert parameters to WhatsApp format
      const params = parameters.map((text) => ({
        type: "text",
        text,
      }));

      const requestBody = {
        message_type: "custom",
        to: phone62(to), // helper to normalize into +62 format
        from: process.env.PRESTISA_PHONE_NUMBER,
        channel: "whatsapp",
        custom: {
          type: "template",
          template: {
            namespace: "3c41bda0_1204_4c5e_981d_1d48cc023e3d",
            name: templateName,
            language: {
              policy: "deterministic",
              code: "id",
            },
            components: [
              {
                type: "body",
                parameters: params,
              },
            ],
          },
        },
      };

      const response = await axios.post(url, requestBody, {
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

export const createLog = async (name: string, data: string) => {
  const logsRepository = dataSource.getRepository(Logs);
  const log = new Logs();
  log.name = name;
  log.data = data;
  return await logsRepository.save(log);
};

export const logError = async (context: string, error: any) => {
  return await createLog(
    `Error: ${context}`,
    typeof error === "string" ? error : JSON.stringify(error)
  );
};

export async function sendToLavenderFtp(
  localFilePath: string,
  remoteFileName: string
) {
  try {
    // API upload first
    await createLog(
      "begin_upload_by_api",
      JSON.stringify({ remoteFileName, url: process.env.LAVENDER_BASE_URL })
    );

    const form = new FormData();
    form.append("path", remoteFileName);
    form.append(
      "file",
      commonFs.createReadStream(localFilePath),
      path.basename(localFilePath)
    );

    await axios.post(
      process.env.LAVENDER_BASE_URL + "/customer-web/image-uploader",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "lavender-asset-uploader": "upload-when-fail",
        },
      }
    );

    await createLog("success_upload_image_api", remoteFileName);

    await fs.unlink(localFilePath);
    return true;
  } catch (apiErr) {
    // FTP fallback
    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
      await createLog("retry_upload_by_ftp", "");

      await client.access({
        host: "lavender.prestisa.id",
        user: process.env.FTP_USERNAME,
        password: process.env.FTP_PASSWORD,
        port: 21,
        secure: false,
      });

      const remoteDir = path.posix.dirname(remoteFileName);
      const fileName = path.posix.basename(remoteFileName);

      await client.cd(remoteDir);
      await client.uploadFrom(localFilePath, fileName);
      console.log(`Uploaded to ${remoteDir}/${fileName} via FTP`);

      await fs.unlink(localFilePath);
      return true;
    } catch (ftpErr) {
      await logError("error_upload", { apiError: apiErr, ftpError: ftpErr });
      return false;
    } finally {
      client.close();
    }
  }
}

export function phone62(phone: string) {
  phone = phone.toString().replace(/\D/g, ""); // keep digits only
  if (phone.startsWith("0")) {
    return "62" + phone.substring(1);
  }
  return phone.startsWith("62") ? phone : "62" + phone;
}

export async function referralCodeGenerator(custName: string): Promise<string> {
  // Normalize name
  const name = custName.replace(/\s+/g, "").toUpperCase();

  // Get first 4 characters or pad with zeros
  const start =
    name.length >= 4
      ? name.substring(0, 4)
      : name + "0".repeat(4 - name.length);
  let end = "0001";

  // Find last referral code starting with the same prefix
  const lastSameName = await Customer.findOne({
    where: {
      my_referral_code: Like(`${start}%`),
    },
    order: {
      my_referral_code: "DESC",
    },
  });

  if (lastSameName?.my_referral_code) {
    const numericPart =
      parseInt(lastSameName.my_referral_code.substring(4, 8), 10) + 1;
    end = numericPart.toString().padStart(4, "0");
  }

  return `${start}${end}`;
}

export async function getSettings(key: string, field: string) {
  // Example: load from settings table
  const setting = await Settings.findOne({ where: { meta_key: key } });
  return setting ? JSON.parse(setting.meta_value)[field] : [];
}

import { Repository, QueryRunner } from "typeorm";
import { Users } from "../entities/Users";
import { RoleUser } from "../entities/RoleUser";
import dayjs from "dayjs";
import { PurchaseOrder } from "../entities/PurchaseOrder";
import { OrderItems } from "../entities/OrderItems";
import { Order } from "../entities/Order";
import { gojekRequestPickupHelper } from "../new_controllers/gojekController";

export async function saveEntity<T>(
  repo: Repository<T> | QueryRunner["manager"],
  entityClass: { new (): T },
  payload: DeepPartial<T>
): Promise<T> {
  // If using queryRunner.manager, it behaves like a repository
  const repository =
    "getRepository" in repo ? repo.getRepository(entityClass) : repo;

  const entity = repository.create(payload);
  return repository.save(entity);
}

export async function saveEntityBy<T, U extends keyof T>(
  repo: Repository<T> | QueryRunner["manager"],
  entityClass: { new (): T },
  uniqueField: U,
  payload: DeepPartial<T> & { [P in U]: T[P] }
): Promise<T> {
  const repository =
    "getRepository" in repo ? repo.getRepository(entityClass) : repo;

  const existing = await repository.findOne({
    where: { [uniqueField]: payload[uniqueField] } as any,
  });

  if (existing) {
    repository.merge(existing, payload);
    return repository.save(existing);
  } else {
    const entity = repository.create(payload);
    return repository.save(entity);
  }
}
