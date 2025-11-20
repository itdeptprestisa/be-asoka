// const puppeteer = require("puppeteer");
// const fs = require("fs");
// const path = require("path");
// const Logs = require("../models/logs");
// const { sendToLavenderFtp } = require("../utils/helpers");

import path from "path";
import * as fs from "fs";
import puppeteer from "puppeteer";
import { createLog, logError, sendToLavenderFtp } from "../utils";

export async function createGreetingsCardJob({ pr, website, img }) {
  const chromePath = process.env.CHROME_PATH || "/usr/bin/google-chrome";

  try {
    // --- project temp directory (choose "tmp" at repo root or inside src)
    // e.g. <repo-root>/tmp/gc-<timestamp>-<random>
    const projectTmpRoot = path.join(__dirname, "..", "tmp"); // change to '..', 'src', 'tmp' if you prefer
    fs.mkdirSync(projectTmpRoot, { recursive: true });

    const fileName = `greetings_${pr.id}_${Date.now()}.png`;
    const tmpDir = path.join(
      projectTmpRoot,
      `gc-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    );
    fs.mkdirSync(tmpDir, { recursive: true });

    const imgPath: any = path.join(tmpDir, fileName);

    // Build URL to render HTML template
    const baseUrl = process.env.APP_URL;
    const queryParams = new URLSearchParams({
      website: String(website),
      sender_name: pr.sender_name || "",
      receiver_name: pr.receiver_name || "",
      greetings: pr.greetings || "",
    }).toString();
    const url = `${baseUrl}/api/public/greetings-card/view?${queryParams}`;

    // Launch Puppeteer using system Chrome
    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 720 });
    await page.goto(url, { waitUntil: "networkidle0" });

    // Save screenshot to project temp path
    await page.screenshot({ path: imgPath, fullPage: false, type: "png" });
    await browser.close();

    if (!fs.existsSync(imgPath)) {
      throw new Error(`Screenshot not created: ${imgPath}`);
    }

    // remote path for FTP (keep same shape as your public path)
    const remotePath = String(img).startsWith("/") ? img : `/${String(img)}`;

    // Upload; sendToLavenderFtp is expected to remove local file afterwards
    await sendToLavenderFtp(imgPath, remotePath);

    // Optional: remove the tmpDir if sendToLavenderFtp didn't delete it
    try {
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      fs.rmdirSync(tmpDir, { recursive: true });
    } catch (e) {
      // ignore cleanup errors
    }

    await createLog(`success_generate_gc_${pr.id}`, "ok");
  } catch (error) {
    await logError(
      `error_generate_gc_${pr.id}`,
      JSON.stringify({
        msg: error.message,
        line: error.lineNumber || error.stack?.split("\n")[1] || "unknown",
      })
    );
  }
}
