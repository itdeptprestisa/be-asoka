// jobs/createPdfJob.js
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

async function createPdfJob({ order, pdfLoc }) {
  try {
    const url = `${process.env.APP_URL}/view-invoice/${order.order_number}`;

    // Ensure destination folder exists
    const dir = path.dirname(pdfLoc);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle0" });

    await page.pdf({
      path: pdfLoc,
      format: "A4",
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
      printBackground: true,
    });

    await browser.close();
    console.log(`PDF saved to ${pdfLoc}`);
  } catch (error) {
    console.error("Error in createPdfJob:", error);
    throw error;
  }
}

module.exports = createPdfJob;
