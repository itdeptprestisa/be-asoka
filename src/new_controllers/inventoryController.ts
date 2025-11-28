import { Request, Response, NextFunction } from "express";
import dataSource from "../config/dataSource";
import { Supplier } from "../entities/Supplier";
import { Between, Equal, FindOptionsOrder, ILike, In, Not } from "typeorm";
import { Products } from "../entities/Products";
import { PurchaseOrder } from "../entities/PurchaseOrder";
import { InventorySpk } from "../entities/InventorySpk";
import { InventorySpkProduct } from "../entities/InventorySpkProduct";
import { ProductStockEvent } from "../entities/ProductStockEvent";
import { uploadGoodReceipt } from "../utils/spk/goodReceipt";
import { Logs } from "../entities/Logs";
import { InventoryGoodReceived } from "../entities/InventoryGoodReceived";

export const searchSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { keyword } = req.query;

  try {
    const keywordStr = keyword?.toString().trim();
    const eventSupplierIds = await dataSource
      .getRepository("ProductSupplierEvent")
      .find({ select: ["supplier_id"] });

    const supplierIds = eventSupplierIds.map((e) => e.supplier_id);
    const filters = [];

    if (keywordStr) {
      filters.push({ name: ILike(`%${keywordStr}%`) });
      filters.push({ email: ILike(`%${keywordStr}%`) });
      filters.push({ phone: ILike(`%${keywordStr}%`) });
      if (!isNaN(Number(keywordStr))) filters.push({ id: Number(keywordStr) });
    }

    const supplier = await dataSource.getRepository(Supplier).find({
      where: [
        ...(filters.length
          ? filters.map((f) => ({ ...f, id: In(supplierIds) }))
          : [{ id: In(supplierIds) }]),
      ],
      take: 10,
    });

    return res.json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
};

export const searchProductEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { keyword, product_id } = req.query;

  try {
    const keywordStr = keyword?.toString().trim();
    const productIdNum = product_id ? Number(product_id) : null;

    // Ambil semua product_id yang ada di event
    let eventProductIdsQuery: any = {};

    // Jika product_id disediakan → filter langsung di event table
    if (productIdNum) {
      eventProductIdsQuery.where = { product_id: productIdNum };
    }

    const eventProductIds = await dataSource
      .getRepository("ProductSupplierEvent")
      .find({
        select: ["product_id"],
        ...eventProductIdsQuery,
      });

    // Jika tidak ada event untuk product_id tertentu
    if (eventProductIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const productIds = eventProductIds.map((e) => e.product_id);

    const filters = [];

    if (keywordStr) {
      filters.push({ name: ILike(`%${keywordStr}%`) });
      if (!isNaN(Number(keywordStr))) filters.push({ id: Number(keywordStr) });
    }

    const products = await dataSource.getRepository(Products).find({
      where: [
        ...(filters.length
          ? filters.map((f) => ({ ...f, id: In(productIds) }))
          : [{ id: In(productIds) }]),
      ],
      take: 10,
    });

    return res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
};

export const searchPo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { input } = req.query;
    if (!input) return res.json({ success: false, message: "Input required" });

    let poId: number | null = null;

    const inputStr = input.toString().trim();

    if (inputStr.includes("#")) {
      // format: xxxx#poId
      const parts = inputStr.split("#");
      poId = Number(parts[1]);
    } else if (!isNaN(Number(inputStr))) {
      poId = Number(inputStr);
    }

    if (!poId) return res.json({ success: false, message: "Invalid input" });

    const purchaseOrders = await dataSource
      .getRepository(PurchaseOrder)
      .createQueryBuilder("po")
      .innerJoinAndSelect("po.product", "product")
      .innerJoinAndSelect("po.orderData", "orderData")
      .innerJoinAndSelect("po.orderItemsData", "orderItemsData")
      .where("po.id = :poId", { poId })
      .andWhere("product.supplier_type = :supplier_type", { supplier_type: 4 })
      // .andWhere("product.product_type = :product_type", { product_type: 2 })
      .andWhere("orderItemsData.product_type = :product_type", { product_type: 2 })
      .andWhere("po.status IN (:...statuses)", {
        statuses: ["pending"],
      })
      .getMany();

    return res.json({
      success: true,
      data: purchaseOrders.map(po => ({
        ...po,
        po_number: `${po.orderData.order_number}#${po.id}`,
      }))
    });
  } catch (err) {
    next(err);
  }
};

