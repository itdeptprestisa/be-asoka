import { Request, Response, NextFunction } from "express";
import dataSource from "../config/dataSource";
import { ProductAttribute } from "../entities/ProductAttribute";
import { ProductCategoryNew } from "../entities/ProductCategoryNew";
import { Products } from "../entities/Products";
import { PurchaseOrder } from "../entities/PurchaseOrder";
import {
  Between,
  Equal,
  ILike,
  In,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Not,
} from "typeorm";
import { CapitalPriceProducts } from "../entities/CapitalPriceProducts";
import { jakartaIds } from "../utils";

export const detail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await Products.findOne({
      where: {
        id: parseInt(req.params.id),
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

export const search = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { province, city, keyword, id } = req.query;

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const ProductsRepository = dataSource.getRepository(Products);
    const CapitalPriceProductsRepository =
      dataSource.getRepository(CapitalPriceProducts);

    // --- Build base OR-able where blocks (to replicate Sequelize Op.or) ---
    const base: any = { customer_app: Not("1") };
    const where: any[] = [];

    // Keyword OR on name/product_code
    const isValidKeyword = !!keyword && keyword !== "null" && keyword !== "";
    if (isValidKeyword) {
      where.push(
        { ...base, name: ILike(`%${keyword}%`) },
        { ...base, product_code: ILike(`%${keyword}%`) }
      );
    } else {
      where.push({ ...base });
    }

    // Province/city logic (apply to each OR block)
    if (province) {
      const provId = parseInt(province as string, 10);
      const cityFilter =
        provId === 1642907 && (!city || city === "" || city === "null")
          ? In(jakartaIds())
          : city;

      // Only apply city filter if it’s valid; otherwise leave it out
      if (cityFilter) {
        where.forEach((w) => (w.city = cityFilter));
      }
    }

    // ID filter
    if (id && id !== "null" && id !== "") {
      const parsedId = parseInt(id as string, 10);
      if (!isNaN(parsedId)) {
        where.forEach((w) => (w.id = parsedId));
      }
    }

    // --- Query with relations and pagination ---
    const [products, count] = await ProductsRepository.findAndCount({
      where, // array => OR
      relations: ["productCategoryNewData"],
      order: {
        id: "ASC",
        product_code: "ASC",
        name: "ASC",
      },
      take: limit,
      skip: offset,
    });

    // Transform prices (mirror Sequelize)
    const transformedProducts = products.map((product) => {
      const selling_price = product.price;
      const price = Math.round((100 / 55) * product.capital_price);
      return {
        ...product,
        selling_price,
        price,
      };
    });

    // --- Capital price enrichment (guard invalid city) ---
    const cityId = parseInt(city as string, 10);
    const capProducts =
      !isNaN(cityId) && city !== "" && city !== "null"
        ? await CapitalPriceProductsRepository.find({
            where: { city_id: cityId },
            select: ["product_code", "capital_price"],
          })
        : [];

    const priceMap = Object.fromEntries(
      capProducts.map((p) => [p.product_code, p.capital_price])
    );

    const additionalProducts = capProducts.length
      ? await ProductsRepository.find({
          where: { product_code: In(capProducts.map((p) => p.product_code)) },
          relations: ["productCategoryNewData"],
        })
      : [];

    const enrichedAdditional = additionalProducts.map((item) => {
      const capital = priceMap[item.product_code] || 0;
      return {
        ...item,
        city,
        province,
        selling_price: req.query.price,
        price: Math.round((100 / 55) * capital),
      };
    });

    // Merge on last page
    const lastPage = Math.ceil(count / limit);
    const merged =
      page === lastPage
        ? [...transformedProducts, ...enrichedAdditional]
        : transformedProducts;

    const total = count + (page === lastPage ? enrichedAdditional.length : 0);

    return res.json({
      success: true,
      data: merged,
      meta: {
        page,
        total_pages: Math.ceil(total / limit),
        total,
        per_page: limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const catalogue = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
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

    const ProductsRepository = dataSource.getRepository(Products);
    const PurchaseOrdersRepository = dataSource.getRepository(PurchaseOrder);

    const limit = Math.max(1, parseInt(per_page as string, 10) || 10);
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const offset = (pageNum - 1) * limit;

    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);

    // 1) Build base filters
    const baseWhere: any = { customer_app: Not("1") };

    if (keyword) {
      baseWhere.name = Like(`%${keyword}%`);
    }

    if (min_price || max_price) {
      baseWhere.price = {};
      if (min_price)
        baseWhere.price = MoreThanOrEqual(parseInt(min_price as string, 10));
      if (max_price)
        baseWhere.price = LessThanOrEqual(parseInt(max_price as string, 10));
    }

    if (province) baseWhere.province = Equal(province);
    if (city) baseWhere.city = Equal(city);
    if (product_type) baseWhere.product_type = Equal(product_type);
    if (category_id) baseWhere.category_id = Equal(category_id);

    if (stock) {
      const [stockOp, stockVal] = (stock as string).split(",");
      const val = parseInt(stockVal, 10);
      if (stockOp === "empty") baseWhere.qty = Equal(val);
      else if (stockOp === "available") baseWhere.qty = MoreThanOrEqual(val);
      else if (stockOp === "low") baseWhere.qty = LessThanOrEqual(val);
    }

    // 2) Precompute top lists
    const [topNewIds, topBestIds] = await Promise.all([
      ProductsRepository.find({
        where: {
          customer_app: Not(1),
          created_at: Between(oneMonthAgo, now),
        },
        select: ["id"],
        order: { created_at: "DESC" },
        take: 100,
      }).then((rows) => rows.map((r) => r.id)),

      PurchaseOrdersRepository.createQueryBuilder("po")
        .select("po.product_id", "product_id")
        .addSelect("SUM(po.qty)", "totalQty")
        .where("po.created_at BETWEEN :start AND :end", {
          start: oneMonthAgo,
          end: now,
        })
        .groupBy("po.product_id")
        .orderBy("totalQty", "DESC")
        .limit(100)
        .getRawMany()
        .then((rows) => rows.map((r) => r.product_id)),
    ]);

    // 3) Type-specific constraints
    const idFilter: any = { ...baseWhere };
    if (type === "new-arrival") {
      idFilter.created_at = Between(oneMonthAgo, now);
    } else if (type === "best-seller") {
      idFilter.id = topBestIds.length ? In(topBestIds) : In([]);
    } else if (type === "other") {
      const excludeIds = Array.from(new Set([...topNewIds, ...topBestIds]));
      if (excludeIds.length) idFilter.id = Not(In(excludeIds));
    }

    // 4) Attribute filters
    const attributeFilters = [];
    if (occasion) {
      attributeFilters.push({
        relation: "occasionAttribute",
        id: parseInt(occasion as string, 10),
      });
    }
    if (variant_id) {
      attributeFilters.push({
        relation: "variantAttribute",
        id: parseInt(variant_id as string, 10),
      });
    }

    // 5) Order parsing
    const parseMainFilter = (
      mf: string | undefined
    ): [string, "ASC" | "DESC"] => {
      if (!mf) return ["id", "ASC"];
      const [field, dir] = mf.split(",");
      const allowed = ["id", "price", "created_at", "name", "qty"];
      if (!allowed.includes(field)) return ["id", "ASC"];
      return [field, dir?.toUpperCase() === "DESC" ? "DESC" : "ASC"];
    };
    const orderPair = parseMainFilter(main_filter as string);
    const order = { [orderPair[0]]: orderPair[1] };

    // 6) Count total
    const totalCount = await ProductsRepository.count({
      where: idFilter,
    });

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

    // 7) Fetch paged IDs
    const pagedIds = await ProductsRepository.find({
      where: idFilter,
      select: ["id"],
      order,
      skip: offset,
      take: limit,
    }).then((rows) => rows.map((r) => r.id));

    if (!pagedIds.length) {
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

    // 8) Hydrate products
    const hydratedProducts = await ProductsRepository.find({
      where: { id: In(pagedIds) },
      relations: {
        productCategoryNewData: true,
        occasionAttribute: occasion ? true : false,
        variantAttribute: variant_id ? true : false,
      },
      order: { id: "ASC" },
    });

    return res.json({
      success: true,
      data: hydratedProducts,
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

export const productAttribute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { type } = req.query;
  const ProductAttributesRepository =
    dataSource.getRepository(ProductAttribute);

  try {
    const result = await ProductAttributesRepository.find({
      select: ["id", "name", "type", "alias"],
      where: { type: type?.toString() },
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const productCategoryNew = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ProductCategoryNewRepository =
    dataSource.getRepository(ProductCategoryNew);

  try {
    const result = await ProductCategoryNewRepository.find({
      select: ["id", "name", "code"],
      where: { last_child: 1 },
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
