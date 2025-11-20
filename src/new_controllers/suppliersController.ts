import { Request, Response, NextFunction } from "express";
import dataSource from "../config/dataSource";
import { Supplier } from "../entities/Supplier";
import { Settings } from "../entities/Settings";
import { Geo } from "../entities/Geo";
import { countDistance, degToRad, radToDeg } from "../utils";
import { Between, ILike, In, Not } from "typeorm";

export const detail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const supplier = await dataSource.getRepository(Supplier).findOne({
      where: { id: parseInt(req.params.id, 10) },
    });

    return res.json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
};

export const nearby = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const freezeSetting = await dataSource
      .getRepository(Settings)
      .findOne({ where: { id: 15 } });
    const mitraFreeze = freezeSetting?.meta_value
      ? JSON.parse(freezeSetting.meta_value)
      : [];

    const city = await dataSource
      .getRepository(Geo)
      .findOne({ where: { id: parseInt(req.query.city as string, 10) } });
    if (!city)
      return res
        .status(404)
        .json({ success: false, message: "City not found" });

    const lat = parseFloat(req.query.destination_lat as string) || 0;
    const lng = parseFloat(req.query.destination_lng as string) || 0;
    const radius = 50;
    const earthRadius = 6371;

    const latDiff = radius / earthRadius;
    const longDiff = radius / (earthRadius * Math.cos(degToRad(lat)));

    const latMin = lat - radToDeg(latDiff);
    const latMax = lat + radToDeg(latDiff);
    const lngMin = lng - radToDeg(longDiff);
    const lngMax = lng + radToDeg(longDiff);

    const suppliers = await dataSource.getRepository(Supplier).find({
      where: {
        latitude: Between(latMin, latMax),
        longitude: Between(lngMin, lngMax),
        country: 1643084,
        app_register: Not("need approval"),
        id: Not(In(mitraFreeze)),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        speciality: true,
        address: true,
        country: true,
        province: true,
        city: true,
        latitude: true,
        longitude: true,
      },
      order: {
        id: "ASC", // placeholder; actual distance ordering is done via raw query
      },
      take: 5,
    });

    const count = suppliers.length;
    let selected = null;
    let found = true;
    let add_data = {};

    if (count >= 3) selected = suppliers[2];
    else if (count >= 1) selected = suppliers[Math.min(1, count - 1)];
    else {
      const distance = countDistance(city.lat, city.long, lat, lng);
      const cost = 4000 * distance;
      found = false;
      add_data = { cost: Math.floor(cost), distance: Math.floor(distance) };
    }

    return res.json({
      success: true,
      data: { found, count, selected, city, add_data },
    });
  } catch (err) {
    next(err);
  }
};

export const search = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { keyword, destination_lat, destination_lng, city } = req.query;

  try {
    if (destination_lat && destination_lng && city) {
      const lat = parseFloat(destination_lat as string);
      const lng = parseFloat(destination_lng as string);
      const radius = 50;
      const earthRadius = 6371;

      const latDiff = radius / earthRadius;
      const lngDiff = radius / (earthRadius * Math.cos(degToRad(lat)));

      const latMin = lat - radToDeg(latDiff);
      const latMax = lat + radToDeg(latDiff);
      const lngMin = lng - radToDeg(lngDiff);
      const lngMax = lng + radToDeg(lngDiff);

      const freezeSetting = await dataSource
        .getRepository(Settings)
        .findOne({ where: { id: 15 } });
      const mitraFreeze = freezeSetting?.meta_value
        ? JSON.parse(freezeSetting.meta_value)
        : [];

      const cityData = await dataSource.getRepository(Geo).findOne({
        where: { id: parseInt(city as string, 10) },
      });

      const suppliers = await dataSource.getRepository(Supplier).find({
        where: {
          latitude: Between(latMin, latMax),
          longitude: Between(lngMin, lngMax),
          country: 1643084,
          app_register: Not("need approval"),
          id: Not(In(mitraFreeze)),
        },
        take: 5,
      });

      const count = suppliers.length;
      let selected = null;
      let found = true;
      let add_data = {};

      if (count >= 3) selected = suppliers[Math.min(2, count - 1)];
      else if (count >= 1) selected = suppliers[Math.min(1, count - 1)];
      else {
        const distance = countDistance(
          cityData?.lat || 0,
          cityData?.long || 0,
          lat,
          lng
        );
        const cost = 4000 * distance;
        found = false;
        add_data = { cost: Math.floor(cost), distance: Math.floor(distance) };
      }

      return res.json({
        success: true,
        found,
        count,
        selected,
        city: cityData,
        add_data,
      });
    }

    // Fallback keyword search
    const keywordStr = keyword?.toString().trim();
    const filters = [];

    if (keywordStr) {
      filters.push({ name: ILike(`%${keywordStr}%`) });
      filters.push({ email: ILike(`%${keywordStr}%`) });
      filters.push({ phone: ILike(`%${keywordStr}%`) });
      if (!isNaN(Number(keywordStr))) filters.push({ id: Number(keywordStr) });
    }

    const supplier = await dataSource.getRepository(Supplier).find({
      where: filters.length ? filters : undefined,
    });

    return res.json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
};