export const listSpk = async (req: any, res: Response, next: NextFunction) => {
  try {
    const {
      date_from = "",
      date_to = "",
      status = "",
      search = "",
      page = "1",
      per_page = "10",
      sort_by = "created_at",
      sort_dir = "ASC",
    } = req.query;

    const userId = req.user.userId;

    const where: any = {};

    // Date range
    if (date_from && date_to) {
      where.created_at = Between(
        new Date(`${date_from}T00:00:00`),
        new Date(`${date_to}T23:59:59`)
      );
    }

    if (status) where.status = Equal(status);

    // Flexible search
    const searchFilters: any[] = [];
    if (search) {
      const s = search.toString();
      searchFilters.push({ order_number: ILike(`%${s}%`) });
      searchFilters.push({ customer_id: ILike(`%${s}%`) });
    }

    const limit = parseInt(per_page as string, 10);
    const offset = (parseInt(page as string, 10) - 1) * limit;

    const allowedSortFields = [
      "id",
      "created_at",
      "updated_at",
    ];

    const sortField = allowedSortFields.includes(sort_by as string)
      ? sort_by
      : "created_at";
    const sortDirection = sort_dir.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const order: any[] = [];

    const [spk, total] = await dataSource.getRepository(InventorySpk).findAndCount({
      where: search
        ? [
          { ...where, order_number: ILike(`%${search}%`) },
          { ...where, customer_id: ILike(`%${search}%`) },
        ]
        : where,
      relations: {
        suppliers: true,
        poData: {
          orderData: true
        },
        goodReceived: true,
      },
      order: {
        [sortField]: sortDirection,
      },
      take: limit,
      skip: offset,
    });

    const data = spk.map((o) => {

      return {
        ...o,
      };
    });

    return res.json({
      success: true,
      data,
      meta: {
        total,
        page: parseInt(page as string),
        per_page: limit,
        total_pages: Math.ceil(total / limit),
        sort_by: sortField,
        sort_dir: sortDirection,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSpkDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid SPK ID" });
    }

    const spk = await dataSource
      .getRepository(InventorySpk)
      .createQueryBuilder("spk")
      .leftJoinAndSelect("spk.suppliers", "supplier")
      .where("spk.id = :id", { id })
      .getOne();

    if (!spk) {
      return res.status(404).json({ success: false, message: "SPK not found" });
    }

    const spkProducts = await dataSource
      .getRepository(InventorySpkProduct)
      .createQueryBuilder("spkp")
      .leftJoinAndSelect("spkp.productsData", "product")
      .where("spkp.spk_id = :id", { id })
      .getMany();

    const grRaw = await dataSource
      .getRepository(InventoryGoodReceived)
      .createQueryBuilder("gr")
      .select("gr.spk_product_id", "spk_product_id")
      .addSelect("SUM(gr.qty)", "total_qty")
      .where("gr.spk_id = :spk_id", { spk_id: id })
      .groupBy("gr.spk_product_id")
      .getRawMany();

    const grMap = new Map<number, number>();
    grRaw.forEach((r) => {
      grMap.set(Number(r.spk_product_id), Number(r.total_qty));
    });

    const formattedProducts = spkProducts.map((item) => {
      const total_received_qty = grMap.get(item.id) || 0;
      return {
        ...item,
        total_received_qty,
        is_complete: total_received_qty >= Number(item.qty),
      };
    });

    const spk_is_complete = formattedProducts.every((p) => p.is_complete);

    const po = spk.po_id
      ? await dataSource
          .getRepository(PurchaseOrder)
          .createQueryBuilder("po")
          .leftJoinAndSelect("po.orderData", "orderData")
          .where("po.id = :id", { id: spk.po_id })
          .getOne()
      : null;

    return res.json({
      success: true,
      data: {
        ...spk,
        inventoryProductData: formattedProducts,
        spk_is_complete,
        po: po
          ? {
              ...po,
              po_number: `${po.orderData.order_number}#${po.id}`,
            }
          : null,
      },
    });

  } catch (error) {
    next(error);
  }
};

export const stockMonitoring = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      date_from = "",
      date_to = "",
      status = "",
      search = "",
      page = "1",
      per_page = "10",
      sort_by = "created_at",
      sort_dir = "ASC",
    } = req.query;

    // Base condition
    const where: any = { supplier_type: 4 };

    // Date range
    if (date_from && date_to) {
      where.created_at = Between(
        new Date(`${date_from}T00:00:00`),
        new Date(`${date_to}T23:59:59`)
      );
    }

    // Optional: status filter (kalau ada field status di product)
    if (status) where.status = Equal(status);

    // Flexible search
    const searchFilters: any[] = [];
    if (search) {
      const s = search.toString();
      searchFilters.push({ name: ILike(`%${s}%`) });
    }

    // Pagination
    const limit = parseInt(per_page as string, 10);
    const offset = (parseInt(page as string, 10) - 1) * limit;

    // Sorting
    const allowedSortFields = ["id", "created_at", "updated_at", "name", "sku"];
    const sortField = allowedSortFields.includes(sort_by as string)
      ? sort_by
      : "created_at";
    const sortDirection =
      (sort_dir?.toString().toUpperCase() === "ASC" ? "ASC" : "DESC") as
      | "ASC"
      | "DESC";

    const order: FindOptionsOrder<Products> = {
      [sortField as keyof Products]: sortDirection,
    };

    // Query
    const [products, total] = await dataSource
      .getRepository(Products)
      .findAndCount({
        where: searchFilters.length
          ? searchFilters.map((filter) => ({ ...filter, supplier_type: 4 }))
          : where,
        order,
        take: limit,
        skip: offset,
      });

    // Optional mapping
    const data = products.map((p) => ({
      id: p.id,
      name: p.name,
      product_code: p.product_code,
      stock_display: p.stock_display,
      stock_physical: p.stock_physical,
      supplier_type: p.supplier_type,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));

    return res.json({
      success: true,
      data,
      meta: {
        total,
        page: parseInt(page as string),
        per_page: limit,
        total_pages: Math.ceil(total / limit),
        sort_by: sortField,
        sort_dir: sortDirection,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const stockMonitoringByProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // const productId = parseInt(req.params.product_id, 10);
    const page = parseInt(req.query.page as string, 10) || 1;
    const perPage = parseInt(req.query.per_page as string, 10) || 10;

    // if (!productId) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "product_id is required",
    //   });
    // }

    const qb = dataSource
      .getRepository(InventorySpkProduct)
      .createQueryBuilder("spk_product")
      .leftJoinAndSelect("spk_product.productsData", "product")
      .leftJoinAndSelect("spk_product.spkData", "spk")
      .leftJoinAndSelect("spk.suppliers", "supplier")
      // .where("spk_product.product_id = :productId", { productId })
      .orderBy("spk_product.created_at", "DESC");

    const [spkProducts, total] = await qb
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    const data = spkProducts.map((item) => ({
      id: item.id,
      qty: item.qty,
      product_id: item.product_id,
      price: item.price,
      total_price: item.total_price,
      receipt: item.receipt,
      created_at: item.created_at,
      product: item.productsData
        ? {
          id: item.productsData.id,
          name: item.productsData.name,
          stock_physical: item.productsData.stock_physical,
          product_code: item.productsData.product_code,
          product_type: item.productsData.product_type,
        }
        : null,
      spk: item.spkData
        ? {
          id: item.spkData.id,
          supplier_id: item.spkData.supplier_id,
          spk_number: item.spkData.spk_number,
          status: item.spkData.status,
          due_date: item.spkData.due_date,
          total: item.spkData.total,
          supplier: item.spkData.suppliers
            ? {
              id: item.spkData.suppliers.id,
              name: item.spkData.suppliers.name,
              phone: item.spkData.suppliers.phone,
              email: item.spkData.suppliers.email,
            }
            : null,
        }
        : null,
    }));

    const meta = {
      total,
      per_page: perPage,
      current_page: page,
      last_page: Math.ceil(total / perPage),
    };

    return res.json({
      success: true,
      data,
      meta,
    });
  } catch (error) {
    next(error);
  }
};

export const createSpk = async (req: Request, res: Response, next: NextFunction) => {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const {
      supplier_id,
      type = 1, // 1 = stock, 2 = preorder
      po_id,
      due_date,
      user_id,
      total_qty,
      total,
      status = "draft",
      products,
    } = req.body;

    if (!supplier_id) {
      return res.status(400).json({ success: false, message: "supplier_id is required" });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Products list is required and must contain at least one item",
      });
    }

    const spkRepo = queryRunner.manager.getRepository(InventorySpk);
    const spkProductRepo = queryRunner.manager.getRepository(InventorySpkProduct);

    const spk_number = await generateSpkNumber(type, supplier_id);


    const total_qty_calc = products.reduce(
      (acc: number, p: any) => acc + Number(p.qty || 0),
      0
    );

    const total_calc = products.reduce(
      (acc: number, p: any) => acc + (Number(p.qty || 0) * Number(p.price || 0)),
      0
    );

    // --- Create SPK ---
    const spk = spkRepo.create({
      spk_number,
      supplier_id,
      type,
      po_id,
      due_date,
      user_id,
      total_qty: total_qty_calc,
      total: total_calc,
      status,
    });
    await spkRepo.save(spk);

    // --- Create SPK Products ---
    const spkProducts = products.map((p: any) =>
      spkProductRepo.create({
        spk_id: spk.id,
        product_id: p.id,
        qty: p.qty,
        price: p.price,
        total_price: p.qty * p.price,
        receipt: p.receipt || null,
      })
    );

    await spkProductRepo.save(spkProducts);
    await queryRunner.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "SPK created successfully",
      data: {
        spk,
        products: spkProducts,
      },
    });
  } catch (error) {
    await queryRunner.rollbackTransaction();
    next(error);
  } finally {
    await queryRunner.release();
  }
};

