const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { fromPath } = require("pdf2pic");

export async function createImageJob({ src, dest }) {
  try {
    const ext = path.extname(src).toLowerCase();

    if (ext === ".pdf") {
      // Convert first page of PDF to PNG
      const converter = fromPath(src, {
        density: 150,
        saveFilename: path.basename(dest, path.extname(dest)), // strip extension
        savePath: path.dirname(dest),
        format: "png",
        width: 600,
        height: 800,
      });

      const page = await converter(1); // convert first page only
      console.log(`PDF converted to image: ${page.path}`);

      // If pdf2pic saved to a different filename, rename to match dest
      if (page.path !== dest) {
        fs.renameSync(page.path, dest);
      }
    } else {
      // Handle images
      const meta = await sharp(src).metadata();

      if (meta.format === "png" || meta.format === "jpeg") {
        console.log(`Image already in ${meta.format}, no conversion needed.`);
        return;
      }

      // Write to a temporary file first
      const tempDest = dest + ".tmp.png";

      await sharp(src).png().toFile(tempDest);

      // Replace original file atomically
      fs.renameSync(tempDest, dest);

      console.log(`Image converted and saved to ${dest}`);
    }
  } catch (error) {
    console.error("Error in createImageJob:", error);
    throw error;
  }
}
