const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const tz = require("dayjs/plugin/timezone");
const moment = require("moment");
const momentTimezone = require("moment-timezone");
dayjs.extend(utc);
dayjs.extend(tz);

const Settings = require("../models/settings");
const Client = require("ssh2-sftp-client");
const stream = require("stream");
const axios = require("axios");
const ftp = require("basic-ftp");
const fs = require("fs").promises;
const path = require("path");
const CustomerAr = require("../models/customerAr");
const Logs = require("../models/logs");
const DocumentInvoice = require("../models/documentInvoice");
const Order = require("../models/order");
const TaxInvoices = require("../models/taxInvoices");
const { Users } = require("../models");
const Roles = require("../models/roles");
const Permissions = require("../models/permissions");
const RoleUser = require("../models/roleUser");

const { Customer } = require("../models");
const { Op } = require("sequelize");

function maskOrder(orders) {
  return orders.map((order) => {
    if (order.customerData?.phone) {
      order.customerData.real_phone = order.customerData.phone;
      order.customerData.phone = obscureData(order.customerData.phone, "phone");
    }
    return order;
  });
}

async function referralCodeGenerator(custName) {
  // Remove spaces and convert to uppercase
  let name = custName.replace(/\s+/g, "").toUpperCase();

  // Get first 4 characters or pad with zeros
  const start =
    name.length >= 4
      ? name.substring(0, 4)
      : name + "0".repeat(4 - name.length);

  let end = "0001";

  // Find last referral code starting with the same prefix
  const lastSameName = await Customer.findOne({
    where: {
      my_referral_code: {
        [Op.like]: `${start}%`,
      },
    },
    order: [["my_referral_code", "DESC"]],
  });

  if (lastSameName) {
    const lastCode = lastSameName.my_referral_code;
    const numericPart = parseInt(lastCode.substring(4, 8), 10) + 1;
    end = numericPart.toString().padStart(4, "0");
  }

  return `${start}${end}`;
}

function degToRad(deg) {
  return deg * (Math.PI / 180);
}

function radToDeg(rad) {
  return rad * (180 / Math.PI);
}