async function generateSpkNumber(type: number, supplierId: number) {
  const prefix = type === 2 ? "P" : "S"; // 1=stock, 2=preorder
  const supplierCode = supplierId.toString().padStart(3, "0");

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");

  const start = new Date(`${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T00:00:00`);
  const end = new Date(`${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T23:59:59`);

  const countToday = await dataSource.getRepository(InventorySpk).count({
    where: {
      created_at: Between(start, end),
    },
  });

  const runningNumber = (countToday + 1).toString().padStart(4, "0");

  return `${prefix}-${supplierCode}-${dateStr}-${runningNumber}`;
}

export const updateSpkProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const spkProductId = parseInt(req.params.id, 10);
    const { qty, price } = req.body;

    if (!spkProductId) {
      return res.status(400).json({
        success: false,
        message: "spk_product_id is required",
      });
    }

    const spkProductRepo = dataSource.getRepository(InventorySpkProduct);
    const spkProduct = await spkProductRepo.findOne({
      where: { id: spkProductId },
      relations: ["spkData"],
    });

    if (!spkProduct) {
      return res.status(404).json({
        success: false,
        message: "SPK Product not found",
      });
    }

    if (!spkProduct.spkData || spkProduct.spkData.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "SPK cannot be edited because it is not in draft status",
      });
    }

    if (qty !== undefined) spkProduct.qty = qty;
    if (price !== undefined) spkProduct.price = price;
    spkProduct.total_price = spkProduct.qty * spkProduct.price;

    await spkProductRepo.save(spkProduct);

    // Recalculate SPK total
    const allProducts = await spkProductRepo.find({
      where: { spk_id: spkProduct.spk_id },
    });

    const total_qty = allProducts.reduce((acc, p) => acc + (p.qty || 0), 0);
    const total = allProducts.reduce((acc, p) => acc + (p.total_price || 0), 0);

    const spkRepo = dataSource.getRepository(InventorySpk);
    const spk = await spkRepo.findOneBy({ id: spkProduct.spk_id });
    if (spk) {
      spk.total = total;
      spk.total_qty = total_qty;
      await spkRepo.save(spk);
    }

    return res.json({
      success: true,
      message: "SPK Product updated successfully",
      data: {
        id: spkProduct.id,
        qty: spkProduct.qty,
        price: spkProduct.price,
        total_price: spkProduct.total_price,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const addSpkProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const spkId = parseInt(req.params.spk_id, 10);
    const { product_id, qty, price } = req.body;

    if (!spkId || !product_id || !qty || !price) {
      return res.status(400).json({
        success: false,
        message: "spk_id, product_id, qty, dan price wajib diisi",
      });
    }

    const spkRepo = dataSource.getRepository(InventorySpk);
    const spk = await spkRepo.findOne({
      where: { id: spkId },
    });

    if (!spk) {
      return res.status(404).json({
        success: false,
        message: "SPK tidak ditemukan",
      });
    }

    if (spk.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Hanya SPK dengan status draft yang bisa ditambahkan produk",
      });
    }

    const productRepo = dataSource.getRepository(Products);
    const product = await productRepo.findOne({
      where: {
        id: product_id,
        supplier_type: 4,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    const total_price = qty * price;

    const spkProductRepo = dataSource.getRepository(InventorySpkProduct);
    const spkProduct = spkProductRepo.create({
      spk_id: spkId,
      product_id,
      qty,
      price,
      total_price,
    });

    await spkProductRepo.save(spkProduct);

    // update total di SPK
    const totalSpk = await spkProductRepo
      .createQueryBuilder("spk_product")
      .select("SUM(spk_product.total_price)", "sum")
      .where("spk_product.spk_id = :spkId", { spkId })
      .getRawOne();

    spk.total = parseFloat(totalSpk.sum || 0);
    await spkRepo.save(spk);

    return res.json({
      success: true,
      message: "Produk berhasil ditambahkan ke SPK",
      data: {
        spk_id: spkId,
        product_id,
        qty,
        price,
        total_price,
        spk_total: spk.total,
      },
    });
  } catch (error) {
    next(error);
  }
}

export const stockMovementList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      product_id = "",
      supplier_id = "",
      page = "1",
      per_page = "10",
      sort_by = "created_at",
      sort_dir = "DESC",
    } = req.query;

    if (!product_id || !supplier_id) {
      return res.status(400).json({
        success: false,
        message: "product_id dan supplier_id wajib diisi",
      });
    }

    const productRepo = dataSource.getRepository(Products);
    const supplierRepo = dataSource.getRepository(Supplier);

    // Ambil single product & supplier
    const product = await productRepo.findOne({
      where: { id: Number(product_id) },
      select: ["id", "name", "product_code"],
    });

    const supplier = await supplierRepo.findOne({
      where: { id: Number(supplier_id) },
      select: ["id", "name"],
    });

    const where: any = {
      product_id: Number(product_id),
      stock_type: 1,
      supplier_id: Number(supplier_id),
    };

    const limit = parseInt(per_page as string, 10);
    const offset = (parseInt(page as string, 10) - 1) * limit;

    const allowedSortFields = ["id", "created_at"];
    const sortField = allowedSortFields.includes(sort_by as string)
      ? sort_by
      : "created_at";
    const sortDirection =
      (sort_dir?.toString().toUpperCase() === "ASC" ? "ASC" : "DESC") as
      | "ASC"
      | "DESC";

    const order: FindOptionsOrder<Products> = {
      [sortField as keyof Products]: sortDirection,
    };

    const [events, total] = await dataSource
      .getRepository(ProductStockEvent)
      .findAndCount({
        where,
        relations: {
          users: true,
          products: true,
          poData: {
            orderData: true,
          },
          // suppliers: true,
          spkData: {
            suppliers: true,
          },
        },
        order,
        take: limit,
        skip: offset,
      });

    const data = events.map((e) => ({
      id: e.id,
      qty: e.qty,
      type: e.type,
      remarks: e.remarks,
      category: e.category,
      created_at: e.created_at,
      stock_type: e.stock_type,
      stock_left: e.stock_left,
      poData: e.poData
        ? { id: e.poData.id, orderData: e.poData.orderData }
        : null,
      user: e.users
        ? { id: e.users.id, name: e.users.name }
        : null,
      product: e.products
        ? {
          id: e.products.id,
          name: e.products.name,
          product_code: e.products.product_code,
          stock: e.products.stock_physical,
        }
        : null,
      // supplier: e.suppliers
      //   ? { id: e.suppliers.id, name: e.suppliers.name }
      //   : null,
      spk: e.spkData
        ? {
          id: e.spkData.id,
          spk_number: e.spkData.spk_number,
          status: e.spkData.status,
          due_date: e.spkData.due_date,
          total: e.spkData.total,
          supplier: e.spkData.suppliers
            ? {
              id: e.spkData.suppliers.id,
              name: e.spkData.suppliers.name,
            }
            : null,
        }
        : null,
    }));

    return res.json({
      success: true,
      supplier: supplier
        ? { id: supplier.id, name: supplier.name }
        : null,
      product: product
        ? { id: product.id, name: product.name, product_code: product.product_code }
        : null,
      data,
      meta: {
        total,
        page: parseInt(page as string),
        per_page: limit,
        total_pages: Math.ceil(total / limit),
        sort_by: sortField,
        sort_dir: sortDirection,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSpkStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      })
    }

    const spkRepo = dataSource.getRepository(InventorySpk)

    const spk = await spkRepo.findOne({
      where: { id: Number(id) }
    })

    if (!spk) {
      return res.status(404).json({
        success: false,
        message: "SPK not found",
      })
    }

    spk.status = status

    await spkRepo.save(spk)

    return res.json({
      success: true,
      message: "Status updated",
      data: {
        id: spk.id,
        status: spk.status,
      },
    })
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: "Error updating status",
      error: err.message,
    })
  }
}

