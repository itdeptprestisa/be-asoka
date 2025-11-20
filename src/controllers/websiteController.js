const Website = require("../models/website");

exports.list = async (req, res, next) => {
  try {
    const websites = await Website.findAll();

    res.json({
      success: true,
      data: websites,
    });
  } catch (err) {
    next(err);
  }
};
