import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/identity.model.js";
import { Organization } from "../models/identity.model.js";
import { Role } from "../models/identity.model.js";
import { Membership } from "../models/identity.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
};

export const generateAccessAndRefreshToken = async (userId: any) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Default permissions for Patra MVP owner
    let permissions = [
      "manage_transport",
      "manage_senders",
      "manage_templates",
      "manage_contacts",
      "manage_campaigns",
      "send_campaigns",
      "view_overview",
      "manage_org",
    ];

    const membership = await Membership.findOne({ userId: user._id });
    if (membership) {
      const role = await Role.findById(membership.roleId);
      if (role && role.permissions?.length) {
        permissions = role.permissions;
      }
    }

    if (user.isPlatformAdmin && !permissions.includes("*")) {
      permissions = ["*", ...permissions];
    }

    const accessToken = user.generateAccessToken(permissions);
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken, token: accessToken };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      `Something went wrong while generating Access and Refresh tokens: ${error?.message || error}`,
    );
  }
};

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, fullName } = req.body;
  const userName = name || fullName;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  if (typeof email !== "string" || !email.includes("@")) {
    throw new ApiError(400, "A valid email address is required");
  }

  if (typeof password !== "string" || password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  const existedUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existedUser) {
    throw new ApiError(409, "User with email already exists!");
  }

  const user = await User.create({
    email: email.toLowerCase().trim(),
    name: userName?.trim() || email.split("@")[0],
    password,
  });

  // New accounts own a separate organization. Existing organizations require explicit membership.
  const org = await Organization.create({
    name: `${user.name || "Owner"}'s Organization`,
    slug: `org-${user._id.toString()}`,
    timezone: "UTC",
  });

  const role = await Role.findOneAndUpdate(
    { name: "org_admin", organizationId: null },
    { $setOnInsert: {
      description: "Organization Administrator with full access",
      permissions: [
        "manage_transport",
        "manage_senders",
        "manage_templates",
        "manage_contacts",
        "manage_campaigns",
        "send_campaigns",
        "view_overview",
        "manage_org",
      ],
      isSystem: true,
    } },
    { upsert: true, new: true, runValidators: true },
  );

  await Membership.findOneAndUpdate(
    { userId: user._id, organizationId: org._id },
    { userId: user._id, organizationId: org._id, roleId: role._id },
    { upsert: true, new: true },
  );

  const { accessToken, refreshToken, token } = await generateAccessAndRefreshToken(user._id);
  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        201,
        {
          user: createdUser,
          accessToken,
          refreshToken,
          token,
          organization: org,
        },
        "User Created Successfully!",
      ),
    );
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  const identifier = (email || username || "").toString().trim().toLowerCase();

  if (!identifier || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const existedUser = await User.findOne({
    $or: [{ email: identifier }],
  }).select("+password +refreshToken");

  if (!existedUser) {
    throw new ApiError(401, "That email and password don't match.");
  }

  const isPasswordValid = await existedUser.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "That email and password don't match.");
  }

  const { accessToken, refreshToken, token } = await generateAccessAndRefreshToken(existedUser._id);
  const loggedInUser = await User.findById(existedUser._id).select("-password -refreshToken");

  const membership = await Membership.findOne({ userId: existedUser._id }).populate(
    "organizationId roleId",
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
          token,
          membership,
        },
        "User LoggedIn Successfully",
      ),
    );
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?._id) {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      },
    );
  }

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User LoggedOut Successfully!!"));
});

export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken || req.body?.refreshAccessToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request - Refresh token is missing");
  }

  try {
    const refreshSecret =
      process.env.REFRESH_TOKEN_SECRET ||
      process.env.JWT_REFRESH_SECRET ||
      "patra_jwt_refresh_secret_super_secure_key_987654321";

    const decodedToken = jwt.verify(incomingRefreshToken, refreshSecret) as {
      _id?: string;
      id?: string;
      sub?: string;
    };

    const userId = decodedToken?._id || decodedToken?.sub || decodedToken?.id;
    const user = await User.findById(userId).select("+refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (!user.refreshToken || incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token expired or already used");
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
      token,
    } = await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken, token },
          "Access token Refreshed",
        ),
      );
  } catch (error: any) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const membership = await Membership.findOne({ userId: req.user?._id }).populate(
    "organizationId roleId",
  );
  const userData = {
    ...req.user,
    membership,
  };
  return res.status(200).json(new ApiResponse(200, userData, "Current User fetched successfully"));
});

export const changeCurrentPassword = asyncHandler(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }

  if (typeof newPassword !== "string" || newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters long");
  }

  const user = await User.findById(req.user?._id).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Old Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "Password Changed Successfully"));
});