export const goodReceipt = async (req: Request, res: Response) => {
  const queryRunner = dataSource.createQueryRunner();

  try {
    const { spk_id, spk_product_id, qty, receipt, completed_date } = req.body;

    if (!spk_id || !spk_product_id || !qty || !receipt || !completed_date) {
      return res.status(400).json({
        success: false,
        message: "Lengkapi Data",
      });
    }

    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Ambil SPK
    const spk = await queryRunner.manager.findOne(InventorySpk, {
      where: { id: spk_id },
    });
    if (!spk) throw new Error("SPK not found");

    // Ambil SPK Product spesifik
    const spkProduct = await queryRunner.manager.findOne(InventorySpkProduct, {
      where: { id: spk_product_id },
    });

    if (!spkProduct) {
      throw new Error("SPK Product tidak ditemukan");
    }

    // Cek total qty yang sudah masuk sebelumnya
    const totalReceived = await queryRunner.manager.sum(
      InventoryGoodReceived,
      "qty",
      { spk_product_id }
    );

    const existingQty = Number(totalReceived ?? 0);
    const requestQty = Number(qty);
    const allowedQty = Number(spkProduct.qty);

    if (existingQty + requestQty > allowedQty) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({
        success: false,
        message: `Good receipt melebihi quantity.\nAllowed: ${allowedQty}, Existing: ${existingQty}, Request: ${requestQty}`,
      });
    }

    const goodReceived = new InventoryGoodReceived();
    goodReceived.spk_id = spk_id;
    goodReceived.spk_product_id = spk_product_id;
    goodReceived.qty = requestQty;
    goodReceived.user_id = (req as any).user.userId;
    goodReceived.completed_date = new Date(completed_date);

    await queryRunner.manager.save(goodReceived);

    const { img } = await uploadGoodReceipt(receipt, goodReceived.id);

    goodReceived.receipt = img;
    await queryRunner.manager.save(goodReceived);

    if (spk.po_id) {
      // 1. Ambil SPK Product (hanya 1 untuk SPK dengan PO)
      const spkProduct = await queryRunner.manager.findOne(InventorySpkProduct, {
        where: { id: spk_product_id },
      });

      if (!spkProduct) {
        throw new Error("SPK Product not found");
      }

      const targetQty = Number(spkProduct.qty);

      // 2. Hitung total qty good received untuk spk_product_id ini
      const raw = await queryRunner.manager
        .getRepository(InventoryGoodReceived)
        .createQueryBuilder("gr")
        .select("SUM(gr.qty)", "total_qty")
        .where("gr.spk_product_id = :spk_product_id", { spk_product_id })
        .getRawOne();

      const totalReceived = Number(raw?.total_qty || 0);

      const isComplete = totalReceived >= targetQty;

      // 3. Jika qty sudah terpenuhi → update PO
      if (isComplete) {
        const po = await queryRunner.manager.findOne(PurchaseOrder, {
          where: { id: spk.po_id },
        });

        if (po && po.status !== "on progress") {
          po.status = "on progress";
          await queryRunner.manager.save(po);
        }
      }
    }

    // Update stok untuk product ini saja
    const product = await queryRunner.manager.findOne(Products, {
      where: { id: spkProduct.product_id },
    });

    if (!product) {
      throw new Error(`Product ID ${spkProduct.product_id} not found`);
    }

    // update stok
    product.stock_display = Number(product.stock_display) + requestQty;
    product.stock_physical = Number(product.stock_physical) + requestQty;

    await queryRunner.manager.save(product);

    // Stock Event (Physical)
    const stockEventPhysical = new ProductStockEvent();
    stockEventPhysical.product_id = spkProduct.product_id;
    stockEventPhysical.user_id = (req as any).user.userId;
    stockEventPhysical.supplier_id = spk.supplier_id;
    stockEventPhysical.spk_id = spk.id;
    stockEventPhysical.qty = requestQty;
    stockEventPhysical.type = "plus";
    stockEventPhysical.stock_type = 1;
    stockEventPhysical.stock_left = product.stock_physical;
    stockEventPhysical.remarks = "Good Receipt — Physical Stock";
    await queryRunner.manager.save(stockEventPhysical);

    // Stock Event (Display)
    const stockEventDisplay = new ProductStockEvent();
    stockEventDisplay.product_id = spkProduct.product_id;
    stockEventDisplay.user_id = (req as any).user.userId;
    stockEventDisplay.supplier_id = spk.supplier_id;
    stockEventDisplay.spk_id = spk.id;
    stockEventDisplay.qty = requestQty;
    stockEventDisplay.type = "plus";
    stockEventDisplay.stock_type = 2;
    stockEventDisplay.stock_left = product.stock_display;
    stockEventDisplay.remarks = "Good Receipt — Display Stock";
    await queryRunner.manager.save(stockEventDisplay);

    // Logs
    const log = new Logs();
    log.name = `good_receipt_${spkProduct.id}`;
    log.data = JSON.stringify({
      user_id: (req as any).user?.userId ?? null,
      spk_id: spk.id,
      spk_product_id,
      qty: requestQty,
      receipt: img,
      completed_date,
      at: new Date().toISOString(),
    });

    await queryRunner.manager.save(log);

    // Commit
    await queryRunner.commitTransaction();

    return res.json({
      success: true,
      message: "Receipt uploaded & stock updated",
      data: {
        receipt: img,
        completed_date,
      },
    });
  } catch (err: any) {
    await queryRunner.rollbackTransaction();
    return res.status(500).json({
      success: false,
      message: "Error processing good receipt",
      error: err.message,
    });
  } finally {
    await queryRunner.release();
  }
};

export const getGoodReceive = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const spk_id = Number(req.params.spk_id);
    if (isNaN(spk_id)) {
      return res.status(400).json({ success: false, message: "Invalid SPK ID" });
    }

    const goodReceive = await InventoryGoodReceived.find({
      where: { spk_id },
      relations: ["users", "spkProduct", "spkProduct.productsData"],
      order: { id: "DESC" },
    });

    if (!goodReceive || goodReceive.length === 0) {
      return res.status(404).json({ success: false, message: "Data not found" });
    }

    return res.json({
      success: true,
      data: goodReceive,
    });

  } catch (error) {
    next(error);
  }
};