// const { Product, Category, CapitalPriceProduct } = require("../models");
const { Op, fn, literal, col } = require("sequelize");
const ProductCategoryNew = require("../models/productCategoryNew");
const { jakartaIds } = require("../utils/helpers");
const Products = require("../models/products");
const CapitalPriceProducts = require("../models/capitalPriceProducts");
const PurchaseOrder = require("../models/purchaseOrder");
const ProductAttributeTo = require("../models/productAttributeTo");
const ProductAttribute = require("../models/productAttribute");
const ProductAttributePivot = require("../models/productAttributePivot");
const Supplier = require("../models/supplier");
const { sequelize } = require("../models");

exports.productAttribute = async (req, res, next) => {
  const { type } = req.query;

  try {
    let result = await ProductAttribute.findAll({
      attributes: ["id", "name", "type", "alias"],
      where: { type: type },
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.productCategoryNew = async (req, res, next) => {
  try {
    let result = await ProductCategoryNew.findAll({
      attributes: ["id", "name", "code"],
      where: { last_child: 1 },
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.catalogue = async (req, res, next) => {
  try {
    const {
      type,
      main_filter,
      keyword,
      category_id,
      variant_id,
      page = 1,
      per_page = 10,
      min_price,
      max_price,
      product_type,
      occasion,
      stock,
      province,
      city,
    } = req.query;

    const limit = Math.max(1, parseInt(per_page, 10) || 10);
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const offset = (pageNum - 1) * limit;

    const baseWhere = { customer_app: { [Op.ne]: "1" } };

    // date window for top lists
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);

    // 1) build base filters
    const buildBaseWhere = () => {
      const where = { ...baseWhere };

      if (keyword) {
        where[Op.or] = [
          { name: { [Op.like]: `%${keyword}%` } },
          { product_code: { [Op.like]: `%${keyword}%` } },
        ];
      }

      if (min_price || max_price) {
        where.price = {};
        if (min_price) where.price[Op.gte] = parseInt(min_price, 10);
        if (max_price) where.price[Op.lte] = parseInt(max_price, 10);
      }

      if (province) where.province = province;
      if (city) where.city = city;
      if (product_type) where.product_type = product_type;
      if (category_id) where.category_id = category_id;

      const [stockOp, stockVal] = stock?.split(",") || [];
      if (stockOp && stockVal) {
        if (stockOp === "empty") where.qty = { [Op.eq]: stockVal };
        else if (stockOp === "available") where.qty = { [Op.gte]: stockVal };
        else if (stockOp === "low") where.qty = { [Op.lte]: stockVal };
      }

      return where;
    };

    const baseQueryWhere = buildBaseWhere();

    // 2) precompute top lists (capped at 100 each) - lightweight
    const [topNewIds, topBestIds] = await Promise.all([
      Products.findAll({
        where: {
          ...baseWhere,
          created_at: { [Op.between]: [oneMonthAgo, now] },
        },
        attributes: ["id"],
        order: [["created_at", "DESC"]],
        limit: 100,
        raw: true,
      }).then((rows) => rows.map((r) => r.id)),

      PurchaseOrder.findAll({
        where: { created_at: { [Op.between]: [oneMonthAgo, now] } },
        attributes: ["product_id", [fn("SUM", col("qty")), "totalQty"]],
        group: ["product_id"],
        order: [[literal("totalQty"), "DESC"]],
        limit: 100,
        raw: true,
      }).then((rows) => rows.map((r) => r.product_id)),
    ]);

    // 3) type-specific constraints, merged into idFilter (used for counting and id selection)
    const idFilter = { ...baseQueryWhere };
    if (type === "new-arrival") {
      idFilter.created_at = { [Op.between]: [oneMonthAgo, now] };
    } else if (type === "best-seller") {
      if (topBestIds.length) idFilter.id = { [Op.in]: topBestIds };
      else idFilter.id = { [Op.in]: [] }; // no results
    } else if (type === "other") {
      const excludeIds = Array.from(
        new Set([...(topNewIds || []), ...(topBestIds || [])])
      );
      if (excludeIds.length) idFilter.id = { [Op.notIn]: excludeIds };
      // if excludeIds empty, don't touch idFilter
    }

    // 4) prepare attribute includes for strict AND logic (occasion + variant)
    // NOTE: associations for ProductAttribute must exist with aliases: occasionAttribute, variantAttribute
    const attributeInclude = [];
    if (occasion) {
      attributeInclude.push({
        model: ProductAttribute,
        as: "occasionAttribute",
        through: { attributes: [] },
        required: true,
        attributes: [],
        where: { id: occasion },
      });
    }
    if (variant_id) {
      attributeInclude.push({
        model: ProductAttribute,
        as: "variantAttribute",
        through: { attributes: [] },
        required: true,
        attributes: [],
        where: { id: variant_id },
      });
    }

    // 5) build ORDER safely
    const parseMainFilter = (mf) => {
      if (!mf) return null;
      const parts = mf.split(",").map((p) => p.trim());
      if (parts.length !== 2) return null;
      const allowed = new Set(["id", "price", "created_at", "name", "qty"]);
      if (!allowed.has(parts[0])) return null;
      const direction = parts[1].toUpperCase() === "DESC" ? "DESC" : "ASC";
      return [parts[0], direction];
    };
    const orderPair =
      parseMainFilter(main_filter) ||
      (type === "new-arrival" ? ["created_at", "DESC"] : ["id", "ASC"]);
    const order = [orderPair];

    // 6) COUNT that matches exactly the same filters (including attribute includes)
    // Use COUNT DISTINCT so join duplicates do not inflate count
    const totalCount = await Products.count({
      where: idFilter,
      include: attributeInclude.length ? attributeInclude : [],
      distinct: true,
      col: "id",
    });

    // If totalCount is zero, return early with empty data and correct meta
    if (!totalCount) {
      return res.json({
        success: true,
        data: [],
        meta: {
          page: pageNum,
          per_page: limit,
          total: 0,
          total_pages: 0,
        },
      });
    }

    // 7) Get all matching IDs (no pagination) when attribute filter exists, otherwise do an id-only paged query
    // We avoid fetching ALL IDs when dataset is huge by doing two strategies:
    // - If attributeInclude present: fetch DISTINCT matching IDs (no limit) but only ids (to compute total & slice)
    // - If no attributeInclude: do id-only paged query (fast)
    let allMatchingIds = null;
    if (attributeInclude.length) {
      // fetch distinct product ids that satisfy idFilter + attribute includes
      const idRowsAll = await Products.findAll({
        where: idFilter,
        attributes: ["id"],
        include: attributeInclude,
        subQuery: false,
        raw: true,
        group: ["Products.id"],
      });
      allMatchingIds = idRowsAll.map((r) => r.id);
      // totalCount should match allMatchingIds.length (sanity)
      // but we already have totalCount above via COUNT DISTINCT
    }

    // 8) Determine pageIds
    let pageIds = [];
    if (allMatchingIds) {
      const start = offset;
      pageIds = allMatchingIds.slice(start, start + limit);
    } else {
      // no attribute filtering that requires prefetching all IDs, do fast id-only paged query
      const idRows = await Products.findAll({
        where: idFilter,
        attributes: ["id"],
        order,
        limit,
        offset,
        subQuery: false,
        raw: true,
      });
      pageIds = idRows.map((r) => r.id);
    }

    // if no ids on this page, respond empty but keep correct meta
    if (!pageIds.length) {
      return res.json({
        success: true,
        data: [],
        meta: {
          page: pageNum,
          per_page: limit,
          total: totalCount,
          total_pages: Math.ceil(totalCount / limit),
        },
      });
    }

    // 9) Hydrate selected IDs with includes (small set equals page size)
    const includesForHydrate = [
      {
        model: ProductCategoryNew,
        as: "productCategoryNewData",
        attributes: ["id", "name", "level"],
        required: false,
      },
    ];
    if (occasion) {
      includesForHydrate.push({
        model: ProductAttribute,
        as: "occasionAttribute",
        through: { attributes: [] },
        required: !!occasion,
        attributes: ["id", "name"],
        where: { id: occasion },
      });
    }
    if (variant_id) {
      includesForHydrate.push({
        model: ProductAttribute,
        as: "variantAttribute",
        through: { attributes: [] },
        required: !!variant_id,
        attributes: ["id", "name"],
        where: { id: variant_id },
      });
    }

    // Keep original page order by using FIELD on IDs
    const rows = await Products.findAll({
      where: { id: { [Op.in]: pageIds } },
      include: includesForHydrate,
      order: [[literal(`FIELD(Products.id, ${pageIds.join(",")})`), "ASC"]],
    });

    return res.json({
      success: true,
      data: rows,
      meta: {
        page: pageNum,
        per_page: limit,
        total: totalCount,
        total_pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// exports.catalogue = async (req, res, next) => {
//   try {
//     const {
//       type,
//       main_filter,
//       keyword,
//       category_id,
//       variant_id,
//       page = 1,
//       per_page = 10,
//       min_price,
//       max_price,
//       product_type,
//       occasion,
//       stock,
//       province,
//       city,
//     } = req.query;

//     const limit = parseInt(per_page);
//     const offset = (parseInt(page) - 1) * limit;

//     const baseWhere = { customer_app: { [Op.ne]: "1" } };
//     let baseWhereProductCategory = {};

//     const now = new Date();
//     const oneMonthAgo = new Date();
//     oneMonthAgo.setMonth(now.getMonth() - 1);

//     // buildWhereFromQuery is async because of product_type lookup
//     const buildWhereFromQuery = async () => {
//       const where = { ...baseWhere };

//       if (keyword) {
//         where[Op.or] = [
//           { name: { [Op.like]: `%${keyword}%` } },
//           { product_code: { [Op.like]: `%${keyword}%` } },
//         ];
//       }

//       if (min_price || max_price) {
//         where.price = {};
//         if (min_price) where.price[Op.gte] = parseInt(min_price);
//         if (max_price) where.price[Op.lte] = parseInt(max_price);
//       }

//       if (province) where.province = province;
//       if (city) where.city = city;
//       // new filter
//       if (product_type) where.product_type = product_type;
//       if (category_id) where.category_id = category_id;

//       const [stockOp, stockVal] = stock?.split(",") || [];
//       if (stockOp && stockVal) {
//         if (stockOp == "empty") where.qty = { [Op.eq]: stockVal };
//         else if (stockOp == "available") where.qty = { [Op.gte]: stockVal };
//         else if (stockOp == "low") where.qty = { [Op.lte]: stockVal };
//       }

//       return where;
//     };

//     // top-100 helpers
//     const getTopNewArrivalIds = async () => {
//       const rows = await Products.findAll({
//         where: {
//           ...baseWhere,
//           created_at: { [Op.between]: [oneMonthAgo, now] },
//         },
//         attributes: ["id"],
//         order: [["created_at", "DESC"]],
//         limit: 100,
//         raw: true,
//       });
//       return rows.map((r) => r.id);
//     };

//     const getTopBestSellerIds = async () => {
//       const rows = await PurchaseOrder.findAll({
//         where: { created_at: { [Op.between]: [oneMonthAgo, now] } },
//         attributes: ["product_id", [fn("SUM", col("qty")), "totalQty"]],
//         group: ["product_id"],
//         order: [[literal("totalQty"), "DESC"]],
//         limit: 100,
//         raw: true,
//       });
//       return rows.map((r) => r.product_id);
//     };

//     // precompute top lists
//     const [topNewIds, topBestIds] = await Promise.all([
//       getTopNewArrivalIds(),
//       getTopBestSellerIds(),
//     ]);

//     // build where (await!)
//     const where = await buildWhereFromQuery();

//     if (type === "new-arrival") {
//       where.created_at = { [Op.between]: [oneMonthAgo, now] };
//     } else if (type === "best-seller") {
//       if (topBestIds.length) {
//         where.id = { [Op.in]: topBestIds };
//       }
//     }

//     if (type === "other") {
//       const excludeIds = Array.from(
//         new Set([...(topNewIds || []), ...(topBestIds || [])])
//       );
//       if (excludeIds.length > 0) {
//         where.id = { [Op.notIn]: excludeIds };
//       }
//     }
//     // else if (type === "other") {
//     //   const excludeIds = Array.from(
//     //     new Set([...(topNewIds || []), ...(topBestIds || [])])
//     //   );
//     //   if (excludeIds.length > 0) where.id = { [Op.notIn]: excludeIds };
//     // }

//     // includes
//     const include = [
//       {
//         model: ProductCategoryNew,
//         as: "productCategoryNewData",
//         attributes: ["id", "name", "level"],
//         where: baseWhereProductCategory,
//       },
//     ];

//     if (occasion || variant_id) {
//       if (occasion) {
//         include.push({
//           model: ProductAttribute,
//           as: "occasionAttribute", // custom alias
//           required: true,
//           through: { attributes: [] },
//           attributes: ["id", "name"],
//           where: { id: occasion },
//         });
//       }

//       // Variant filter
//       if (variant_id) {
//         include.push({
//           model: ProductAttribute,
//           as: "variantAttribute", // different alias to avoid conflict with occasionAttribute
//           required: true,
//           through: { attributes: [] },
//           attributes: ["id", "name"],
//           where: { id: variant_id },
//         });
//       }
//     }

//     // ORDER: implement main_filter safely
//     // expected format: column,direction  e.g. "price,ASC" or "created_at,DESC"
//     // sanitize and apply, but respect type-specific ordering for new-arrival and best-seller
//     let order = [["id", "ASC"]];

//     const parseMainFilter = (mf) => {
//       if (!mf) return null;
//       const parts = mf.split(",").map((p) => p.trim());
//       if (parts.length !== 2) return null;
//       const [colName, dir] = parts;
//       const direction = dir.toUpperCase() === "DESC" ? "DESC" : "ASC";
//       // whitelist simple column names to avoid SQL injection
//       const allowed = new Set(["id", "price", "created_at", "name", "qty"]);
//       if (!allowed.has(colName)) return null;
//       return [colName, direction];
//     };

//     const mainFilterOrder = parseMainFilter(main_filter);

//     if (mainFilterOrder) {
//       // always respect main_filter if provided
//       order = [mainFilterOrder];
//     } else {
//       // fallback defaults
//       if (type === "new-arrival") {
//         order = [["created_at", "DESC"]];
//       } else if (type === "best-seller") {
//         // best-seller is pre-ranked by topBestIds, so DB order doesn’t matter
//         order = [["id", "ASC"]];
//       }
//     }

//     // query
//     const rows = await Products.findAll({
//       where,
//       include,
//       order,
//       limit,
//       offset,
//     });

//     const totalCount = await Products.count({
//       where,
//       include,
//       distinct: true,
//       col: "id",
//     });

//     return res.json({
//       success: true,
//       data: rows,
//       meta: {
//         page: parseInt(page),
//         per_page: limit,
//         total: totalCount,
//         total_pages: Math.ceil(totalCount / limit),
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };

exports.detail = async (req, res, next) => {
  try {
    const users = await Products.findOne({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

exports.search = async (req, res, next) => {
  try {
    const { province, city, keyword, id } = req.query;

    // Base query with eager loading
    let productQuery = {
      where: {
        customer_app: { [Op.ne]: "1" },
      },
      include: [
        {
          model: ProductCategoryNew,
          as: "productCategoryNewData",
          attributes: ["id", "name", "level"],
        },
      ],
      order: [
        ["id", "ASC"],
        ["product_code", "ASC"],
        ["name", "ASC"],
      ],
    };

    // Province/city logic
    if (province) {
      if (
        parseInt(province) === 1642907 &&
        (!city || city === "" || city === "null")
      ) {
        productQuery.where.city = { [Op.in]: jakartaIds() };
      } else {
        productQuery.where.city = city;
      }
    }

    // Search logic (assuming full-text or partial match)
    if (keyword && keyword !== "" && keyword !== "null") {
      productQuery.where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { product_code: { [Op.like]: `%${keyword}%` } },
      ];
    }

    if (id && id !== "" && id !== "null") {
      productQuery.where.id = id;
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const products = await Products.findAndCountAll({
      ...productQuery,
      limit,
      offset,
    });

    // Transform prices
    const transformedProducts = products.rows.map((product) => {
      product = product.toJSON();
      product.selling_price = product.price;
      product.price = Math.round((100 / 55) * product.capital_price);
      return product;
    });

    // Additional products from capital price table
    const capProducts = await CapitalPriceProducts.findAll({
      where: { city_id: city },
      attributes: ["product_code", "capital_price"],
    });

    const priceMap = {};
    capProducts.forEach((p) => {
      priceMap[p.product_code] = p.capital_price;
    });

    const additionalProducts = await Products.findAll({
      where: {
        product_code: {
          [Op.in]: capProducts.map((p) => p.product_code),
        },
      },
      include: [
        {
          model: ProductCategoryNew,
          as: "productCategoryNewData",
          attributes: ["id", "name", "level"],
        },
      ],
    });

    const enrichedAdditional = additionalProducts.map((item) => {
      item = item.toJSON();
      const price = priceMap[item.product_code] || 0;
      item.city = city;
      item.province = province;
      item.selling_price = req.query.price;
      item.price = Math.round((100 / 55) * price);
      return item;
    });

    // Merge if last page
    const lastPage = Math.ceil(products.count / limit);
    const merged =
      page === lastPage
        ? [...transformedProducts, ...enrichedAdditional]
        : transformedProducts;

    const total =
      products.count + (page === lastPage ? enrichedAdditional.length : 0);

    return res.json({
      success: true,
      data: merged,
      meta: {
        page: page,
        total_pages: Math.ceil(total / limit),
        total,
        per_page: limit,
      },
    });
  } catch (error) {
    next(error);
  }
};
