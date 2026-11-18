import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, Membership, Role } from "../models/identity.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { env } from "../config/env.js";

export const verifyJwt = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "") ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized Request - No token provided");
    }

    const decodedToken = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as {
      _id?: string;
      id?: string;
      sub?: string;
      email?: string;
      permissions?: string[];
      organizationId?: string;
    };

    const userId = decodedToken?._id || decodedToken?.sub || decodedToken?.id;
    if (!userId) {
      throw new ApiError(401, "Invalid Access Token payload");
    }

    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid Access Token - User not found");
    }

    let permissions = decodedToken?.permissions || [];
    let organizationId = decodedToken?.organizationId;

    if (!permissions.length) {
      const membership = await Membership.findOne({ userId: user._id });
      if (membership) {
        organizationId = membership.organizationId.toString();
        const role = await Role.findById(membership.roleId);
        if (role && role.permissions?.length) {
          permissions = role.permissions;
        }
      } else {
        permissions = [
          "manage_transport",
          "manage_senders",
          "manage_templates",
          "manage_contacts",
          "manage_campaigns",
          "send_campaigns",
          "view_overview",
          "manage_org",
        ];
      }
    }

    if (user.isPlatformAdmin && !permissions.includes("*")) {
      permissions = ["*", ...permissions];
    }

    const userObj = user.toObject ? user.toObject() : user;
    req.user = {
      ...userObj,
      _id: user._id,
      id: user._id.toString(),
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      fullName: user.name,
      isPlatformAdmin: user.isPlatformAdmin,
      permissions,
      organizationId,
    };

    next();
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});

export const requireAuth = verifyJwt;
