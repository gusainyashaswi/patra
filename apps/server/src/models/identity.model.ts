import { randomUUID } from "node:crypto";
import { Schema, model, type Types, type Model, type HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { schemaOptions } from "./base.js";
import { env } from "../config/env.js";

export interface IUser {
  email: string;
  name?: string;
  fullName?: string;
  password?: string;
  passwordHash?: string;
  avatar?: string;
  isPlatformAdmin: boolean;
}

export interface IUserMethods {
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(permissions?: string[]): string;
  generateRefreshToken(): string;
}

export type UserModel = Model<IUser, Record<string, never>, IUserMethods>;
export type UserDocument = HydratedDocument<IUser, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    avatar: {
      type: String,
      default: "",
    },
    isPlatformAdmin: {
      type: Boolean,
      default: false,
    },
  },
  schemaOptions,
);

// Virtual getters/setters for compatibility with fullName & passwordHash
userSchema
  .virtual("fullName")
  .get(function () {
    return this.name;
  })
  .set(function (val: string) {
    this.name = val;
  });

userSchema
  .virtual("passwordHash")
  .get(function () {
    return this.password;
  })
  .set(function (val: string) {
    this.password = val;
  });

// Pre-save hook: hashes password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next ? next() : undefined;
  }

  this.password = await bcrypt.hash(this.password, 10);
  if (next) next();
});

// Compare password
userSchema.methods.isPasswordCorrect = async function (password: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

// Generate Access Token (Backend2-yuvi standard with Patra RBAC support)
userSchema.methods.generateAccessToken = function (permissions: string[] = []): string {
  return jwt.sign(
    {
      jti: randomUUID(),
      _id: this._id,
      id: this._id.toString(),
      sub: this._id.toString(),
      email: this.email,
      name: this.name,
      fullName: this.name,
      isPlatformAdmin: this.isPlatformAdmin,
      permissions,
    },
    env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: env.ACCESS_TOKEN_EXPIRY as any,
    },
  );
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function (): string {
  return jwt.sign(
    {
      jti: randomUUID(),
      _id: this._id,
      id: this._id.toString(),
      sub: this._id.toString(),
    },
    env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: env.REFRESH_TOKEN_EXPIRY as any,
    },
  );
};

export const User = model<IUser, UserModel>("User", userSchema);

export interface IRefreshToken {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: Date,
  },
  schemaOptions,
);
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const RefreshToken = model<IRefreshToken>("RefreshToken", refreshTokenSchema);

export interface IOrganization {
  name: string;
  slug: string;
  timezone: string;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    timezone: { type: String, default: "UTC" },
  },
  schemaOptions,
);
export const Organization = model<IOrganization>("Organization", organizationSchema);

export interface IRole {
  organizationId?: Types.ObjectId | null;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
}

const roleSchema = new Schema<IRole>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", default: null },
    name: { type: String, required: true },
    description: String,
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
  },
  schemaOptions,
);
roleSchema.index({ organizationId: 1, name: 1 }, { unique: true });
export const Role = model<IRole>("Role", roleSchema);

export interface IMembership {
  userId: Types.ObjectId;
  organizationId: Types.ObjectId;
  roleId: Types.ObjectId;
}

const membershipSchema = new Schema<IMembership>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    roleId: { type: Schema.Types.ObjectId, ref: "Role", required: true },
  },
  schemaOptions,
);
membershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });
membershipSchema.index({ organizationId: 1 });
export const Membership = model<IMembership>("Membership", membershipSchema);
