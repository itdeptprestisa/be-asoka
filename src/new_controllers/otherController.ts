import { NextFunction, Request, Response } from "express";
import { Like, Between, MoreThan, LessThan, In, IsNull, Not } from "typeorm";
import { Logs } from "../entities/Logs";
import dataSource from "../config/dataSource";
import { saveEntity, sendToLavenderFtp } from "../utils";
import moment from "moment";
import { handleGojekProof } from "../new_jobs/uploadLocationImage";

export const testFtpUpload = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // if (process.env.NODE_ENV === "development") {
  try {
    // const file = req.file;
    // if (!file) {
    //   res.json({ success: false, message: "No file uploaded" });
    // }
    // const localPath = file.path; // Multer sets this
    // const remotePath = `/assets/images/customers/sakura-upload-test.png`; // or customize as needed

    const ress = await handleGojekProof(
      "https://track.gojek.com/?id=47de92a7",
      101
    );

    res.status(200).json({
      message: "FTP upload successful",
      ress,
    });
  } catch (error) {
    next(error);
  }
  // }
};

export const postLog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const LogsRepository = dataSource.getRepository(Logs);

  try {
    saveEntity(LogsRepository, Logs, {
      name: "coba timezone",
      data: moment().format("DD-MM-YYYY HH:mm:ss"),
    });

    res.json({
      success: true,
      message: "Log created successfully",
    });
  } catch (error) {
    next(error);
  }
};
