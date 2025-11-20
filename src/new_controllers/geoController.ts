import { Request, Response, NextFunction } from "express";
import { Like } from "typeorm";
import dataSource from "../config/dataSource";
import { Geo } from "../entities/Geo";

export const search = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const query = req.query;
  const GeosRepository = dataSource.getRepository(Geo);
  let result = [];

  try {
    if (query.keyword === "country") {
      result = await GeosRepository.find({
        where: {
          parent_id: null,
          depth: 0,
          level: "PCLI",
        },
      });
    } else {
      const keyword = query.keyword?.toString().trim();
      const fallbackParentId = 1643084;

      result = await GeosRepository.find({
        where: [
          { name: Like(`%${keyword}%`) },
          { parent_id: keyword ? parseInt(keyword) : fallbackParentId },
        ],
      });
    }

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
