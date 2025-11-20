const express = require("express");
const router = express.Router();
const { sendToLavenderFtp } = require("../utils/helpers");
const path = require("path");
const fs = require("fs");

exports.testFtpUpload = async (req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    // try {
    //   const file = req.file;
    //   if (!file) {
    //     return res.status(400).json({ error: "No file uploaded" });
    //   }
    //   const localPath = file.path; // Multer sets this
    //   const remotePath = `/assets/images/customers/sakura-upload-test.png`; // or customize as needed
    //   await sendToLavenderFtp(localPath, remotePath);
    //   res.status(200).json({
    //     message: "FTP upload successful",
    //     remotePath,
    //   });
    // } catch (error) {
    //   console.error("FTP upload failed:", error);
    //   next(error);
    // }
  }
};

exports.testFtpBase64Upload = async (req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    // try {
    //   const { base64 } = req.body;
    //   if (!base64) {
    //     return res
    //       .status(400)
    //       .json({ error: "Missing base64 or filename in request body" });
    //   }
    //   const localPath = path.join(
    //     process.cwd(),
    //     "storage",
    //     "app",
    //     "images",
    //     "faktur",
    //     "test-ftp-64.png"
    //   );
    //   fs.mkdirSync(path.dirname(localPath), { recursive: true });
    //   const base64Data = base64.replace(/^data:.*;base64,/, "");
    //   fs.writeFileSync(localPath, Buffer.from(base64Data, "base64"));
    //   const remotePath = `/assets/images/customers/sakura-upload-test.png`;
    //   await sendToLavenderFtp(localPath, remotePath);
    //   res
    //     .status(200)
    //     .json({ message: "Image saved successfully", path: localPath });
    // } catch (error) {
    //   console.error("Failed to save image:", error);
    //   next(error);
    // }
  }
};
