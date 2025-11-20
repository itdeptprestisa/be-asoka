const { Op, Sequelize, literal } = require("sequelize");
const Supplier = require("../models/supplier");
const Settings = require("../models/settings");
const Geo = require("../models/geo");
const {
  countDistance,
  degToRad,
  radToDeg,
  countDistanceNearbyLocation,
} = require("../utils/helpers");

exports.detail = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      success: true,
      data: supplier,
    });
  } catch (err) {
    next(err);
  }
};

exports.nearby = async (req, res, next) => {
  try {
    // load freeze setting
    const freezeSetting = await Settings.findByPk(15);
    let mitraFreeze = [];
    if (freezeSetting?.meta_value) {
      try {
        mitraFreeze = JSON.parse(freezeSetting.meta_value);
      } catch {
        mitraFreeze = [];
      }
    }

    const countryId = 1643084; // Indonesia
    const city = await Geo.findByPk(req.query.city);
    if (!city) {
      return res
        .status(404)
        .json({ success: false, message: "City not found" });
    }

    const radius = 50;
    const lat = parseFloat(req.query.destination_lat) || 0;
    const lng = parseFloat(req.query.destination_lng) || 0;

    const earthRadius = 6371;
    const latDiff = radius / earthRadius;
    const longDiff = radius / (earthRadius * Math.cos(degToRad(lat)));

    const latMin = lat - radToDeg(latDiff);
    const latMax = lat + radToDeg(latDiff);
    const lngMin = lng - radToDeg(longDiff);
    const lngMax = lng + radToDeg(longDiff);

    // build query
    const suppliers = await Supplier.findAll({
      attributes: [
        "id",
        "name",
        "email",
        "phone",
        "speciality",
        "address",
        "country",
        "province",
        "city",
        "latitude",
        "longitude",
        [
          literal(`(
            ${earthRadius} * acos(
              cos(radians(${lat})) * cos(radians(latitude)) *
              cos(radians(longitude) - radians(${lng})) +
              sin(radians(${lat})) * sin(radians(latitude))
            )
          )`),
          "distance",
        ],
      ],
      // include: ["geoCityData", "geoCountryData", "geoProvinceData"],
      where: {
        latitude: { [Op.between]: [latMin, latMax] },
        longitude: { [Op.between]: [lngMin, lngMax] },
        country: countryId,
        app_register: { [Op.ne]: "need approval" },
        id: { [Op.notIn]: mitraFreeze },
      },
      order: literal("distance ASC"),
      limit: 5,
    });

    const count = suppliers.length;
    let selected = null;
    let found = true;
    let add_data = {};

    if (count >= 5) {
      selected = suppliers[2];
    } else if (count === 4) {
      selected = suppliers[2];
    } else if (count === 3) {
      selected = suppliers[1];
    } else if (count === 2) {
      selected = suppliers[1];
    } else if (count === 1) {
      selected = suppliers[0];
    } else {
      // fallback: distance from city center
      const distance = countDistance(city.lat, city.lng, lat, lng);
      const cost = 4000 * distance;
      found = false;
      add_data = {
        cost: Math.floor(cost),
        distance: Math.floor(distance),
      };
    }

    return res.json({
      success: true,
      data: {
        found,
        count,
        selected,
        city,
        add_data,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.search = async (req, res, next) => {
  const { keyword, destination_lat, destination_lng, city } = req.query;

  try {
    // If lat/lng and city are provided, run nearby supplier logic
    if (destination_lat && destination_lng && city) {
      const lat = parseFloat(destination_lat);
      const lng = parseFloat(destination_lng);
      const radius = 50;
      const earthRadius = 6371;

      const latDiff = radius / earthRadius;
      const lngDiff = radius / (earthRadius * Math.cos((lat * Math.PI) / 180));

      const latMin = lat - (latDiff * 180) / Math.PI;
      const latMax = lat + (latDiff * 180) / Math.PI;
      const lngMin = lng - (lngDiff * 180) / Math.PI;
      const lngMax = lng + (lngDiff * 180) / Math.PI;

      const mitraFreezeSetting = await Settings.findByPk(15);
      const mitraFreeze = mitraFreezeSetting
        ? JSON.parse(mitraFreezeSetting.meta_value || "[]")
        : [];

      const cityData = await Geo.findByPk(city);
      const country = 1643084; // Indonesia

      const suppliers = await Supplier.findAll({
        attributes: {
          include: [
            [
              Sequelize.literal(`6371 * acos(
                cos(radians(${lat})) *
                cos(radians(latitude)) *
                cos(radians(longitude) - radians(${lng})) +
                sin(radians(${lat})) *
                sin(radians(latitude))
              )`),
              "distance",
            ],
          ],
        },
        where: {
          latitude: { [Op.between]: [latMin, latMax] },
          longitude: { [Op.between]: [lngMin, lngMax] },
          country,
          app_register: { [Op.ne]: "need approval" },
          id: { [Op.notIn]: mitraFreeze },
        },
        order: Sequelize.literal("distance ASC"),
        limit: 5,
      });

      const count = suppliers.length;
      let selected = null;
      let found = true;
      let add_data = {};

      if (count >= 3) {
        selected = suppliers[Math.min(2, count - 1)];
      } else if (count >= 1) {
        selected = suppliers[Math.min(1, count - 1)];
      } else {
        // fallback: calculate distance from city center
        const distance = countDistance(
          cityData?.lat || 0,
          cityData?.lng || 0,
          lat,
          lng
        );
        const cost = 4000 * distance;
        found = false;
        add_data = {
          cost: Math.floor(cost),
          distance: Math.floor(distance),
        };
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

    // Fallback to keyword search
    const supplier = await Supplier.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${keyword}%` } },
          { email: { [Op.like]: `%${keyword}%` } },
          { phone: { [Op.like]: `%${keyword}%` } },
          { id: isNaN(keyword) ? null : parseInt(keyword) },
        ],
      },
    });

    res.json({
      success: true,
      data: supplier,
    });
  } catch (err) {
    next(err);
  }
};
