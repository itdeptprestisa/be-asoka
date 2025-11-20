const sequelize = require("../config/db");

// Import models that use the shared sequelize instance
const Users = require("./users");
const Orders = require("./order");
const Customer = require("./customer");
const OrderPayments = require("./orderPayments");
const Cart = require("./cart");
const PurchaseOrder = require("./purchaseOrder");
const Supplier = require("./supplier");
const OrderItems = require("./orderItems");
const Banks = require("./banks");
const OrderSelection = require("./orderSelection");
const Geo = require("./geo");
const OrderProblemsPayments = require("./orderProblemsPayments");
const OrderProblems = require("./orderProblems");
const Products = require("./products");
const CustomerBanks = require("./customerBanks");
const OrderCustomer = require("./orderCustomer");
const PrProblems = require("./prProblems");
const Website = require("./website");
const CustomerAr = require("./customerAr");
const Roles = require("./roles");
const Permissions = require("./permissions");
const ProductCategoryNew = require("./productCategoryNew");
const RoleUser = require("./roleUser");
const PurchaseOrderRating = require("./purchaseOrderRating");
const ProductAttribute = require("./productAttribute");
const ProductAttributePivot = require("./productAttributePivot");
const ProductPriceLog = require("./productPriceLog");
const CapitalPriceProducts = require("./capitalPriceProducts");
const PermissionRole = require("./permissionRole");

// IMPORTANT ! all relation has format {tableName}Data, except orderData and ownerData (which supposed to be ordersData) because it already set in many codes

// products relationship
Products.belongsTo(ProductCategoryNew, {
  foreignKey: "category_id",
  as: "productCategoryNewData",
});
Products.belongsTo(ProductCategoryNew, { foreignKey: "category_id" });
Products.belongsTo(Supplier, { foreignKey: "supplier_id", as: "supplierData" });
Products.belongsTo(PurchaseOrder, {
  foreignKey: "id",
  as: "purchaseOrderData",
});
Products.hasMany(ProductPriceLog, { foreignKey: "product_id" });
Products.hasMany(CapitalPriceProducts, { foreignKey: "product_id" });
Products.belongsToMany(ProductAttribute, {
  through: ProductAttributePivot,
  foreignKey: "product_id",
  otherKey: "product_attribute_id",
  as: "productAttributeData",
});
Products.hasMany(ProductAttributePivot, {
  foreignKey: "product_id",
  as: "productAttributePivotData",
});
Products.belongsToMany(ProductAttribute, {
  through: ProductAttributePivot,
  foreignKey: "product_id",
  otherKey: "product_attribute_id",
  as: "occasionAttribute",
});

Products.belongsToMany(ProductAttribute, {
  through: ProductAttributePivot,
  foreignKey: "product_id",
  otherKey: "product_attribute_id",
  as: "variantAttribute",
});

// orders relationship
Orders.belongsTo(Customer, {
  foreignKey: "customer_id",
  as: "customerData",
});
Orders.belongsTo(Users, { as: "ownerData", foreignKey: "owner" });
Orders.hasMany(OrderItems, { as: "orderItemsData", foreignKey: "order_id" });
Orders.hasMany(PurchaseOrder, {
  as: "purchaseOrderData",
  foreignKey: "order_id",
});
Orders.hasMany(OrderPayments, {
  as: "orderPaymentsData",
  foreignKey: "order_id",
});
Orders.hasMany(OrderProblems, {
  as: "orderProblemsData",
  foreignKey: "order_id",
});
Orders.hasOne(OrderCustomer, {
  as: "orderCustomerData",
  foreignKey: "order_id",
});
Orders.belongsTo(Website, { as: "websiteData", foreignKey: "website" });
Orders.hasMany(PrProblems, { as: "prProblemsData", foreignKey: "order_id" });

// customer relationship
Customer.hasMany(Orders, {
  foreignKey: "customer_id",
});
// Customer.belongsTo(Banks, {
//   as: "bankData",
//   foreignKey: "payment_method",
// });
Customer.hasOne(CustomerBanks, {
  as: "customerBanksData",
  foreignKey: "customer_id",
});
Customer.hasOne(CustomerAr, {
  as: "customerArData",
  foreignKey: "customer_id",
});

// order payments relationship
OrderPayments.belongsTo(Orders, {
  foreignKey: "order_id",
});
OrderPayments.belongsTo(Banks, {
  as: "bankData",
  foreignKey: "payment_method",
});
OrderPayments.belongsTo(Users, {
  as: "usersData",
  foreignKey: "user_id",
});