function countDistanceNearbyLocation(lat1, lon1, lat2, lon2) {
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

function countDistance(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function jakartaIds() {
  const jabodetabek = [9849799, 1642909, 1642908, 1642905, 1642904, 1642903];
  return jabodetabek;
}

async function getUserByRole(ids) {
  const res = RoleUser.findAll({
    where: { role_id: ids },
  }).then((rows) => rows.map((r) => r.user_id));

  return res;
}

async function hasPermission(userId, permissionName) {
  if (!userId) return false;

  const user = await Users.findByPk(userId, {
    include: [
      {
        model: Roles,
        as: "rolesData",
        include: [
          {
            model: Permissions,
            as: "permissionsData",
          },
        ],
      },
    ],
  });

  if (!user) return false;

  const permissions = user.rolesData.flatMap((role) =>
    role.permissionsData.map((perm) => perm.slug)
  );

  return (
    permissions.includes(permissionName) || permissions.includes("god-mode")
  );
}

/**
 * Auto create Document Invoice if conditions met
 * @param {Order} order
 */
async function autoCreateDocumentInvoice(order) {
  try {
    const customerAr = await CustomerAr.findOne({
      where: { customer_id: order.customer_id },
    });

    if (!customerAr) {
      await Logs.create({
        name: "document invoice error",
        data: JSON.stringify({
          message: "Customer not found in CustomerAr.",
          customer_id: order.customer_id,
          order_id: order.id,
        }),
      });
      return;
    }

    if (
      parseInt(customerAr.tax_invoice) === 0 &&
      parseInt(customerAr.send_physical_invoice) === 1
    ) {
      const isExist = await DocumentInvoice.findOne({
        where: { order_number: order.order_number },
      });

      if (!isExist) {
        try {
          await DocumentInvoice.create({
            request_date: new Date(),
            complete_date: null,
            order_number: order.order_number,
            is_send_invoice: 1,
            send_invoice_address: customerAr.send_physical_invoice_address,
            send_document_status: "not send",
            receipt_number: null,
          });

          await Logs.create({
            name: "document invoice info",
            data: JSON.stringify({
              message: "Document invoice created successfully.",
              order_id: order.id,
              customer_id: order.customer_id,
            }),
          });
        } catch (err) {
          await Logs.create({
            name: "document invoice error",
            data: JSON.stringify({
              message: err.message,
              line: err.lineNumber || null,
              file: err.fileName || null,
              order_id: order.id,
            }),
          });
        }
      }
    } else {
      await Logs.create({
        name: "document invoice warning",
        data: JSON.stringify({
          message:
            "Document invoice not created because tax_invoice != 0 or send_physical_invoice != 1",
          customer_id: order.customer_id,
          order_id: order.id,
        }),
      });
    }
  } catch (error) {
    await Logs.create({
      name: "document invoice error",
      data: JSON.stringify({
        message: error.message,
        order_id: order.id,
      }),
    });
  }
}

/**
 * Auto create Faktur Pajak if conditions met
 * @param {number} customerId
 * @param {string} orderNumber
 */
async function autoCreateFakturPajak(customerId, orderNumber) {
  try {
    const order = await Order.findOne({ where: { order_number: orderNumber } });
    if (!order) {
      await Logs.create({
        name: "auto create faktur pajak error",
        data: `Order ID = ${orderNumber} not found`,
      });
      return;
    }

    const customerAr = await CustomerAr.findOne({
      where: { customer_id: customerId },
    });
    if (!customerAr) {
      await Logs.create({
        name: "auto create faktur pajak error",
        data: `Customer ID = ${customerId} not found in CustomerAr`,
      });
      return;
    }

    if (parseInt(customerAr.tax_invoice) === 0) {
      await Logs.create({
        name: "auto create faktur pajak warning",
        data: `Customer ID = ${customerId} not set tax_invoice = 1`,
      });
      return;
    }

    const existing = await TaxInvoices.findOne({
      where: { order_number: order.order_number },
    });
    if (existing) {
      await Logs.create({
        name: "auto create faktur pajak warning",
        data: `Order number = ${order.order_number} already has a tax invoice`,
      });
      return;
    }

    const requiredFields = {
      npwp_number_1: customerAr.npwp_number_1,
      npwp_name_1: customerAr.npwp_name_1,
      npwp_address_1: customerAr.npwp_address_1,
      send_physical_invoice: customerAr.send_physical_invoice,
      send_physical_invoice_address: customerAr.send_physical_invoice_address,
    };

    const nullFields = Object.keys(requiredFields).filter(
      (k) => requiredFields[k] == null
    );

    if (nullFields.length > 0) {
      await Logs.create({
        name: "auto create faktur pajak error",
        data: `Missing required fields in CustomerAr for customer ID = ${customerId}: ${nullFields.join(
          ", "
        )}`,
      });
      return;
    }

    await TaxInvoices.create({
      request_date: new Date(),
      order_number: order.order_number,
      npwp_number: customerAr.npwp_number_1,
      npwp_name: customerAr.npwp_name_1,
      npwp_address: customerAr.npwp_address_1,
      physical_document_delivery: customerAr.send_physical_invoice,
      physical_document_address: customerAr.send_physical_invoice_address,
    });

    await Logs.create({
      name: "auto create faktur pajak success",
      data: `Tax invoice created for order number = ${order.order_number}, customer ID = ${customerId}`,
    });
  } catch (error) {
    await Logs.create({
      name: "auto create faktur pajak error",
      data: error.message,
    });
  }
}

/**
 * Send WhatsApp HSM notification via Vonage (Nexmo) API
 *
 * @param {string} to - Recipient phone number
 * @param {string} templateName - HSM template name
 * @param {string[]} parameters - Array of parameter texts for the template body
 * @returns {Promise<object>} API response
 */
async function waNotifHsm(to, templateName, parameters = []) {
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

function phone62(phone) {
  phone = phone.toString().replace(/\D/g, ""); // keep digits only
  if (phone.startsWith("0")) {
    return "62" + phone.substring(1);
  }
  return phone.startsWith("62") ? phone : "62" + phone;
}

const sendToLavenderFtp = async (localFilePath, remoteFileName) => {
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
      await fs.unlink(localFilePath);
    } catch (unlinkErr) {
      console.error("Failed to remove local file: ", unlinkErr);
    }
    client.close();
  }
};

const getSettings = async (key, field) => {
  // Example: load from settings table
  const setting = await Settings.findOne({ where: { meta_key: key } });
  return setting ? JSON.parse(setting.meta_value)[field] : [];
};

function toCurrency(num) {
  return Number(num).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function obscureData(value, type = "phone") {
  if (!value) return "";
  if (type === "email") {
    const [user, domain] = value.split("@");
    return `${user.slice(0, 2)}***@${domain}`;
  }
  return value.slice(0, 3) + "***" + value.slice(-2);
}

const sessionTz = "America/Caracas"; // DB/session timezone
const appTz = "Asia/Jakarta"; // User-facing timezone

function minutesAgo(minutes) {
  // Subtract in app timezone first, then convert to DB
  return dayjs()
    .tz(appTz)
    .subtract(minutes, "minute")
    .tz(sessionTz)
    .format("YYYY-MM-DD HH:mm:ss");
}

// function todayDbRange() {
//   const start = dayjs()
//     .tz(appTz)
//     .startOf("day")
//     .tz(sessionTz)
//     .format("YYYY-MM-DD HH:mm:ss");
//   const end = dayjs()
//     .tz(appTz)
//     .endOf("day")
//     .tz(sessionTz)
//     .format("YYYY-MM-DD HH:mm:ss");
//   return [start, end];
// }

// pure jkt
function todayDbRange() {
  const start = dayjs()
    .tz("Asia/Jakarta")
    .startOf("day")
    .format("YYYY-MM-DD HH:mm:ss");
  const end = dayjs()
    .tz("Asia/Jakarta")
    .endOf("day")
    .format("YYYY-MM-DD HH:mm:ss");
  return [start, end];
}

/**
 * Convert a single date from app timezone to DB/session timezone
 * @param {string} dateStr - e.g. "2025-08-19 14:30:00" (Jakarta time)
 * @returns {string}       - formatted in DB/session timezone
 */
function toDbDate(dateStr) {
  return dayjs.tz(dateStr, appTz).tz(sessionTz).format("YYYY-MM-DD");
}

/**
 * Returns current time in app timezone, formatted for MySQL.
 * Example: '2025-08-19 13:45:00'
 */
function nowDbDateTime() {
  return dayjs().tz(appTz).format("YYYY-MM-DD HH:mm:ss");
}

// function toDbDateTime(dateStr, timeStr) {
//   return dayjs
//     .tz(`${dateStr} ${timeStr}`, appTz)
//     .tz(sessionTz)
//     .format("YYYY-MM-DD HH:mm:ss");
// }

// function toDbDateTime(dateStr, timeStr = "00:00:00") {
//   return `${dateStr} ${timeStr}`;
// }

// function toDbDateTime(dateStr, timeStr = "00:00:00") {
//   return dayjs.tz(`${dateStr} ${timeStr}`, appTz).format("YYYY-MM-DD HH:mm:ss");
// }

function toDbDateTime(date, time) {
  let res = moment
    .tz(`${date} ${time}`, "Asia/Jakarta")
    .format("YYYY-MM-DD HH:mm:ss");
  console.log("sss", res);
  return res; // Remove .utc() conversion
}

module.exports = {
  toCurrency,
  obscureData,
  minutesAgo,
  todayDbRange,
  toDbDate,
  toDbDateTime,
  nowDbDateTime,
  getSettings,
  sendToLavenderFtp,
  waNotifHsm,
  phone62,
  autoCreateDocumentInvoice,
  autoCreateFakturPajak,
  hasPermission,
  getUserByRole,
  jakartaIds,
  countDistance,
  degToRad,
  radToDeg,
  countDistanceNearbyLocation,
  referralCodeGenerator,
  maskOrder,
};
