import { Request, Response, NextFunction } from "express";
import { RoleUser } from "../entities/RoleUser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dataSource from "../config/dataSource";
import { Users } from "../entities/Users";
import { PermissionRole } from "../entities/PermissionRole";

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, remember_me } = req.body;

    const UserRepository = dataSource.getRepository(Users);
    const RoleUserRepository = dataSource.getRepository(RoleUser);
    const PermissionRoleRepository = dataSource.getRepository(PermissionRole);

    const user = await UserRepository.findOne({ where: { email } });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password.replace("$2y$", "$2b$")
    );
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const roleUser = await RoleUserRepository.findOne({
      where: { user_id: user.id },
      relations: { rolesData: true },
    });

    if (!roleUser || !roleUser.rolesData) {
      return res
        .status(403)
        .json({ success: false, message: "Role not assigned" });
    }

    const permissionRoles = await PermissionRoleRepository.find({
      where: { role_id: roleUser.role_id },
      relations: { permissionsData: true },
    });

    const tokenExpiry = remember_me ? "365d" : "1d";

    const token = jwt.sign(
      {
        userId: user.id,
        userName: user.name,
        email: user.email,
        roleId: roleUser.role_id,
        roleName: roleUser.rolesData.name,
        roleSlug: roleUser.rolesData.slug,
        permissions: permissionRoles.map((p) => p.permissionsData.slug),
      },
      process.env.JWT_SECRET!,
      { expiresIn: tokenExpiry }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roleId: roleUser.role_id,
          roleName: roleUser.rolesData.name,
          roleSlug: roleUser.rolesData.slug,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};