// purchase order relationship
PurchaseOrder.belongsTo(Supplier, {
  as: "supplierData",
  foreignKey: "supplier_id",
});
PurchaseOrder.belongsTo(Orders, { as: "orderData", foreignKey: "order_id" });
PurchaseOrder.belongsTo(Users, { as: "ownerData", foreignKey: "owner" });
PurchaseOrder.belongsTo(Customer, {
  as: "customerData",
  foreignKey: "customer_id",
});
PurchaseOrder.belongsTo(OrderItems, {
  as: "orderItemsData",
  foreignKey: "pr_id",
});
PurchaseOrder.hasOne(PurchaseOrderRating, {
  as: "purchaseOrderRatingData",
  foreignKey: "po_id",
});

// order items relationship
OrderItems.belongsTo(Orders, { as: "orderData", foreignKey: "order_id" });
OrderItems.belongsTo(Geo, { as: "geoCityData", foreignKey: "city" });
OrderItems.belongsTo(Geo, { as: "geoProvinceData", foreignKey: "province" });
OrderItems.belongsTo(Geo, { as: "geoCountryData", foreignKey: "country" });
OrderItems.belongsTo(Products, {
  as: "productsData",
  foreignKey: "product_id",
});
OrderItems.belongsTo(PurchaseOrder, {
  as: "purchaseOrderData",
  foreignKey: "order_id",
});

// order selection relationship
OrderSelection.belongsTo(OrderItems, {
  as: "orderItemsData",
  foreignKey: "pr_id",
});

// order problem payments relationship
OrderProblemsPayments.belongsTo(Orders, {
  as: "orderData",
  foreignKey: "order_id",
});
OrderProblemsPayments.belongsTo(OrderProblems, {
  as: "orderProblemsData",
  foreignKey: "order_id",
});

// order problem relationship
OrderProblems.belongsTo(OrderProblemsPayments, {
  as: "orderProblemsPaymentsData",
  foreignKey: "order_id",
});

// pr problems relationship
PrProblems.belongsTo(Users, {
  as: "ownerData",
  foreignKey: "owner",
});

// users relationship
Users.belongsToMany(Roles, {
  through: "role_user",
  as: "rolesData",
  foreignKey: "user_id",
});
Users.hasMany(RoleUser, {
  foreignKey: "user_id",
  as: "roleUserData",
});

// role user relationship
RoleUser.belongsTo(Users, {
  foreignKey: "user_id",
  as: "usersData",
});
RoleUser.belongsTo(Roles, {
  foreignKey: "role_id",
  as: "rolesData",
});

// roles relationship
Roles.belongsToMany(Users, {
  through: "role_user",
  as: "usersData",
  foreignKey: "role_id",
});
Roles.belongsToMany(Permissions, {
  through: "permission_role",
  as: "permissionsData",
  foreignKey: "role_id",
});
Roles.belongsToMany(PermissionRole, {
  through: "permission_role",
  as: "permissionRoleData",
  foreignKey: "role_id",
});

// supplier relationship
Supplier.belongsTo(Geo, { as: "geoCityData", foreignKey: "city" });
Supplier.belongsTo(Geo, { as: "geoProvinceData", foreignKey: "province" });
Supplier.belongsTo(Geo, { as: "geoCountryData", foreignKey: "country" });

// permissions relationship
Permissions.belongsToMany(Roles, {
  through: "permission_role",
  as: "rolesData",
  foreignKey: "permission_id",
});

// purchase order rating relationship
PurchaseOrderRating.belongsTo(PurchaseOrder, {
  as: "purchaseOrderData",
  foreignKey: "po_id",
});
PurchaseOrderRating.belongsTo(Users, {
  as: "usersData",
  foreignKey: "po_id",
});

ProductAttribute.belongsToMany(Products, {
  through: ProductAttributePivot,
  foreignKey: "product_attribute_id", // column on pivot that points to ProductAttribute
  otherKey: "product_id", // column on pivot that points to Products
  as: "productsData",
});
ProductAttribute.hasMany(ProductAttributePivot, {
  foreignKey: "product_attribute_id",
  as: "productAttributePivotData",
});

ProductPriceLog.belongsTo(Products, { foreignKey: "product_id" });
ProductPriceLog.belongsTo(Users, { foreignKey: "user_id" });

ProductAttributePivot.belongsTo(Products, {
  foreignKey: "product_id",
  as: "productsData",
});
ProductAttributePivot.belongsTo(ProductAttribute, {
  foreignKey: "product_attribute_id",
  as: "productAttributeData",
});

PermissionRole.belongsTo(Permissions, {
  foreignKey: "permission_id",
  as: "permissionsData",
});

// Init DB
const initDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Sequelize Connected");
    // await sequelize.sync(); // BEWARE! this creating table if doesnt exist
  } catch (err) {
    console.error("❌ Sequelize Connection Failed:", err);
  }
};

module.exports = {
  sequelize,
  initDB,
  Users,
  Orders,
  Customer,
  OrderPayments,
};
