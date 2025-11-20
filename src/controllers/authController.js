const Users = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getSettings, hasPermission } = require("../utils/helpers");
const RoleUser = require("../models/roleUser");
const Roles = require("../models/roles");
const Permissions = require("../models/permissions");
const PermissionRole = require("../models/permissionRole");

exports.users = async (req, res, next) => {
  try {
    const users = await Users.findAll();

    res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password, remember_me } = req.body;
    const user = await Users.findOne({ where: { email } });

    const role = await RoleUser.findOne({
      where: { user_id: user.id },
      attributes: ["role_id"],
      include: [
        {
          model: Roles,
          as: "rolesData",
          attributes: ["id", "name", "slug"],
        },
      ],
    });

    const permissions = await PermissionRole.findAll({
      where: { role_id: role.role_id },
      include: [
        {
          model: Permissions,
          as: "permissionsData",
          attributes: ["id", "name", "slug"],
        },
      ],
    });

    if (
      !user ||
      !(await bcrypt.compare(password, user.password.replace("$2y$", "$2b$")))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Use 1 year when remember_me is truthy, otherwise 1 day
    const tokenExpiry = "365d";

    const token = jwt.sign(
      {
        userId: user.id,
        userName: user.name,
        email: user.email,
        roleId: role.role_id,
        roleName: role.rolesData.name,
        roleSlug: role.rolesData.slug,
        permissions: permissions.map((p) => p.permissionsData.slug),
      },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roleId: role.role_id,
          roleName: role.rolesData.name,
          roleSlug: role.rolesData.slug,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// exports.logout = async (req, res, next) => {
//   try {
//     res.json({ message: "Logged out successfully" });
//   } catch (err) {
//     next(err);
//   }
// };
