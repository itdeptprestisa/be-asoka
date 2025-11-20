const { Op } = require("sequelize");
const Geo = require("../models/geo");

exports.search = async (req, res, next) => {
  const query = req.query;
  let result = [];

  try {
    if (query.keyword == "country") {
      result = await Geo.findAll({
        where: {
          [Op.and]: [{ parent_id: null }, { depth: 0 }, { level: "PCLI" }],
        },
      });
    } else {
      result = await Geo.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${query.keyword}%` } },
            { parent_id: { [Op.eq]: query.keyword ? query.keyword : 1643084 } },
            // { id: isNaN(query.keyword) ? null : parseInt(query.keyword) },
          ],
        },
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
