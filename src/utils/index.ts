import { DeepPartial, In, Like } from "typeorm";
import { Customer } from "../entities/Customer";
import { Settings } from "../entities/Settings";
import dataSource from "../config/dataSource";
import { Logs } from "../entities/Logs";
import path from "path";
import * as ftp from "basic-ftp";
import * as fs from "fs";
import axios from "axios";

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

export async function sendToLavenderFtp(localFilePath, remoteFileName) {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
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
    console.log(`Uploaded to ${remoteDir}/${fileName}`);

    return true;
  } catch (err) {
    return false;
  } finally {
    try {
      await fs.unlink(localFilePath, () => {
        console.log("File deleted successfully");
      });
    } catch (unlinkErr) {
      console.error("Failed to remove local file: ", unlinkErr);
    }
    client.close();
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
